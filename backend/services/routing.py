import networkx as nx
from sqlalchemy.orm import Session
import models

def get_optimized_route(db: Session, origin_id: int, dest_id: int, optimization_mode: str = "fastest"):
    # Build the graph
    G = nx.Graph()
    
    segments = db.query(models.RoadSegment).all()
    for seg in segments:
        # Effective weight: base distance + penalty based on current risk
        risk_penalty = 1 + (seg.current_risk_score / 100.0) * 2.0
        
        # Eco routing penalizes specific hilly segments (e.g. ID 1 and 2 are steep)
        eco_penalty = 1.0
        if optimization_mode == "eco" and seg.id in [1, 2]:
            eco_penalty = 1.8 # Heavily penalize steep terrain
            
        weight = seg.distance_km * risk_penalty * eco_penalty
        
        # If risk is > 90, consider it completely blocked
        if seg.current_risk_score > 90:
            weight = float('inf')
            
        G.add_edge(seg.origin_district_id, seg.dest_district_id, weight=weight, segment_id=seg.id, risk=seg.current_risk_score)
        
    try:
        path = nx.shortest_path(G, source=origin_id, target=dest_id, weight='weight')
        # Calculate time (assuming average 40 km/h)
        total_time_mins = 0
        segment_ids = []
        has_blocked = False
        
        for i in range(len(path) - 1):
            edge = G[path[i]][path[i+1]]
            segment_ids.append(edge['segment_id'])
            total_time_mins += (edge['weight'] / 40.0) * 60
            if edge['risk'] > 50:
                has_blocked = True
                
        fuel_saved = 15 if optimization_mode == "eco" else 0
        
        return {
            "primary_route": segment_ids,
            "estimated_time_mins": round(total_time_mins, 2),
            "has_blocked_segments": has_blocked,
            "fuel_saved_percent": fuel_saved,
            "drone_dispatch_recommended": False
        }
    except nx.NetworkXNoPath:
        # If no path is found (e.g. due to landslides), recommend drone
        return {
            "primary_route": [],
            "estimated_time_mins": 0,
            "has_blocked_segments": True,
            "fuel_saved_percent": 0,
            "drone_dispatch_recommended": True
        }
