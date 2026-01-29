-- ============================================
-- MIGRATION 001: Initial Schema Setup
-- Intelligent Ride-Sharing Platform
-- ============================================
-- This migration creates the foundational tables with:
-- - tsrange for flexible pickup time windows (CRITICAL FEATURE)
-- - GiST indexes for efficient overlap queries
-- - Row Level Security (RLS) policies
-- - PostGIS extensions for geospatial queries
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- Required for GiST index on tsrange
CREATE EXTENSION IF NOT EXISTS "postgis";    -- For geospatial queries

-- ============================================
-- CUSTOM TYPES / ENUMS
-- ============================================

-- User roles
CREATE TYPE user_role AS ENUM ('rider', 'driver', 'admin');

-- Gender preferences for safety filtering
CREATE TYPE gender_preference AS ENUM ('any', 'male', 'female', 'non_binary');

-- Vehicle types
CREATE TYPE vehicle_type AS ENUM ('sedan', 'suv', 'van', 'electric', 'hybrid');

-- Ride statuses
CREATE TYPE ride_status AS ENUM (
  'pending',
  'matched',
  'confirmed',
  'driver_en_route',
  'pickup_arrived',
  'in_progress',
  'completed',
  'cancelled'
);

-- Booking statuses
CREATE TYPE booking_status AS ENUM (
  'pending',
  'confirmed',
  'picked_up',
  'dropped_off',
  'cancelled',
  'no_show'
);

-- Demand levels for prediction
CREATE TYPE demand_level AS ENUM ('low', 'medium', 'high', 'surge');

-- SOS alert status
CREATE TYPE sos_status AS ENUM ('active', 'resolved', 'false_alarm');

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  role user_role NOT NULL DEFAULT 'rider',
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_badge BOOLEAN DEFAULT FALSE,
  gender_identity gender_preference,
  
  -- Accessibility needs (JSONB for flexibility)
  accessibility_needs JSONB DEFAULT '{
    "wheelchairAccessible": false,
    "serviceAnimal": false,
    "hearingAssistance": false,
    "visualAssistance": false
  }'::jsonb,
  
  -- Eco/Sustainability stats
  total_co2_saved DECIMAL(10, 2) DEFAULT 0,
  total_rides_pooled INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  eco_points INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_eco_points ON users(eco_points DESC);

-- ============================================
-- EMERGENCY CONTACTS TABLE
-- ============================================

CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  relationship VARCHAR(50) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emergency_contacts_user ON emergency_contacts(user_id);

-- ============================================
-- VEHICLES TABLE
-- ============================================

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1990),
  color VARCHAR(30) NOT NULL,
  license_plate VARCHAR(15) UNIQUE NOT NULL,
  type vehicle_type NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 8),
  wheelchair_accessible BOOLEAN DEFAULT FALSE,
  co2_per_km DECIMAL(5, 2) NOT NULL, -- grams of CO2 per km
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_driver ON vehicles(driver_id);
CREATE INDEX idx_vehicles_type ON vehicles(type);
CREATE INDEX idx_vehicles_active ON vehicles(is_active) WHERE is_active = TRUE;

-- ============================================
-- RIDE REQUESTS TABLE
-- *** CRITICAL: Uses tsrange for pickup_window ***
-- ============================================

CREATE TABLE ride_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Pickup location (using PostGIS)
  pickup_location GEOGRAPHY(POINT, 4326) NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_place_id VARCHAR(255),
  
  -- Dropoff location
  dropoff_location GEOGRAPHY(POINT, 4326) NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_place_id VARCHAR(255),
  
  -- ============================================
  -- CRITICAL FEATURE: tsrange for time windows
  -- This enables efficient overlap queries using && operator
  -- ============================================
  pickup_window TSTZRANGE NOT NULL,
  
  -- Ride preferences
  ride_type VARCHAR(10) NOT NULL DEFAULT 'pooled' CHECK (ride_type IN ('solo', 'pooled')),
  passenger_count INTEGER NOT NULL DEFAULT 1 CHECK (passenger_count BETWEEN 1 AND 4),
  
  -- Safety preferences (JSONB)
  safety_preferences JSONB DEFAULT '{
    "genderPreference": "any",
    "verifiedDriverOnly": false,
    "shareRideDetails": true
  }'::jsonb,
  
  -- Accessibility requirements
  accessibility_requirements JSONB,
  
  -- Status and estimates
  status ride_status NOT NULL DEFAULT 'pending',
  estimated_co2_solo DECIMAL(10, 2),
  estimated_co2_pooled DECIMAL(10, 2),
  estimated_price DECIMAL(10, 2),
  pooled_price DECIMAL(10, 2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: pickup_window must be valid (end > start)
  CONSTRAINT valid_pickup_window CHECK (
    NOT isempty(pickup_window) AND
    upper(pickup_window) > lower(pickup_window)
  )
);

-- ============================================
-- GiST INDEX ON tsrange - THE HERO FEATURE
-- This index makes overlap queries (&&) extremely efficient
-- ============================================
CREATE INDEX idx_ride_requests_pickup_window_gist 
  ON ride_requests USING GiST (pickup_window);

-- Additional indexes for ride_requests
CREATE INDEX idx_ride_requests_rider ON ride_requests(rider_id);
CREATE INDEX idx_ride_requests_status ON ride_requests(status);
CREATE INDEX idx_ride_requests_created ON ride_requests(created_at DESC);

-- Spatial index for pickup location
CREATE INDEX idx_ride_requests_pickup_geo 
  ON ride_requests USING GIST (pickup_location);

-- Spatial index for dropoff location
CREATE INDEX idx_ride_requests_dropoff_geo 
  ON ride_requests USING GIST (dropoff_location);

-- ============================================
-- RIDES TABLE (Driver's offered rides)
-- Also uses tsrange for scheduled availability
-- ============================================

CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  
  -- Route geometry (stored as PostGIS LineString)
  route_geometry GEOGRAPHY(LINESTRING, 4326),
  
  -- Start and end locations
  start_location GEOGRAPHY(POINT, 4326) NOT NULL,
  start_address TEXT NOT NULL,
  end_location GEOGRAPHY(POINT, 4326) NOT NULL,
  end_address TEXT NOT NULL,
  
  -- ============================================
  -- tsrange for driver's availability window
  -- ============================================
  scheduled_window TSTZRANGE NOT NULL,
  
  -- Ride configuration
  available_seats INTEGER NOT NULL CHECK (available_seats BETWEEN 1 AND 7),
  price_per_km DECIMAL(5, 2) NOT NULL,
  is_pooled BOOLEAN DEFAULT TRUE,
  
  -- Current state (for real-time tracking)
  current_location GEOGRAPHY(POINT, 4326),
  current_heading DECIMAL(5, 2),
  estimated_arrival TIMESTAMPTZ,
  
  -- Status and timing
  status ride_status NOT NULL DEFAULT 'pending',
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_scheduled_window CHECK (
    NOT isempty(scheduled_window) AND
    upper(scheduled_window) > lower(scheduled_window)
  )
);

-- GiST index for ride availability overlap queries
CREATE INDEX idx_rides_scheduled_window_gist 
  ON rides USING GiST (scheduled_window);

-- Additional indexes
CREATE INDEX idx_rides_driver ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_start_geo ON rides USING GIST (start_location);
CREATE INDEX idx_rides_end_geo ON rides USING GIST (end_location);
CREATE INDEX idx_rides_available_seats ON rides(available_seats) WHERE status = 'pending';

-- ============================================
-- BOOKINGS TABLE
-- Links ride requests to actual rides
-- ============================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  ride_request_id UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  rider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Pickup/dropoff for this specific booking
  pickup_location GEOGRAPHY(POINT, 4326) NOT NULL,
  pickup_address TEXT NOT NULL,
  dropoff_location GEOGRAPHY(POINT, 4326) NOT NULL,
  dropoff_address TEXT NOT NULL,
  
  -- Timing
  scheduled_pickup_time TIMESTAMPTZ NOT NULL,
  actual_pickup_time TIMESTAMPTZ,
  actual_dropoff_time TIMESTAMPTZ,
  
  -- Financials and eco-impact
  fare_amount DECIMAL(10, 2) NOT NULL,
  co2_saved DECIMAL(10, 2) DEFAULT 0,
  
  -- Status and feedback
  status booking_status NOT NULL DEFAULT 'pending',
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate bookings
  UNIQUE(ride_id, rider_id)
);

CREATE INDEX idx_bookings_ride ON bookings(ride_id);
CREATE INDEX idx_bookings_rider ON bookings(rider_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_request ON bookings(ride_request_id);

-- ============================================
-- DEMAND ZONES TABLE (for heatmap & prediction)
-- ============================================

CREATE TABLE demand_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Zone boundaries
  bounding_box GEOGRAPHY(POLYGON, 4326) NOT NULL,
  centroid GEOGRAPHY(POINT, 4326) NOT NULL,
  
  -- Demand metrics
  demand_level demand_level NOT NULL DEFAULT 'low',
  surge_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  predicted_demand INTEGER DEFAULT 0,
  historical_average DECIMAL(10, 2) DEFAULT 0,
  
  -- Valid time range for this prediction
  valid_range TSTZRANGE NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_demand_zones_centroid ON demand_zones USING GIST (centroid);
CREATE INDEX idx_demand_zones_valid_range ON demand_zones USING GIST (valid_range);

-- ============================================
-- SOS ALERTS TABLE
-- ============================================

CREATE TABLE sos_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES rides(id),
  
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  message TEXT,
  status sos_status NOT NULL DEFAULT 'active',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_sos_alerts_user ON sos_alerts(user_id);
CREATE INDEX idx_sos_alerts_status ON sos_alerts(status) WHERE status = 'active';

-- ============================================
-- DRIVER LOCATION HISTORY (for analytics)
-- ============================================

CREATE TABLE driver_location_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES rides(id),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  heading DECIMAL(5, 2),
  speed DECIMAL(5, 2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition-friendly index (can add partitioning by time later)
CREATE INDEX idx_driver_location_history_driver_time 
  ON driver_location_history(driver_id, recorded_at DESC);

-- ============================================
-- ECO LEADERBOARD MATERIALIZED VIEW
-- ============================================

CREATE MATERIALIZED VIEW eco_leaderboard AS
SELECT 
  u.id AS user_id,
  u.first_name || ' ' || u.last_name AS user_name,
  u.avatar_url,
  u.total_co2_saved,
  u.current_streak,
  u.eco_points,
  RANK() OVER (ORDER BY u.total_co2_saved DESC) AS rank
FROM users u
WHERE u.total_rides_pooled > 0
ORDER BY u.total_co2_saved DESC
LIMIT 100;

CREATE UNIQUE INDEX idx_eco_leaderboard_user ON eco_leaderboard(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER POLICIES
-- ============================================

-- Users can read their own data
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can see all users
CREATE POLICY users_admin_all ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Drivers can see basic info of riders for their rides
CREATE POLICY users_driver_view_riders ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN rides r ON b.ride_id = r.id
      WHERE r.driver_id = auth.uid() AND b.rider_id = users.id
    )
  );

-- ============================================
-- RIDE REQUEST POLICIES
-- ============================================

-- Riders can CRUD their own requests
CREATE POLICY ride_requests_rider_own ON ride_requests
  FOR ALL USING (rider_id = auth.uid());

-- Drivers can view pending requests for matching
CREATE POLICY ride_requests_driver_view ON ride_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('driver', 'admin')
    )
    AND status = 'pending'
  );

-- Admins can see all
CREATE POLICY ride_requests_admin_all ON ride_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- RIDES POLICIES
-- ============================================

-- Drivers can CRUD their own rides
CREATE POLICY rides_driver_own ON rides
  FOR ALL USING (driver_id = auth.uid());

-- Riders can view available rides
CREATE POLICY rides_rider_view ON rides
  FOR SELECT USING (
    status IN ('pending', 'confirmed') OR
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE ride_id = rides.id AND rider_id = auth.uid()
    )
  );

-- Admins can see all
CREATE POLICY rides_admin_all ON rides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- BOOKINGS POLICIES
-- ============================================

-- Riders can see their own bookings
CREATE POLICY bookings_rider_own ON bookings
  FOR ALL USING (rider_id = auth.uid());

-- Drivers can see bookings for their rides
CREATE POLICY bookings_driver_view ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rides 
      WHERE id = bookings.ride_id AND driver_id = auth.uid()
    )
  );

-- Admins can see all
CREATE POLICY bookings_admin_all ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- VEHICLES POLICIES
-- ============================================

-- Drivers can CRUD their own vehicles
CREATE POLICY vehicles_driver_own ON vehicles
  FOR ALL USING (driver_id = auth.uid());

-- Riders can view vehicle info for their booked rides
CREATE POLICY vehicles_rider_view ON vehicles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN rides r ON b.ride_id = r.id
      WHERE r.vehicle_id = vehicles.id AND b.rider_id = auth.uid()
    )
  );

-- ============================================
-- EMERGENCY CONTACTS POLICIES
-- ============================================

CREATE POLICY emergency_contacts_own ON emergency_contacts
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- SOS ALERTS POLICIES
-- ============================================

CREATE POLICY sos_alerts_own ON sos_alerts
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY sos_alerts_admin ON sos_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ride_requests_updated_at
  BEFORE UPDATE ON ride_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rides_updated_at
  BEFORE UPDATE ON rides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Find overlapping ride requests
-- Uses the && operator on tsrange (HERO QUERY)
-- ============================================

CREATE OR REPLACE FUNCTION find_overlapping_requests(
  target_window TSTZRANGE,
  pickup_point GEOGRAPHY,
  radius_meters DOUBLE PRECISION DEFAULT 1000
)
RETURNS TABLE (
  request_id UUID,
  rider_id UUID,
  pickup_address TEXT,
  dropoff_address TEXT,
  pickup_window TSTZRANGE,
  distance_meters DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rr.id AS request_id,
    rr.rider_id,
    rr.pickup_address,
    rr.dropoff_address,
    rr.pickup_window,
    ST_Distance(rr.pickup_location, pickup_point) AS distance_meters
  FROM ride_requests rr
  WHERE 
    rr.status = 'pending'
    AND rr.pickup_window && target_window  -- Uses GiST index!
    AND ST_DWithin(rr.pickup_location, pickup_point, radius_meters)
  ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Check for booking conflicts
-- Prevents double-booking using tsrange containment
-- ============================================

CREATE OR REPLACE FUNCTION check_booking_conflict(
  p_rider_id UUID,
  p_pickup_time TIMESTAMPTZ,
  p_duration_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
  booking_range TSTZRANGE;
BEGIN
  booking_range := tstzrange(p_pickup_time, p_pickup_time + (p_duration_minutes || ' minutes')::INTERVAL);
  
  SELECT COUNT(*) INTO conflict_count
  FROM bookings b
  JOIN rides r ON b.ride_id = r.id
  WHERE 
    b.rider_id = p_rider_id
    AND b.status IN ('pending', 'confirmed', 'picked_up')
    AND r.scheduled_window && booking_range;
    
  RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Update eco stats after ride completion
-- ============================================

CREATE OR REPLACE FUNCTION update_eco_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'dropped_off' AND OLD.status != 'dropped_off' THEN
    UPDATE users
    SET 
      total_co2_saved = total_co2_saved + NEW.co2_saved,
      total_rides_pooled = total_rides_pooled + 1,
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      eco_points = eco_points + FLOOR(NEW.co2_saved * 10)
    WHERE id = NEW.rider_id;
    
    -- Refresh leaderboard
    REFRESH MATERIALIZED VIEW CONCURRENTLY eco_leaderboard;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_eco_stats
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_eco_stats();

-- ============================================
-- SEED DATA (for development)
-- ============================================

-- This would be in a separate seed file for development
-- Uncomment for local testing:

/*
INSERT INTO users (email, phone, password_hash, first_name, last_name, role, is_verified, verified_badge)
VALUES 
  ('driver1@example.com', '+1234567890', '$2b$10$hash', 'John', 'Driver', 'driver', true, true),
  ('rider1@example.com', '+1234567891', '$2b$10$hash', 'Jane', 'Rider', 'rider', true, false),
  ('admin@example.com', '+1234567892', '$2b$10$hash', 'Admin', 'User', 'admin', true, true);
*/

-- ============================================
-- END OF MIGRATION
-- ============================================
