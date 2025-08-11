# Waypoint Navigation System

This system allows you to create, manage, and execute autonomous navigation paths for your rover using waypoints with latitude and longitude coordinates.

## Features

### 1. Waypoint Management (`/waypoints`)

- **Create Navigation Paths**: Define sequences of waypoints with names, coordinates, and order
- **Edit Existing Paths**: Modify waypoint coordinates, names, and path details
- **Path Organization**: Set active paths and organize multiple navigation routes
- **Coordinate Input**: Input precise latitude and longitude coordinates for each waypoint

### 2. Rover Navigation (`/navigation`)

- **Real-time Rover Tracking**: See rover location updates via MQTT
- **Path Visualization**: View waypoints and navigation paths on an interactive map
- **Navigation Controls**: Start, stop, and control autonomous navigation
- **MQTT Integration**: Send commands to rover via MQTT protocol

## Setup Instructions

### 1. Database Setup

Run the SQL script in `database_setup.sql` in your Supabase SQL editor to create the required tables:

```sql
-- Copy and paste the contents of database_setup.sql into your Supabase SQL editor
-- This will create the waypoint_paths and waypoints tables
```

### 2. MQTT Configuration

The system connects to MQTT broker at `wss://mqtt-dashboard.com:8884/mqtt`. You can modify this in the code if you have a different broker.

**MQTT Topics Used:**

- `jumpstart/ultra`: Rover location updates
- `rover/status`: Rover navigation status
- `rover/commands`: Commands sent to rover

### 3. Environment Variables

Ensure you have your Mapbox API key set:

```env
NEXT_PUBLIC_MAPBOX_KEY=your_mapbox_api_key_here
```

## Usage Guide

### Creating a Navigation Path

1. **Navigate to Waypoints Page**: Click the "Waypoints" button on the main dashboard
2. **Create New Path**: Fill in path name and description
3. **Add Waypoints**: Click "Add Waypoint" to add coordinate points
4. **Set Coordinates**: Input latitude and longitude for each waypoint
5. **Save Path**: Click "Save Path" to store the navigation route

### Executing Navigation

1. **Go to Navigation Page**: Click "Navigate" on any saved path
2. **Connect MQTT**: Click "Connect MQTT" to establish connection with rover
3. **Select Path**: Choose the navigation path from the dropdown
4. **Load Waypoints**: Click "Load Waypoints" to send path data to rover
5. **Start Navigation**: Click "Start Navigation" to begin autonomous movement
6. **Monitor Progress**: Watch real-time rover movement on the map
7. **Stop if Needed**: Use "Stop Navigation" to halt autonomous movement

## Rover Communication Protocol

The system sends JSON commands to the rover via MQTT:

### Load Waypoints Command

```json
{
  "command": "load_waypoints",
  "path_id": "uuid-here",
  "waypoints": [
    {
      "lat": 40.7128,
      "long": -74.006,
      "order": 0
    }
  ]
}
```

### Start Navigation Command

```json
{
  "command": "start_navigation",
  "path_id": "uuid-here",
  "waypoints": [...]
}
```

### Stop Navigation Command

```json
{
  "command": "stop_navigation"
}
```

## File Structure

```
app/
├── waypoints/
│   └── page.tsx          # Waypoint creation and management
├── navigation/
│   └── page.tsx          # Rover navigation control
└── dashboard/
    └── page.tsx          # Main dashboard with waypoint button

lib/
└── types.ts              # TypeScript interfaces for waypoints

database_setup.sql        # Database schema setup
```

## Technical Details

### Database Schema

- **waypoint_paths**: Stores navigation path metadata
- **waypoints**: Stores individual coordinate points with order

### MQTT Integration

- WebSocket connection to MQTT broker
- Real-time message publishing and subscription
- Automatic reconnection handling

### Map Integration

- Mapbox GL JS for interactive mapping
- Real-time waypoint visualization
- Path line rendering between waypoints
- Animated rover marker movement

## Troubleshooting

### Common Issues

1. **MQTT Connection Fails**

   - Check internet connection
   - Verify MQTT broker URL
   - Check browser console for errors

2. **Waypoints Not Saving**

   - Ensure database tables are created
   - Check Supabase connection
   - Verify farm_id is set in cookies

3. **Map Not Loading**
   - Verify Mapbox API key is set
   - Check browser console for errors
   - Ensure map container is properly sized

### Debug Information

- Check browser console for detailed logs
- MQTT connection status is displayed in the UI
- Navigation status shows current rover state

## Future Enhancements

- **Path Optimization**: Automatic route optimization between waypoints
- **Speed Control**: Adjustable navigation speed settings
- **Safety Zones**: Define no-go areas and obstacles
- **Path Templates**: Pre-defined navigation patterns
- **Multi-Rover Support**: Coordinate multiple rovers
- **Offline Mode**: Store paths locally for offline use

## Support

For technical support or feature requests, please refer to your development team or create an issue in the project repository.
