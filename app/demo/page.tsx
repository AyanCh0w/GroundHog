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
} from "lucide-react";

// MQTT Client for sending commands
let mqttClient: any = null;

export default function DemoPage() {
  const [mqttStatus, setMqttStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [liveData, setLiveData] = useState({
    temperature: 25.4,
    humidity: 65.2,
    battery: 87.3,
    speed: 0.0,
    heading: 180.0,
    altitude: 1250.5,
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

          // Subscribe to rover data topics
          mqttClient.subscribe("jumpstart/rover_data", (err: any) => {
            if (err) {
              console.error("❌ Subscription error:", err);
              setMqttStatus("error");
            } else {
              console.log("📡 Subscribed to jumpstart/rover_data");
            }
          });

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
            // Update live data based on topic
            if (topic === "jumpstart/rover_data") {
              setLiveData((prev) => ({
                ...prev,
                speed: data.speed || prev.speed,
                heading: data.heading || prev.heading,
                altitude: data.altitude || prev.altitude,
              }));
            } else if (topic === "jumpstart/sensor_data") {
              setLiveData((prev) => ({
                ...prev,
                temperature: data.temperature || prev.temperature,
                humidity: data.humidity || prev.humidity,
                battery: data.battery || prev.battery,
              }));
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

  // Simulate live data updates for demo purposes
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData((prev) => ({
        ...prev,
        temperature: prev.temperature + (Math.random() - 0.5) * 0.2,
        humidity: prev.humidity + (Math.random() - 0.5) * 0.5,
        battery: Math.max(0, prev.battery - 0.01),
        speed: prev.speed + (Math.random() - 0.5) * 0.1,
        heading: (prev.heading + (Math.random() - 0.5) * 2) % 360,
        altitude: prev.altitude + (Math.random() - 0.5) * 0.1,
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Rover Demo Control
        </h1>
        <p className="text-lg text-gray-600">
          Interactive Rover Control System
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    disabled={true}
                    size="lg"
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white opacity-50"
                  >
                    🔍 Probe (Coming Soon)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Live Data Display */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Live Rover Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* Environmental Data */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                    Environmental
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Temperature:</span>
                      <span className="text-gray-900 font-mono text-lg">
                        {liveData.temperature.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Humidity:</span>
                      <span className="text-gray-900 font-mono text-lg">
                        {liveData.humidity.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Battery:</span>
                      <span className="text-gray-900 font-mono text-lg">
                        {liveData.battery.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Movement Data */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                    Movement
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Speed:</span>
                      <span className="text-gray-900 font-mono text-lg">
                        {liveData.speed.toFixed(1)} m/s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Heading:</span>
                      <span className="text-gray-900 font-mono text-lg">
                        {liveData.heading.toFixed(1)}°
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Altitude:</span>
                      <span className="text-gray-900 font-mono text-lg">
                        {liveData.altitude.toFixed(1)} m
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Update Indicator */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">
                    Live data updating every 2 seconds
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Command Log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Command Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded border border-gray-200 h-32 overflow-y-auto">
                <div className="text-gray-600 text-sm">
                  <div>Ready to send commands...</div>
                  <div>Use the arrow controls to move the rover</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
