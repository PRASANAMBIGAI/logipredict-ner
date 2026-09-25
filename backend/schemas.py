from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DistrictBase(BaseModel):
    name: str
    lat: float
    lng: float

class District(DistrictBase):
    id: int
    class Config:
        from_attributes = True

class RoadSegmentBase(BaseModel):
    name: str
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    origin_district_id: int
    dest_district_id: int
    base_risk_score: float
    current_risk_score: float
    distance_km: float

class RoadSegment(RoadSegmentBase):
    id: int
    class Config:
        from_attributes = True

class IncidentReportCreate(BaseModel):
    road_segment_id: int
    reporter_name: str
    incident_type: str
    severity: str
    photo_url: Optional[str] = None
    notes: Optional[str] = None
    lat: float
    lng: float
    timestamp: Optional[datetime] = None
    sync_status: Optional[str] = "synced"
    relayed_via_mesh: Optional[bool] = False

class IncidentReport(IncidentReportCreate):
    id: int
    timestamp: datetime
    class Config:
        from_attributes = True

class VehicleBase(BaseModel):
    vehicle_number: str
    cargo_type: str
    current_lat: float
    current_lng: float
    status: str
    route_id: Optional[str] = None

class Vehicle(VehicleBase):
    id: int
    last_updated: datetime
    class Config:
        from_attributes = True

class AlertBase(BaseModel):
    type: str
    message: str
    severity: str
    road_segment_id: Optional[int] = None
    resolved: bool = False

class Alert(AlertBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class RouteRequest(BaseModel):
    origin_district_id: int
    dest_district_id: int
    optimization_mode: Optional[str] = "fastest"

class RouteResponse(BaseModel):
    primary_route: List[int] # List of segment IDs
    estimated_time_mins: float
    alternate_route: Optional[List[int]] = None
    has_blocked_segments: bool = False
    fuel_saved_percent: Optional[int] = 0
    drone_dispatch_recommended: Optional[bool] = False
