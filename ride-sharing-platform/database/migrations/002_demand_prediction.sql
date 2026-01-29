-- ============================================
-- MIGRATION 002: Demand Prediction & Analytics
-- ============================================
-- This migration adds tables and functions for:
-- - Historical ride data aggregation
-- - Demand prediction support
-- - Surge pricing calculations
-- ============================================

-- ============================================
-- HISTORICAL DEMAND TABLE (for ML/predictions)
-- ============================================

CREATE TABLE historical_demand (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID REFERENCES demand_zones(id),
  
  -- Time bucketing
  hour_of_day INTEGER NOT NULL CHECK (hour_of_day BETWEEN 0 AND 23),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  week_of_year INTEGER NOT NULL CHECK (week_of_year BETWEEN 1 AND 53),
  
  -- Metrics
  request_count INTEGER DEFAULT 0,
  completed_rides INTEGER DEFAULT 0,
  average_wait_time_seconds INTEGER,
  average_surge_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  
  -- Location centroid
  centroid GEOGRAPHY(POINT, 4326),
  
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_historical_demand_time 
  ON historical_demand(hour_of_day, day_of_week);
CREATE INDEX idx_historical_demand_zone 
  ON historical_demand(zone_id);

-- ============================================
-- SURGE PRICING HISTORY
-- ============================================

CREATE TABLE surge_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID REFERENCES demand_zones(id),
  multiplier DECIMAL(3, 2) NOT NULL,
  reason VARCHAR(100),
  active_range TSTZRANGE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_surge_history_range 
  ON surge_history USING GIST (active_range);

-- ============================================
-- FUNCTION: Calculate moving average demand
-- Simple implementation for surge prediction
-- ============================================

CREATE OR REPLACE FUNCTION calculate_demand_moving_average(
  p_zone_centroid GEOGRAPHY,
  p_radius_meters DOUBLE PRECISION DEFAULT 2000,
  p_window_hours INTEGER DEFAULT 3
)
RETURNS TABLE (
  avg_requests DECIMAL,
  avg_completed DECIMAL,
  suggested_surge DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH recent_data AS (
    SELECT 
      hd.request_count,
      hd.completed_rides,
      hd.average_surge_multiplier
    FROM historical_demand hd
    WHERE 
      hd.recorded_at >= NOW() - (p_window_hours || ' hours')::INTERVAL
      AND ST_DWithin(hd.centroid, p_zone_centroid, p_radius_meters)
  ),
  averages AS (
    SELECT 
      COALESCE(AVG(request_count), 0) AS avg_req,
      COALESCE(AVG(completed_rides), 0) AS avg_comp
    FROM recent_data
  )
  SELECT 
    avg_req,
    avg_comp,
    CASE 
      WHEN avg_comp = 0 THEN 1.0
      WHEN avg_req / NULLIF(avg_comp, 0) > 2.0 THEN 2.0
      WHEN avg_req / NULLIF(avg_comp, 0) > 1.5 THEN 1.5
      WHEN avg_req / NULLIF(avg_comp, 0) > 1.2 THEN 1.2
      ELSE 1.0
    END::DECIMAL AS suggested_surge
  FROM averages;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Get demand heatmap data
-- ============================================

CREATE OR REPLACE FUNCTION get_demand_heatmap(
  p_bbox_sw_lat DOUBLE PRECISION,
  p_bbox_sw_lng DOUBLE PRECISION,
  p_bbox_ne_lat DOUBLE PRECISION,
  p_bbox_ne_lng DOUBLE PRECISION
)
RETURNS TABLE (
  zone_id UUID,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  demand_level demand_level,
  surge_multiplier DECIMAL,
  predicted_demand INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dz.id AS zone_id,
    ST_Y(dz.centroid::geometry) AS lat,
    ST_X(dz.centroid::geometry) AS lng,
    dz.demand_level,
    dz.surge_multiplier,
    dz.predicted_demand
  FROM demand_zones dz
  WHERE 
    dz.valid_range @> NOW()
    AND ST_Y(dz.centroid::geometry) BETWEEN p_bbox_sw_lat AND p_bbox_ne_lat
    AND ST_X(dz.centroid::geometry) BETWEEN p_bbox_sw_lng AND p_bbox_ne_lng;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Aggregate hourly demand
-- Run via cron job every hour
-- ============================================

CREATE OR REPLACE FUNCTION aggregate_hourly_demand()
RETURNS void AS $$
BEGIN
  INSERT INTO historical_demand (
    hour_of_day,
    day_of_week,
    week_of_year,
    request_count,
    completed_rides,
    average_wait_time_seconds,
    centroid,
    recorded_at
  )
  SELECT 
    EXTRACT(HOUR FROM rr.created_at)::INTEGER AS hour_of_day,
    EXTRACT(DOW FROM rr.created_at)::INTEGER AS day_of_week,
    EXTRACT(WEEK FROM rr.created_at)::INTEGER AS week_of_year,
    COUNT(*)::INTEGER AS request_count,
    COUNT(CASE WHEN rr.status = 'completed' THEN 1 END)::INTEGER AS completed_rides,
    AVG(
      CASE WHEN b.actual_pickup_time IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (b.actual_pickup_time - rr.created_at))
      END
    )::INTEGER AS average_wait_time_seconds,
    ST_Centroid(ST_Collect(rr.pickup_location::geometry))::geography AS centroid,
    date_trunc('hour', NOW()) AS recorded_at
  FROM ride_requests rr
  LEFT JOIN bookings b ON rr.id = b.ride_request_id
  WHERE rr.created_at >= NOW() - INTERVAL '1 hour'
  GROUP BY 
    EXTRACT(HOUR FROM rr.created_at),
    EXTRACT(DOW FROM rr.created_at),
    EXTRACT(WEEK FROM rr.created_at);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GREEN ROUTES TABLE
-- Stores pre-calculated eco-friendly alternatives
-- ============================================

CREATE TABLE green_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Route endpoints
  start_location GEOGRAPHY(POINT, 4326) NOT NULL,
  end_location GEOGRAPHY(POINT, 4326) NOT NULL,
  
  -- Standard route
  standard_geometry GEOGRAPHY(LINESTRING, 4326),
  standard_distance_meters INTEGER,
  standard_duration_seconds INTEGER,
  standard_co2_grams INTEGER,
  
  -- Green alternative
  green_geometry GEOGRAPHY(LINESTRING, 4326),
  green_distance_meters INTEGER,
  green_duration_seconds INTEGER,
  green_co2_grams INTEGER,
  
  -- Comparison
  additional_time_seconds INTEGER,
  co2_savings_grams INTEGER,
  co2_savings_percentage DECIMAL(5, 2),
  
  -- Cache validity
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_green_routes_start ON green_routes USING GIST (start_location);
CREATE INDEX idx_green_routes_end ON green_routes USING GIST (end_location);
CREATE INDEX idx_green_routes_valid ON green_routes(valid_until);

-- ============================================
-- CHAT MESSAGES TABLE
-- For rider-driver communication
-- ============================================

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_ride ON chat_messages(ride_id, created_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY chat_messages_participants ON chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM rides r
      LEFT JOIN bookings b ON r.id = b.ride_id
      WHERE 
        chat_messages.ride_id = r.id
        AND (r.driver_id = auth.uid() OR b.rider_id = auth.uid())
    )
  );

-- ============================================
-- END OF MIGRATION
-- ============================================
