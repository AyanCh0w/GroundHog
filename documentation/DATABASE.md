# GroundHog Frontend - Database Documentation

This document provides comprehensive information about the database architecture, schema design, and data relationships in the GroundHog Frontend system.

## 🗄️ Database Overview

**GroundHog Frontend** uses **Supabase** as its primary database service, which is built on top of **PostgreSQL**. The system is designed to handle real-time soil monitoring data, farm management, and AI-powered analysis for precision agriculture.

### Database Technology Stack

- **Primary Database**: PostgreSQL (via Supabase)
- **Real-time Features**: Supabase Realtime

## 🏗️ Database Schema

### Core Tables

#### 1. `farm_location` - Farm Management

**Purpose**: Stores basic farm information and location data

```sql
CREATE TABLE farm_location (
  id SERIAL PRIMARY KEY,
  farm_id TEXT UNIQUE NOT NULL,           -- Unique farm identifier
  farm_name TEXT NOT NULL,                -- Human-readable farm name
  farmer_name TEXT NOT NULL,              -- Primary farmer contact
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lat DOUBLE PRECISION NOT NULL,          -- Latitude coordinate
  long DOUBLE PRECISION NOT NULL          -- Longitude coordinate
);
```

**Data Flow**:

- Created during farm onboarding process
- Referenced by all other tables for data isolation
- Used for map visualization and farm selection

**Sample Data**:

```json
{
  "id": 1,
  "farm_id": "FARM_001",
  "farm_name": "Green Valley Farm",
  "farmer_name": "John Smith",
  "created_at": "2024-12-01T10:00:00Z",
  "lat": 38.9072,
  "long": -77.0369
}
```

#### 2. `chemical_estimate` - Soil Analysis

**Purpose**: Stores detailed soil nutrient analysis and chemical properties

```sql
CREATE TABLE chemical_estimate (
  id SERIAL PRIMARY KEY,
  farmID TEXT NOT NULL REFERENCES farm_location(farm_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Macronutrients (Kg/Ha)
  nitrogen DOUBLE PRECISION,              -- Nitrogen content
  phosphorus DOUBLE PRECISION,            -- Phosphorus content
  potassium DOUBLE PRECISION,             -- Potassium content

  -- Soil Properties
  ec DOUBLE PRECISION,                    -- Electrical Conductivity
  sulphur DOUBLE PRECISION,               -- Sulphur content
  ph DOUBLE PRECISION,                    -- pH level

  -- Micronutrients (PPM)
  zinc DOUBLE PRECISION,                  -- Zinc content
  iron DOUBLE PRECISION,                  -- Iron content
  boron DOUBLE PRECISION,                 -- Boron content
  copper DOUBLE PRECISION                 -- Copper content
);
```

**Data Flow**:

- Populated by AI analysis of sensor data
- Used for chemical analysis dashboard
- Historical tracking of soil health trends

**Sample Data**:

```json
{
  "id": 1,
  "farmID": "FARM_001",
  "created_at": "2024-12-01T10:00:00Z",
  "nitrogen": 45.2,
  "phosphorus": 12.8,
  "potassium": 28.5,
  "ec": 1.2,
  "sulphur": 8.4,
  "ph": 6.8,
  "zinc": 2.1,
  "iron": 15.3,
  "boron": 0.8,
  "copper": 1.2
}
```

#### 3. `rover_points` - Sensor Data

**Purpose**: Stores real-time sensor readings from the autonomous rover

```sql
CREATE TABLE rover_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  farm_id TEXT NOT NULL REFERENCES farm_location(farm_id),

  -- Sensor Readings
  moisture DOUBLE PRECISION,              -- Moisture percentage
  temperature DOUBLE PRECISION,           -- Temperature in Celsius
  pH DOUBLE PRECISION,                    -- pH level
  EC DOUBLE PRECISION,                    -- Electrical Conductivity

  -- Location
  lat DOUBLE PRECISION NOT NULL,          -- Latitude coordinate
  long DOUBLE PRECISION NOT NULL          -- Longitude coordinate
);
```

**Data Flow**:

- Real-time data from rover sensors
- Used for heatmap visualization
- Historical analysis and trend detection

**Sample Data**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-12-01T10:00:00Z",
  "farm_id": "FARM_001",
  "moisture": 65.4,
  "temperature": 22.1,
  "pH": 6.8,
  "EC": 1.2,
  "lat": 38.9072,
  "long": -77.0369
}
```

#### 4. `waypoints` - Navigation Points

**Purpose**: Defines navigation points for autonomous rover movement

```sql
CREATE TABLE waypoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES farm_location(farm_id),
  name TEXT NOT NULL,                     -- Waypoint identifier
  lat DOUBLE PRECISION NOT NULL,          -- Latitude coordinate
  long DOUBLE PRECISION NOT NULL,         -- Longitude coordinate
  order_index INTEGER NOT NULL,           -- Sequence order
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Data Flow**:

- Created during farm setup
- Used for rover navigation planning
- Supports multiple waypoint sequences

**Sample Data**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "farm_id": "FARM_001",
  "name": "WP_001",
  "lat": 38.9072,
  "long": -77.0369,
  "order_index": 1,
  "created_at": "2024-12-01T10:00:00Z"
}
```

#### 5. `waypoint_paths` - Navigation Routes

**Purpose**: Groups waypoints into navigable paths for the rover

```sql
CREATE TABLE waypoint_paths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES farm_location(farm_id),
  name TEXT NOT NULL,                     -- Path name
  description TEXT,                        -- Path description
  is_active BOOLEAN DEFAULT true,         -- Active status
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Data Flow**:

- Manages multiple navigation paths per farm
- Supports path activation/deactivation
- Used for rover route planning

#### 6. `ai_analysis_records` - AI Analysis History

**Purpose**: Stores AI-generated soil analysis and recommendations

```sql
CREATE TABLE ai_analysis_records (
  id SERIAL PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES farm_location(farm_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  input_data JSONB NOT NULL,              -- Input sensor data
  output_data JSONB NOT NULL,             -- AI analysis results
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Data Flow**:

- Stores AI analysis inputs and outputs
- Historical tracking of recommendations
- Supports analysis improvement over time

**Sample Data**:

```json
{
  "id": 1,
  "farm_id": "FARM_001",
  "created_at": "2024-12-01T10:00:00Z",
  "input_data": {
    "pH": 6.8,
    "EC": 1.2,
    "temperature_c": 22.1,
    "moisture_pct": 65.4
  },
  "output_data": {
    "summary": "Soil conditions are optimal for crop growth",
    "todos": ["Monitor moisture levels", "Check pH weekly"],
    "status": "healthy"
  },
  "last_updated": "2024-12-01T10:00:00Z"
}
```

## 🔗 Database Relationships

### Entity Relationship Diagram

```
farm_location (1) ←→ (N) chemical_estimate
       ↑
       |
       (1) ←→ (N) rover_points
       ↑
       |
       (1) ←→ (N) waypoints
       ↑
       |
       (1) ←→ (N) waypoint_paths
       ↑
       |
       (1) ←→ (N) ai_analysis_records
```

### Foreign Key Constraints

```sql
-- All tables reference farm_location.farm_id
ALTER TABLE chemical_estimate
  ADD CONSTRAINT fk_chemical_estimate_farm
  FOREIGN KEY (farmID) REFERENCES farm_location(farm_id);

ALTER TABLE rover_points
  ADD CONSTRAINT fk_rover_points_farm
  FOREIGN KEY (farm_id) REFERENCES farm_location(farm_id);

ALTER TABLE waypoints
  ADD CONSTRAINT fk_waypoints_farm
  FOREIGN KEY (farm_id) REFERENCES farm_location(farm_id);

ALTER TABLE waypoint_paths
  ADD CONSTRAINT fk_waypoint_paths_farm
  FOREIGN KEY (farm_id) REFERENCES farm_location(farm_id);

ALTER TABLE ai_analysis_records
  ADD CONSTRAINT fk_ai_analysis_farm
  FOREIGN KEY (farm_id) REFERENCES farm_location(farm_id);
```

## 🔒 Security & Access Control

### Row Level Security (RLS)

All tables have Row Level Security enabled to ensure data isolation between farms:

```sql
-- Enable RLS on all tables
ALTER TABLE farm_location ENABLE ROW LEVEL SECURITY;
ALTER TABLE chemical_estimate ENABLE ROW LEVEL SECURITY;
ALTER TABLE rover_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE waypoint_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_records ENABLE ROW LEVEL SECURITY;
```

### Security Policies

```sql
-- Example policy for farm_location
CREATE POLICY "Users can view their own farm data" ON farm_location
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own farm data" ON farm_location
  FOR INSERT WITH CHECK (true);

-- Similar policies for other tables
```

## 📊 Data Types & Constraints

### Numeric Precision

- **Coordinates**: `DOUBLE PRECISION` for GPS accuracy
- **Percentages**: `DOUBLE PRECISION` for moisture (0-100%)
- **Temperatures**: `DOUBLE PRECISION` for Celsius values
- **pH Values**: `DOUBLE PRECISION` for pH scale (0-14)
- **Nutrient Levels**: `DOUBLE PRECISION` for precise measurements

### Validation Constraints

```sql
-- Example constraints for data validation
ALTER TABLE rover_points
  ADD CONSTRAINT chk_moisture_range
  CHECK (moisture >= 0 AND moisture <= 100);

ALTER TABLE rover_points
  ADD CONSTRAINT chk_temperature_range
  CHECK (temperature >= -50 AND temperature <= 100);

ALTER TABLE rover_points
  ADD CONSTRAINT chk_ph_range
  CHECK (pH >= 0 AND pH <= 14);
```

## 🔄 Data Flow & Operations

### 1. Farm Onboarding Flow

```
User Input → farm_location → Generate farm_id → Create waypoints → Setup complete
```

### 2. Data Collection Flow

```
Rover Sensors → rover_points → AI Analysis → chemical_estimate → Dashboard Display
```

### 3. Navigation Flow

```
waypoints + waypoint_paths → Rover Navigation → Data Collection → Analysis
```

## 📈 Performance Considerations

### Indexing Strategy

```sql
-- Primary indexes for performance
CREATE INDEX idx_rover_points_farm_time ON rover_points(farm_id, created_at);
CREATE INDEX idx_chemical_estimate_farm_time ON chemical_estimate(farmID, created_at);
CREATE INDEX idx_waypoints_farm_order ON waypoints(farm_id, order_index);

-- Spatial indexes for location queries
CREATE INDEX idx_rover_points_location ON rover_points USING GIST (
  ST_SetSRID(ST_MakePoint(long, lat), 4326)
);
```

### Query Optimization

- **Time-based queries**: Use `created_at` indexes for historical data
- **Location queries**: Use spatial indexes for GPS-based searches
- **Farm isolation**: Always filter by `farm_id` for data security

## 🚀 Real-time Features

### Supabase Realtime

The system leverages Supabase Realtime for live data updates:

```typescript
// Subscribe to real-time updates
const subscription = supabase
  .channel("rover_updates")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "rover_points" },
    (payload) => {
      // Handle real-time sensor data
      console.log("New sensor reading:", payload.new);
    }
  )
  .subscribe();
```

### Real-time Channels

- **`rover_updates`**: Live sensor data from rover
- **`chemical_analysis`**: AI analysis results
- **`waypoint_updates`**: Navigation changes

## 🔧 Database Maintenance

### Backup Strategy

- **Automated backups**: Supabase handles daily backups
- **Point-in-time recovery**: Available for critical data
- **Export functionality**: Manual data export for analysis

### Monitoring & Alerts

- **Query performance**: Monitor slow queries
- **Storage usage**: Track database growth
- **Connection limits**: Monitor concurrent connections

## 📝 Sample Queries

### Common Operations

```sql
-- Get latest sensor data for a farm
SELECT * FROM rover_points
WHERE farm_id = 'FARM_001'
ORDER BY created_at DESC
LIMIT 100;

-- Get chemical analysis history
SELECT * FROM chemical_estimate
WHERE farmID = 'FARM_001'
ORDER BY created_at DESC;

-- Get waypoints for navigation
SELECT * FROM waypoints
WHERE farm_id = 'FARM_001'
ORDER BY order_index;

-- Get AI analysis recommendations
SELECT output_data->>'todos' as recommendations
FROM ai_analysis_records
WHERE farm_id = 'FARM_001'
ORDER BY created_at DESC;
```

## 🚨 Troubleshooting

### Common Database Issues

1. **Connection Timeouts**:

   - Check network connectivity
   - Verify Supabase credentials
   - Monitor connection pool usage

2. **Performance Issues**:

   - Review query execution plans
   - Check index usage
   - Monitor slow query logs

3. **Data Consistency**:
   - Verify foreign key constraints
   - Check RLS policies
   - Validate data types

**Database setup completed?** Your GroundHog system is ready to store and analyze soil data! 🌱
