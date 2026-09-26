from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db, Base
import models
import schemas
import asyncio
import json
import random
import math
import base64
import google.generativeai as genai
import os
from dotenv import load_dotenv
load_dotenv()

api_key = os.environ.get("AI_COPILOT", "")
if api_key:
    genai.configure(api_key=api_key)
# Create tables if not exist (mostly handled by seed, but good to have)
Base.metadata.create_all(bind=engine)

from database import SessionLocal
import models
import seed
db = SessionLocal()
if db.query(models.District).count() == 0:
    seed.seed_data()
db.close()

app = FastAPI(title="LogiPredict AI NER Edition Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                pass

manager = ConnectionManager()

@app.get("/")
def read_root():
    return {"message": "Welcome to LogiPredict AI API"}

@app.get("/api/dashboard")
def get_dashboard_data(db: Session = Depends(get_db)):
    districts = db.query(models.District).all()
    segments = db.query(models.RoadSegment).all()
    vehicles = db.query(models.Vehicle).all()
    incidents = db.query(models.IncidentReport).all()
    alerts = db.query(models.Alert).order_by(models.Alert.created_at.desc()).limit(10).all()
    return {
        "districts": districts,
        "segments": segments,
        "vehicles": vehicles,
        "incidents": incidents,
        "alerts": alerts
    }

@app.post("/api/incidents")
async def create_incident(incident: schemas.IncidentReportCreate, db: Session = Depends(get_db)):
    incident_data = incident.dict()
    relayed = incident_data.pop("relayed_via_mesh", False)
    db_incident = models.IncidentReport(**incident_data)
    db.add(db_incident)
    
    # Always create an alert for the field report itself
    incident_msg = f"[{incident.severity.upper()}] {incident.incident_type} reported by {incident.reporter_name}."
    if relayed:
        incident_msg += " (Relayed via Mesh Node)"
    
    report_alert = models.Alert(
        type="FIELD_REPORT",
        message=incident_msg,
        severity="HIGH" if incident.severity == "blocked" else "MEDIUM",
        road_segment_id=incident.road_segment_id
    )
    db.add(report_alert)
    db.commit()
    db.refresh(db_incident)
    
    # Simple risk score update logic: if severe, bump the risk score of the segment
    segment = db.query(models.RoadSegment).filter(models.RoadSegment.id == incident.road_segment_id).first()
    if segment:
        increase = 0
        if incident.severity == "blocked":
            increase = 60
        elif incident.severity == "partial":
            increase = 30
        
        segment.current_risk_score = min(100.0, segment.current_risk_score + increase)
        
        if segment.current_risk_score > 50:
            msg = f"High risk detected on {segment.name} due to {incident.incident_type}."
            if incident.relayed_via_mesh:
                msg += " (Relayed via Mesh Node)"
            alert = models.Alert(
                type="CRITICAL_RISK",
                message=msg,
                severity="HIGH",
                road_segment_id=segment.id
            )
            db.add(alert)
        
        db.commit()
        
        # Broadcast update to clients
        await manager.broadcast({
            "type": "NEW_INCIDENT",
            "data": schemas.IncidentReport.from_orm(db_incident).dict()
        })
        
        # Broadcast the new report alert
        await manager.broadcast({
            "type": "NEW_ALERT",
            "data": {
                "message": report_alert.message, 
                "severity": report_alert.severity, 
                "type": report_alert.type,
                "created_at": str(report_alert.created_at)
            }
        })

        if segment.current_risk_score > 50:
             await manager.broadcast({
                 "type": "NEW_ALERT",
                 "data": {"message": f"High risk detected on {segment.name}", "severity": "HIGH", "type": "CRITICAL_RISK"}
             })
             
    return db_incident

from services.routing import get_optimized_route
from pydantic import BaseModel

@app.post("/api/route", response_model=schemas.RouteResponse)
def compute_route(request: schemas.RouteRequest, db: Session = Depends(get_db)):
    route = get_optimized_route(db, request.origin_district_id, request.dest_district_id, request.optimization_mode)
    if route is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No route found between these districts.")
    return route

class ChatRequest(BaseModel):
    message: str

@app.post("/api/chat")
async def chat_with_copilot(req: ChatRequest, db: Session = Depends(get_db)):
    if not api_key:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail="AI_COPILOT key is missing on the server.")
        
    districts = db.query(models.District).all()
    segments = db.query(models.RoadSegment).all()
    incidents = db.query(models.IncidentReport).all()
    
    context = "System Context for AI Copilot:\n"
    context += "You are LogiPredict AI, an advanced logistics routing and risk assessment assistant for the North Eastern Region (NER) of India.\n"
    context += "Current Road Risks:\n"
    for s in segments:
        if s.current_risk_score > 50:
            context += f"- High Risk: {s.name} (Risk Score: {s.current_risk_score})\n"
    
    context += "\nActive Incidents:\n"
    for i in incidents:
        context += f"- {i.incident_type} (Severity: {i.severity}) at Lat: {i.lat}, Lng: {i.lng}. Notes: {i.notes}\n"
        
    context += f"\nUser Query: {req.message}\n"
    context += "Answer concisely and professionally."
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        response = model.generate_content(context)
        return {"response": response.text.strip()}
    except Exception as e:
        return {"response": f"Error consulting AI model: {str(e)}"}

class WeatherSimRequest(BaseModel):
    active: bool

class VisionRequest(BaseModel):
    photo_url: str
    incident_type: str

@app.post("/api/weather/toggle")
async def toggle_weather(req: WeatherSimRequest, db: Session = Depends(get_db)):
    # Simulate heavy monsoon over critical segments (e.g., Shillong/Guwahati)
    segments = db.query(models.RoadSegment).all()
    for seg in segments:
        if req.active:
            if seg.id in [1, 2]: # Mock vulnerable mountain segments
                seg.current_risk_score = 95.0
                alert = models.Alert(
                    type="SEVERE_WEATHER",
                    message=f"Monsoon Warning: Imminent landslide risk on {seg.name}.",
                    severity="HIGH",
                    road_segment_id=seg.id
                )
                db.add(alert)
                await manager.broadcast({
                    "type": "NEW_ALERT",
                    "data": {"message": alert.message, "severity": "HIGH", "type": alert.type}
                })
        else:
            # Revert to base risk
            seg.current_risk_score = seg.base_risk_score
    
    db.commit()
    # Broadcast updated segments so frontend map refreshes colors
    await manager.broadcast({"type": "REFRESH_MAP"})
    return {"status": "success"}

@app.get("/api/predict/{segment_id}")
def predict_segment_risk(segment_id: int, db: Session = Depends(get_db)):
    segment = db.query(models.RoadSegment).filter(models.RoadSegment.id == segment_id).first()
    if not segment:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Segment not found")
        
    # Heuristic algorithm for prediction
    # Base risk factor based on topological history
    base = segment.base_risk_score
    
    forecast = []
    current_volatility = segment.current_risk_score - base
    
    # 7-day forecast
    for day in range(7):
        # 1. Simulate soil saturation accumulation (increases risk if base is high)
        soil_saturation_modifier = (base / 100.0) * (day * 2) 
        
        # 2. Add seasonal monsoon variance (random walk)
        weather_variance = random.uniform(-5.0, 15.0)
        
        # 3. Apply inertia (current volatility fades out over time)
        inertia = current_volatility * math.exp(-day / 3.0)
        
        prob = base + soil_saturation_modifier + weather_variance + inertia
        
        # Clamp between 0 and 100
        prob = max(5.0, min(99.0, prob))
        
        forecast.append({
            "day": f"Day {day+1}",
            "probability": round(prob, 1)
        })
        
    return {
        "segment_id": segment_id,
        "segment_name": segment.name,
        "base_risk": base,
        "forecast": forecast
    }

@app.post("/api/vision/analyze")
async def analyze_vision(req: VisionRequest):
    try:
        if "," in req.photo_url:
            mime_type = req.photo_url.split(";")[0].split(":")[1]
            base64_data = req.photo_url.split(",")[1]
        else:
            mime_type = "image/jpeg"
            base64_data = req.photo_url
            
        image_bytes = base64.b64decode(base64_data)
        
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        prompt = f"You are an AI computer vision agent for a logistics dashboard in the North Eastern Region of India. The field officer has selected the incident type as '{req.incident_type}'. Analyze this image and provide a highly technical, realistic assessment of what you see. Keep it under 3 sentences. Start with '[AI VISION REPORT] Analysis:'."
        
        image_parts = [
            {
                "mime_type": mime_type,
                "data": image_bytes
            }
        ]
        
        response = model.generate_content([prompt, image_parts[0]])
        desc = response.text.strip()
        return {"description": desc}
    except Exception as e:
        print(f"Vision API Error: {e}")
        return {"description": f"[AI VISION ERROR] Could not process image. Fallback logic engaged."}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # client might ping
    except WebSocketDisconnect:
        manager.disconnect(websocket)
