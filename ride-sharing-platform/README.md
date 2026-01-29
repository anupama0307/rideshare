# Intelligent Ride-Sharing & Sustainable Mobility Platform

A modern, full-stack ride-sharing application with intelligent pooling, real-time tracking, and carbon footprint awareness.

## 🌟 Features

### 🚗 Intelligent Ride Pooling
- **DBSCAN Clustering Algorithm**: Groups riders with similar routes and overlapping time windows
- **PostgreSQL tsrange**: Native timestamp range support for flexible pickup windows
- **Smart Matching**: Matches riders based on route similarity, time overlap, and preferences

### 🗺️ Real-Time Routing
- **Mapbox GL JS Integration**: Interactive maps with route visualization
- **Live Driver Tracking**: Real-time location updates via Socket.io
- **Route Deviation Alerts**: Automatic detection and notification of route deviations
- **ETA Updates**: Dynamic arrival time calculations

### 🌿 Sustainability & Carbon Awareness
- **CO2 Tracking**: Real-time carbon footprint calculations
- **Pool vs Solo Comparison**: Visual comparison of emissions
- **Eco Streaks & Gamification**: Leaderboards and achievement badges
- **Electric Vehicle Bonus**: Special recognition for EV rides

### 📊 Demand Prediction
- **Heatmap Visualization**: Real-time demand zones on map
- **Surge Pricing**: Transparent demand-based pricing
- **Historical Analysis**: Pattern recognition for demand forecasting

### 🛡️ Safety & Trust
- **Verified Drivers**: Background check badges
- **SOS Alerts**: Emergency button with location sharing
- **Gender Preference**: Optional ride matching preferences
- **Accessibility Options**: Wheelchair-accessible vehicle filtering

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** + **shadcn/ui** for styling
- **Mapbox GL JS** for maps
- **Socket.io Client** for real-time updates
- **React Hook Form** + **Zod** for forms

### Backend
- **Node.js** + **Express.js**
- **TypeScript**
- **PostgreSQL** with PostGIS extension
- **Supabase** for auth and realtime
- **Socket.io** for WebSocket connections
- **Winston** for logging

### Database
- **PostgreSQL 15** with extensions:
  - `uuid-ossp` for UUIDs
  - `btree_gist` for tsrange indexes
  - `PostGIS` for geospatial queries
- **Row Level Security (RLS)** policies
- **Materialized Views** for leaderboards

### DevOps
- **Docker** + **Docker Compose**
- **GitHub Actions** for CI/CD
- **CodeQL** for security analysis

## 📦 Project Structure

```
ride-sharing-platform/
├── packages/
│   └── shared/                 # Shared types, schemas, utilities
├── backend/
│   └── src/
│       ├── config/            # Configuration
│       ├── controllers/       # Request handlers
│       ├── middleware/        # Express middleware
│       ├── repositories/      # Database access
│       ├── routes/            # API routes
│       ├── services/          # Business logic
│       ├── socket/            # Socket.io handlers
│       └── types/             # TypeScript types
├── frontend/
│   └── src/
│       ├── app/               # Next.js App Router pages
│       ├── components/        # React components
│       ├── hooks/             # Custom React hooks
│       └── lib/               # Utilities
├── database/
│   └── migrations/            # SQL migrations
└── .github/
    └── workflows/             # CI/CD workflows
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ with PostGIS
- Mapbox API token

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ride-sharing-platform.git
   cd ride-sharing-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations**
   ```bash
   psql -d your_database -f database/migrations/001_initial_schema.sql
   psql -d your_database -f database/migrations/002_demand_prediction.sql
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

### Using Docker

```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production
docker-compose up -d
```

## 🔑 Key Technical Features

### PostgreSQL tsrange for Time Windows

The application uses PostgreSQL's native `tsrange` (timestamp range) type for flexible pickup time windows:

```sql
-- Create ride request with time window
INSERT INTO ride_requests (pickup_window) 
VALUES (TSTZRANGE('2025-01-15 09:00:00', '2025-01-15 09:30:00'));

-- Find overlapping requests using GiST index
SELECT * FROM ride_requests 
WHERE pickup_window && TSTZRANGE($1, $2);
```

### DBSCAN Clustering Algorithm

```typescript
// Groups riders based on spatial proximity and temporal overlap
const clusters = clusteringService.dbscanCluster(rideRequests, {
  spatialEpsilon: 1000,  // 1km radius
  temporalOverlapMin: 0.5,  // 50% time overlap
  minPoints: 2
});
```

### Real-Time Location Updates

```typescript
// Socket.io event flow
socket.emit('driver_location_update', {
  rideId: 'uuid',
  latitude: 40.7128,
  longitude: -74.0060,
  heading: 45,
  speed: 30
});

// Client receives updates
socket.on('driver_location', (location) => {
  updateMarkerPosition(location);
});
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Rides
- `POST /api/rides/request` - Create ride request
- `GET /api/rides/match/:requestId` - Get matching rides
- `GET /api/rides/:id` - Get ride details

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - Get user bookings
- `POST /api/bookings/:id/rate` - Rate a ride

### Demand
- `POST /api/demand/heatmap` - Get demand heatmap
- `POST /api/demand/predict` - Predict demand

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific workspace
npm run test --workspace=backend
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox access token | Yes |
| `REDIS_URL` | Redis connection URL | No |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Mapbox](https://www.mapbox.com/) for mapping services
- [Supabase](https://supabase.com/) for backend infrastructure
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
