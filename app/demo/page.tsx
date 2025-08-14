"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Activity,
  Wifi,
  WifiOff,
  Compass,
  Gauge,
  Thermometer,
  Droplets,
  Zap,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

// MQTT Client for sending commands and receiving data
let mqttClient: any = null;

// Types for MQTT data
interface RoverLocationData {
  heading_deg: number;
  command: string;
}

interface SensorData {
  temperature?: number;
  moisture?: number;
  ec?: number;
  ph?: number;
  timestamp?: number;
}

export default function DemoPage() {
  const [mqttStatus, setMqttStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");

  // Rover location data
  const [roverData, setRoverData] = useState<RoverLocationData>({
    heading_deg: 0,
    command: "",
  });

  // Sensor data with history for graphs
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [currentSensorData, setCurrentSensorData] = useState<SensorData>({
    temperature: 0,
    moisture: 0,
    ec: 0,
    ph: 0,
  });

  // Auto-connect to MQTT on page load
  useEffect(() => {
    connectToMqtt();
  }, []);

  // Connect to MQTT broker
  const connectToMqtt = () => {
    if (mqttStatus === "connected" || mqttStatus === "connecting") return;

    setMqttStatus("connecting");

    // Import mqtt dynamically to avoid SSR issues
    import("mqtt")
      .then((mqtt) => {
        mqttClient = mqtt.default.connect("wss://mqtt-dashboard.com:8884/mqtt");

        mqttClient.on("connect", () => {
          console.log("✅ Connected to MQTT broker");
          setMqttStatus("connected");

          // Subscribe to rover location topic
          mqttClient.subscribe("jumpstart/rover_location", (err: any) => {
            if (err) {
              console.error("❌ Subscription error:", err);
              setMqttStatus("error");
            } else {
              console.log("📡 Subscribed to jumpstart/rover_location");
            }
          });

          // Subscribe to sensor data topic
          mqttClient.subscribe("jumpstart/sensor_data", (err: any) => {
            if (err) {
              console.error("❌ Subscription error:", err);
              setMqttStatus("error");
            } else {
              console.log("📡 Subscribed to jumpstart/sensor_data");
            }
          });
        });

        mqttClient.on("message", (topic: string, message: Buffer) => {
          console.log(`📥 Topic: ${topic}, Message: ${message.toString()}`);

          try {
            const data = JSON.parse(message.toString());

            if (topic === "jumpstart/rover_location") {
              setRoverData(data);
            } else if (topic === "jumpstart/sensor_data") {
              const newSensorData = {
                ...data,
                timestamp: Date.now(),
              };

              setCurrentSensorData(newSensorData);
              setSensorData((prev) => {
                const updated = [...prev, newSensorData];
                // Keep only last 50 data points for graphs
                return updated.slice(-50);
              });
            }
          } catch (error) {
            console.log("📥 Message is not JSON");
          }
        });

        mqttClient.on("error", (err: any) => {
          console.error("❌ MQTT Error:", err);
          setMqttStatus("error");
        });

        mqttClient.on("close", () => {
          console.log("🔌 MQTT connection closed");
          setMqttStatus("disconnected");
          mqttClient = null;
        });
      })
      .catch((error) => {
        console.error("Failed to load MQTT:", error);
        setMqttStatus("error");
      });
  };

  // Send MQTT commands
  const sendCommand = (command: string, value: number) => {
    if (mqttClient && mqttStatus === "connected") {
      const message = `${command},${value}`;
      mqttClient.publish("jumpstart/rover_command", message);
      console.log(`📤 Sent command: ${message}`);
    } else {
      console.error("MQTT not connected");
    }
  };

  // Parse command string to extract parameters
  const parseCommand = (commandStr: string) => {
    if (!commandStr) return null;

    const parts = commandStr.split(",");
    if (parts.length >= 7) {
      return {
        action: parts[0],
        distance: parseFloat(parts[1]),
        angle: parseFloat(parts[2]),
        speed: parseFloat(parts[3]),
        duration: parseFloat(parts[4]),
        power: parseFloat(parts[5]),
        accuracy: parseFloat(parts[6]),
      };
    }
    return null;
  };

  const commandInfo = parseCommand(roverData.command);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Rover Demo Control
        </h1>
        <p className="text-lg text-gray-600">
          Interactive Rover Control System with Real-time MQTT Data
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side - Controls */}
        <div className="space-y-6">
          {/* MQTT Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Activity className="h-5 w-5" />
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {mqttStatus === "connected" && (
                    <Wifi className="h-5 w-5 text-green-600" />
                  )}
                  {mqttStatus === "disconnected" && (
                    <WifiOff className="h-5 w-5 text-red-600" />
                  )}
                  {mqttStatus === "connecting" && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  )}
                  {mqttStatus === "error" && (
                    <WifiOff className="h-5 w-5 text-red-600" />
                  )}
                  <span className="text-gray-700 capitalize">{mqttStatus}</span>
                </div>
                <Button
                  onClick={
                    mqttStatus === "connected"
                      ? () => mqttClient?.end()
                      : connectToMqtt
                  }
                  disabled={mqttStatus === "connecting"}
                  variant="outline"
                  size="sm"
                >
                  {mqttStatus === "connected" ? "Disconnect" : "Reconnect"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Arrow Key Controller */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Rover Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                {/* Forward Button */}
                <Button
                  onClick={() => sendCommand("drive", 1)}
                  disabled={mqttStatus !== "connected"}
                  size="lg"
                  className="h-16 w-32 bg-green-600 hover:bg-green-700 text-white"
                >
                  <ArrowUp className="h-8 w-8" />
                </Button>

                {/* Middle Row - Left and Right */}
                <div className="flex gap-8">
                  <Button
                    onClick={() => sendCommand("turn", -30)}
                    disabled={mqttStatus !== "connected"}
                    size="lg"
                    className="h-16 w-32 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ArrowLeft className="h-8 w-8" />
                  </Button>

                  <Button
                    onClick={() => sendCommand("turn", 30)}
                    disabled={mqttStatus !== "connected"}
                    size="lg"
                    className="h-16 w-32 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ArrowRight className="h-8 w-8" />
                  </Button>
                </div>

                {/* Backward Button */}
                <Button
                  onClick={() => sendCommand("drive", -1)}
                  disabled={mqttStatus !== "connected"}
                  size="lg"
                  className="h-16 w-32 bg-red-600 hover:bg-red-700 text-white"
                >
                  <ArrowDown className="h-8 w-8" />
                </Button>

                {/* Probe Button */}
                <div className="pt-4 border-t border-gray-200 w-full">
                  <Button
                    onClick={() => sendCommand("probe", 1)}
                    disabled={mqttStatus !== "connected"}
                    size="lg"
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    🔍 Probe
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle - Rover Data Display */}
        <div className="space-y-6">
          {/* Rover Location Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Compass className="h-5 w-5" />
                Rover Location Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Heading Display */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Heading:</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"
                      style={{
                        transform: `rotate(${roverData.heading_deg}deg)`,
                      }}
                    >
                      <ArrowUp className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-gray-900 font-mono text-lg">
                      {roverData.heading_deg.toFixed(1)}°
                    </span>
                  </div>
                </div>

                {/* Command Information */}
                {commandInfo && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Last Command:
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Action:</span>
                        <span className="ml-2 font-mono text-gray-900">
                          {commandInfo.action}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Distance:</span>
                        <span className="ml-2 font-mono text-gray-900">
                          {commandInfo.distance}m
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Angle:</span>
                        <span className="ml-2 font-mono text-gray-900">
                          {commandInfo.angle}°
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Speed:</span>
                        <span className="ml-2 font-mono text-gray-900">
                          {commandInfo.speed}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <span className="ml-2 font-mono text-gray-900">
                          {commandInfo.duration}s
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Power:</span>
                        <span className="ml-2 font-mono text-gray-900">
                          {commandInfo.power}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw Command String */}
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <span className="text-gray-600 text-sm">Raw Command:</span>
                  <div className="font-mono text-xs text-gray-800 mt-1 break-all">
                    {roverData.command || "No command received"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Sensor Values */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">
                Current Sensor Values
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <Thermometer className="h-6 w-6 text-red-600" />
                  <div>
                    <div className="text-sm text-gray-600">Temperature</div>
                    <div className="text-lg font-semibold text-red-700">
                      {currentSensorData.temperature?.toFixed(1) || "N/A"}°C
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Droplets className="h-6 w-6 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-600">Moisture</div>
                    <div className="text-lg font-semibold text-blue-700">
                      {currentSensorData.moisture?.toFixed(1) || "N/A"}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <Zap className="h-6 w-6 text-purple-600" />
                  <div>
                    <div className="text-sm text-gray-600">EC</div>
                    <div className="text-lg font-semibold text-purple-700">
                      {currentSensorData.ec?.toFixed(2) || "N/A"} dS/m
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Gauge className="h-6 w-6 text-green-600" />
                  <div>
                    <div className="text-sm text-gray-600">pH</div>
                    <div className="text-lg font-semibold text-green-700">
                      {currentSensorData.ph?.toFixed(1) || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Sensor Data Graphs */}
        <div className="space-y-6">
          {/* Temperature Graph */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Thermometer className="h-5 w-5 text-red-600" />
                Temperature Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sensorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleTimeString()
                      }
                      fontSize={10}
                    />
                    <YAxis fontSize={10} />
                    <ChartTooltip
                      labelFormatter={(value) =>
                        new Date(value).toLocaleTimeString()
                      }
                      formatter={(value) => [`${value}°C`, "Temperature"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke="#dc2626"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Moisture Graph */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Droplets className="h-5 w-5 text-blue-600" />
                Moisture Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sensorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleTimeString()
                      }
                      fontSize={10}
                    />
                    <YAxis fontSize={10} />
                    <ChartTooltip
                      labelFormatter={(value) =>
                        new Date(value).toLocaleTimeString()
                      }
                      formatter={(value) => [`${value}%`, "Moisture"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="moisture"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* EC Graph */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Zap className="h-5 w-5 text-purple-600" />
                Electrical Conductivity Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sensorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleTimeString()
                      }
                      fontSize={10}
                    />
                    <YAxis fontSize={10} />
                    <ChartTooltip
                      labelFormatter={(value) =>
                        new Date(value).toLocaleTimeString()
                      }
                      formatter={(value) => [`${value} dS/m`, "EC"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="ec"
                      stroke="#9333ea"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* pH Graph */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Gauge className="h-5 w-5 text-green-600" />
                pH Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sensorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleTimeString()
                      }
                      fontSize={10}
                    />
                    <YAxis fontSize={10} />
                    <ChartTooltip
                      labelFormatter={(value) =>
                        new Date(value).toLocaleTimeString()
                      }
                      formatter={(value) => [`${value}`, "pH"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="ph"
                      stroke="#16a34a"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
