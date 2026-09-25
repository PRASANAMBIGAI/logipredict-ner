from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
import datetime
from database import Base

class District(Base):
    __tablename__ = "districts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    lat = Column(Float)
    lng = Column(Float)

class RoadSegment(Base):
    __tablename__ = "road_segments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    start_lat = Column(Float)
    start_lng = Column(Float)
    end_lat = Column(Float)
    end_lng = Column(Float)
    origin_district_id = Column(Integer, ForeignKey("districts.id"))
    dest_district_id = Column(Integer, ForeignKey("districts.id"))
    base_risk_score = Column(Float, default=0.0)
    current_risk_score = Column(Float, default=0.0)
    distance_km = Column(Float, default=10.0)
    
    origin_district = relationship("District", foreign_keys=[origin_district_id])
    dest_district = relationship("District", foreign_keys=[dest_district_id])

class IncidentReport(Base):
    __tablename__ = "incident_reports"
    id = Column(Integer, primary_key=True, index=True)
    road_segment_id = Column(Integer, ForeignKey("road_segments.id"))
    reporter_name = Column(String)
    incident_type = Column(String) # landslide/flood/road_damage/bridge_damage/breakdown/other
    severity = Column(String) # passable/partial/blocked
    photo_url = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    lat = Column(Float)
    lng = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    sync_status = Column(String, default="synced")
    
    road_segment = relationship("RoadSegment")

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String, index=True)
    cargo_type = Column(String)
    current_lat = Column(Float)
    current_lng = Column(Float)
    status = Column(String) # in_transit/delayed/delivered/stuck
    route_id = Column(String, nullable=True)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)

class WeatherSnapshot(Base):
    __tablename__ = "weather_snapshots"
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"))
    rainfall_mm = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    risk_contribution = Column(Float)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)
    message = Column(String)
    severity = Column(String)
    road_segment_id = Column(Integer, ForeignKey("road_segments.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved = Column(Boolean, default=False)
