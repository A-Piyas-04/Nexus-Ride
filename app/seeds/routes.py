from sqlmodel import Session, select
from app.models.route import Route, RouteStop

def seed_routes(session: Session):
    route_definitions = {
        "Route-1": [
            "Tongi Station Road",
            "Uttara Sector 7",
            "Airport",
            "Banani",
            "Mohakhali",
            "Farmgate",
        ],
        "Route-2": [
            "Abdullahpur",
            "Mirpur 10",
            "Agargaon",
            "Bijoy Sarani",
            "Shahbagh",
            "Motijheel",
        ],
    }

    for route_name, stops in route_definitions.items():
        route = session.exec(
            select(Route).where(Route.route_name == route_name)
        ).first()
        if not route:
            route = Route(route_name=route_name, is_active=True)
            session.add(route)
            session.commit()
            session.refresh(route)

        for index, stop_name in enumerate(stops, start=1):
            existing_stop = session.exec(
                select(RouteStop).where(RouteStop.stop_name == stop_name)
            ).first()
            if not existing_stop:
                session.add(
                    RouteStop(
                        route_id=route.id,
                        stop_name=stop_name,
                        sequence_number=index,
                    )
                )

    session.commit()
