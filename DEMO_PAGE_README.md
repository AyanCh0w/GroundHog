# Rover Demo Page

## Overview

The demo page (`/demo`) is a TV-sized monitor interface designed for users to interactively control and monitor the GroundHog rover. It provides real-time MQTT communication with the rover and displays live sensor data.

## Features

### 🎮 Rover Controls

- **Arrow Key Style Controller**: Simple up/down/left/right controls
- **Forward/Backward**: Move rover forward/backward by 1 foot
- **Turning**: Turn rover left/right by 30 degrees
- **Probe Function**: Placeholder button for future soil sampling functionality

### 📡 MQTT Communication

- **Auto-Connect**: Automatically connects to MQTT broker on page load
- **Connection Management**: Simple connect/disconnect controls
- **Command Sending**: Sends commands to `jumpstart/rover_command` topic
- **Live Data Reception**: Subscribes to rover data topics for real-time updates

### 📊 Live Data Display

- **Environmental Data**: Temperature, humidity, battery level
- **Movement Data**: Speed, heading, altitude
- **Real-time Updates**: Data refreshes every 2 seconds with simulated values

## MQTT Topics

### Outgoing Commands

- `jumpstart/rover_command`: Sends rover movement commands
  - Format: `drive,<distance>` (e.g., `drive,5` for 5 feet forward)
  - Format: `turn,<degrees>` (e.g., `turn,30` for 30° left turn)

### Incoming Data

- `jumpstart/rover_data`: Receives movement and position data
- `jumpstart/sensor_data`: Receives environmental sensor data

## Command Format

### Movement Commands

- **Forward**: `drive,1` (1 foot forward)
- **Backward**: `drive,-1` (1 foot backward)
- **Turn Left**: `turn,30` (30 degrees left)
- **Turn Right**: `turn,-30` (30 degrees right)

## Usage Instructions

1. **Access the Demo Page**: Navigate to `/demo` in your browser
2. **Auto-Connection**: MQTT automatically connects on page load
3. **Control Rover**: Use the arrow key-style controls to move the rover
4. **Monitor Data**: Watch live sensor data updates in the right panel

## Technical Details

### MQTT Broker

- **URL**: `wss://mqtt-dashboard.com:8884/mqtt`
- **Protocol**: WebSocket over SSL
- **Client**: MQTT.js library

### UI Components

- **Responsive Design**: Optimized for TV-sized monitors
- **Dashboard Styling**: Matches the main dashboard design theme
- **Simple Controls**: Arrow key-style interface for easy use
- **Real-time Updates**: Live data with visual indicators

### Error Handling

- **Connection Status**: Visual indicators for MQTT connection state
- **Command Validation**: Prevents sending commands when disconnected
- **Fallback Data**: Simulated data when MQTT is unavailable

## Future Enhancements

- **Probe Functionality**: Soil sampling and analysis commands
- **Advanced Controls**: Joystick-style movement controls
- **Data Visualization**: Charts and graphs for historical data
- **Custom Commands**: User-defined command sequences
- **Safety Features**: Emergency stop and safety protocols

## Troubleshooting

### Common Issues

1. **MQTT Connection Failed**: Check broker URL and network connectivity
2. **Commands Not Sending**: Ensure MQTT is connected (green status indicator)
3. **No Live Data**: Verify rover is sending data to subscribed topics

### Debug Information

- Check browser console for MQTT connection logs
- Monitor network tab for WebSocket connection status
- Verify MQTT broker accessibility from your network

## Dependencies

- **MQTT.js**: MQTT client library
- **React**: UI framework
- **Tailwind CSS**: Styling framework
- **Lucide React**: Icon library
- **Next.js**: React framework with routing
