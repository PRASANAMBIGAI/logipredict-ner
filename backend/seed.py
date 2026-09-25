from database import engine, SessionLocal, Base
from models import District, RoadSegment, IncidentReport, Vehicle, WeatherSnapshot, Alert
import random

def seed_data():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 15 Districts in NER
    districts_data = [
        {"name": "Guwahati (Assam)", "lat": 26.1445, "lng": 91.7362},
        {"name": "Shillong (Meghalaya)", "lat": 25.5788, "lng": 91.8933},
        {"name": "Imphal (Manipur)", "lat": 24.8170, "lng": 93.9368},
        {"name": "Aizawl (Mizoram)", "lat": 23.7271, "lng": 92.7176},
        {"name": "Silchar (Assam)", "lat": 24.8333, "lng": 92.7789},
        {"name": "Agartala (Tripura)", "lat": 23.8315, "lng": 91.2868},
        {"name": "Kohima (Nagaland)", "lat": 25.6751, "lng": 94.1086},
        {"name": "Itanagar (Arunachal)", "lat": 27.0844, "lng": 93.6053},
        {"name": "Gangtok (Sikkim)", "lat": 27.3389, "lng": 88.6065},
        {"name": "Tawang (Arunachal)", "lat": 27.5861, "lng": 91.8594},
        {"name": "Tezpur (Assam)", "lat": 26.6528, "lng": 92.7926},
        {"name": "Dibrugarh (Assam)", "lat": 27.4728, "lng": 94.9120},
        {"name": "Dimapur (Nagaland)", "lat": 25.9060, "lng": 93.7274},
        {"name": "Jorhat (Assam)", "lat": 26.7509, "lng": 94.2037},
        {"name": "Tura (Meghalaya)", "lat": 25.5145, "lng": 90.2033}
    ]
    
    districts = [District(**d) for d in districts_data]
    db.add_all(districts)
    db.commit()
    
    for d in districts:
        db.refresh(d)

    # Helper function to get district ID
    def get_d(name):
        return db.query(District).filter_by(name=name).first()

    # Create interconnecting road segments to build a realistic network graph
    edges = [
        # Major Arteries
        ("Guwahati (Assam)", "Shillong (Meghalaya)", 98.0, 15.0),
        ("Guwahati (Assam)", "Tezpur (Assam)", 180.0, 10.0),
        ("Guwahati (Assam)", "Tura (Meghalaya)", 220.0, 20.0),
        ("Tezpur (Assam)", "Itanagar (Arunachal)", 160.0, 35.0),
        ("Tezpur (Assam)", "Tawang (Arunachal)", 320.0, 50.0), # High risk mountain pass
        ("Tezpur (Assam)", "Jorhat (Assam)", 165.0, 10.0),
        ("Jorhat (Assam)", "Dibrugarh (Assam)", 140.0, 10.0),
        ("Jorhat (Assam)", "Dimapur (Nagaland)", 135.0, 15.0),
        ("Dimapur (Nagaland)", "Kohima (Nagaland)", 75.0, 30.0),
        ("Kohima (Nagaland)", "Imphal (Manipur)", 140.0, 35.0),
        
        # Southern NER connections
        ("Shillong (Meghalaya)", "Silchar (Assam)", 210.0, 40.0),
        ("Silchar (Assam)", "Imphal (Manipur)", 250.0, 45.0),
        ("Silchar (Assam)", "Aizawl (Mizoram)", 170.0, 50.0),
        ("Silchar (Assam)", "Agartala (Tripura)", 290.0, 25.0),
        
        # Alternative cross-connections
        ("Guwahati (Assam)", "Silchar (Assam)", 315.0, 25.0),
        ("Dibrugarh (Assam)", "Itanagar (Arunachal)", 195.0, 20.0),
        ("Guwahati (Assam)", "Gangtok (Sikkim)", 530.0, 40.0), # Very long route
        ("Dimapur (Nagaland)", "Silchar (Assam)", 260.0, 35.0),
        ("Imphal (Manipur)", "Aizawl (Mizoram)", 320.0, 60.0), # Extreme risk mountain terrain
    ]

    segments = []
    for o_name, d_name, dist, risk in edges:
        origin = get_d(o_name)
        dest = get_d(d_name)
        segments.append(
            RoadSegment(
                name=f"{o_name.split()[0]}-{d_name.split()[0]} Highway",
                start_lat=origin.lat,
                start_lng=origin.lng,
                end_lat=dest.lat,
                end_lng=dest.lng,
                origin_district_id=origin.id,
                dest_district_id=dest.id,
                distance_km=dist,
                base_risk_score=risk,
                current_risk_score=risk
            )
        )
    
    db.add_all(segments)
    db.commit()

    # Vehicles
    vehicles = [
        Vehicle(vehicle_number="AS-01-HC-1234", cargo_type="Medicine", current_lat=25.8, current_lng=91.8, status="in_transit"),
        Vehicle(vehicle_number="ML-05-AB-9999", cargo_type="Food", current_lat=25.0, current_lng=92.0, status="delayed"),
        Vehicle(vehicle_number="MN-01-ZZ-0001", cargo_type="Construction", current_lat=24.82, current_lng=93.5, status="stuck")
    ]
    db.add_all(vehicles)
    db.commit()
    print("Seeding complete.")
    db.close()

if __name__ == "__main__":
    seed_data()
