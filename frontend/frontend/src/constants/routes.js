export const ROUTE_DEFINITIONS = [
  {
    id: 'route-1',
    route_name: 'Route-1',
    stops: [
      'Tongi Station Road',
      'Uttara Sector 7',
      'Airport',
      'Banani',
      'Mohakhali',
      'Farmgate',
    ],
  },
  {
    id: 'route-2',
    route_name: 'Route-2',
    stops: [
      'Abdullahpur',
      'Mirpur 10',
      'Agargaon',
      'Bijoy Sarani',
      'Shahbagh',
      'Motijheel',
    ],
  },
];

export const ROUTE_VEHICLES = {
  'to-campus': {
    'route-1': [
      {
        id: 'veh-208',
        number: 'NR-208',
        driver: 'Shafiul Islam',
        trips: [
          {
            id: 'TRP-1021',
            trip_date: '2026-01-24',
            start_time: '07:30',
            status: 'BOARDING',
            total_capacity: 32,
            booked_seats: 24,
            available_seats: 8,
          },
          {
            id: 'TRP-1022',
            trip_date: '2026-01-24',
            start_time: '08:05',
            status: 'SCHEDULED',
            total_capacity: 32,
            booked_seats: 20,
            available_seats: 12,
          },
        ],
      },
    ],
    'route-2': [
      {
        id: 'veh-331',
        number: 'NR-331',
        driver: 'Imran Hossain',
        trips: [
          {
            id: 'TRP-1045',
            trip_date: '2026-01-24',
            start_time: '08:15',
            status: 'BOARDING',
            total_capacity: 28,
            booked_seats: 21,
            available_seats: 7,
          },
        ],
      },
    ],
  },
  'to-home': {
    'route-1': [
      {
        id: 'veh-219',
        number: 'NR-219',
        driver: 'Sabbir Ahmed',
        trips: [
          {
            id: 'TRP-1206',
            trip_date: '2026-01-24',
            start_time: '05:20',
            status: 'BOARDING',
            total_capacity: 30,
            booked_seats: 27,
            available_seats: 3,
          },
        ],
      },
    ],
    'route-2': [
      {
        id: 'veh-514',
        number: 'NR-514',
        driver: 'Nazia Rahman',
        trips: [
          {
            id: 'TRP-1110',
            trip_date: '2026-01-24',
            start_time: '04:45',
            status: 'SCHEDULED',
            total_capacity: 36,
            booked_seats: 30,
            available_seats: 6,
          },
          {
            id: 'TRP-1112',
            trip_date: '2026-01-24',
            start_time: '06:10',
            status: 'SCHEDULED',
            total_capacity: 36,
            booked_seats: 18,
            available_seats: 18,
          },
        ],
      },
    ],
  },
};

export const SEAT_AVAILABILITY_SECTIONS = [
  {
    id: 'to-campus',
    title: 'Going to Campus',
    description: 'Based on RouteStop order for morning inbound routes.',
    routes: ROUTE_DEFINITIONS.map((route) => ({
      id: route.id,
      name: route.route_name,
      stops: route.stops,
      vehicles: ROUTE_VEHICLES['to-campus'][route.id] || [],
    })),
  },
  {
    id: 'to-home',
    title: 'Going Home',
    description: 'Return trips following RouteStop order in reverse.',
    routes: ROUTE_DEFINITIONS.map((route) => ({
      id: route.id,
      name: route.route_name,
      stops: [...route.stops].reverse(),
      vehicles: ROUTE_VEHICLES['to-home'][route.id] || [],
    })),
  },
];
