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
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
// Chemical data will be streamed via MQTT (no database)

// MQTT Client for sending commands and receiving data
let mqttClient: any = null;

// Types for MQTT data
interface RoverLocationData {
  heading_deg: number;
  command: string;
}

interface SensorData {
  farm_id?: string;
  created_at?: string;
  temperature?: number;
  humidity?: number;
  EC?: number;
  pH?: number;
  timestamp?: number;
}

// Chemical data streamed via MQTT (no database)
interface ChemicalData {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  copper: number;
  iron: number;
  zinc: number;
  boron: number;
  created_at?: string;
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
    humidity: 0,
    EC: 0,
    pH: 0,
  });

  // Farm and chemical data for dashboard-style charts (realtime via MQTT)
  const [farmID, setFarmID] = useState<string | undefined>(undefined);
  const [chemicalData, setChemicalData] = useState<ChemicalData | null>(null);
  const [isApiLoading, setIsApiLoading] = useState(false);

  // Request AI analysis whenever sensor data updates
  useEffect(() => {
    if (currentSensorData && Object.keys(currentSensorData).length > 0) {
      console.log("📡 Sensor data updated, requesting ML prediction...");
      requestMLPrediction();
    }
  }, [currentSensorData]);

  // Request ML prediction whenever sensor data updates
  const requestMLPrediction = async () => {
    // Set loading state
    setIsApiLoading(true);
    console.log("🤖 Requesting ML prediction from API...");
    console.log("📊 Sending sensor data:", {
      temp: currentSensorData.temperature || 25,
      moisture: (currentSensorData.humidity || 60) / 100,
      ec: currentSensorData.EC || 1.5,
      pH: currentSensorData.pH || 7.0,
    });

    // Create a timeout promise for 10 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("API request timeout after 10 seconds")),
        10000
      );
    });

    try {
      const fetchPromise = fetch(
        "https://ayanch0w-chemicalpredictiongroundhog.hf.space/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            temp: currentSensorData.temperature || 25,
            moisture: (currentSensorData.humidity || 60) / 100, // Convert percentage to decimal
            ec: currentSensorData.EC || 1.5,
            pH: currentSensorData.pH || 7.0,
          }),
        }
      );

      const response = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as Response;

      if (response.ok) {
        const predictionResult = await response.json();
        console.log("✅ ML prediction received:", predictionResult);

        // The API returns nutrient predictions in the format:
        // { B_ppm, Cu_ppm, Fe_ppm, K_ppm, N_ppm, P_ppm, S_ppm, Zn_ppm }
        if (predictionResult && predictionResult.N_ppm !== undefined) {
          console.log(
            "🧪 API returned nutrient predictions:",
            predictionResult
          );

          // Convert API response to our ChemicalData format and update graphs
          const apiChemicalData: ChemicalData = {
            nitrogen: Number(predictionResult.N_ppm),
            phosphorus: Number(predictionResult.P_ppm),
            potassium: Number(predictionResult.K_ppm),
            copper: Number(predictionResult.Cu_ppm),
            iron: Number(predictionResult.Fe_ppm),
            zinc: Number(predictionResult.Zn_ppm),
            boron: Number(predictionResult.B_ppm),
            created_at: new Date().toISOString(),
          };

          console.log(
            "🔄 Updating graphs with ML prediction:",
            apiChemicalData
          );

          // Update the chemical data state to refresh graphs
          setChemicalData(apiChemicalData);
        }
      } else {
        console.error("❌ ML prediction request failed:", response.status);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        console.error("⏰ API request timeout after 10 seconds");
      } else {
        console.error("❌ Error requesting ML prediction:", error);
      }
    } finally {
      setIsApiLoading(false);
      console.log("🔄 ML prediction request completed");
    }
  };

  // Auto-connect to MQTT on page load
  useEffect(() => {
    connectToMqtt();
  }, []);

  // Update farmID from incoming live sensor data
  useEffect(() => {
    if (currentSensorData?.farm_id) {
      setFarmID(currentSensorData.farm_id);
    }
  }, [currentSensorData?.farm_id]);

  // No database fetches; chemical data updates via MQTT only

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

          // Subscribe to chemical estimate topic (realtime)
          mqttClient.subscribe("jumpstart/chemical_estimate", (err: any) => {
            if (err) {
              console.error("❌ Subscription error:", err);
              setMqttStatus("error");
            } else {
              console.log("📡 Subscribed to jumpstart/chemical_estimate");
              console.log("🔍 Waiting for chemical analysis data...");
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
            } else if (topic === "jumpstart/chemical_estimate") {
              console.log("🧪 CHEMICAL ANALYSIS RECEIVED!");
              console.log("📊 Raw chemical data:", data);
              console.log("🔍 Data type:", typeof data);
              console.log("📋 Data keys:", Object.keys(data));

              // Try both data formats - the demo page format and the API format
              let chem: ChemicalData;

              if (data.nitrogen !== undefined) {
                // Demo page format: nitrogen, phosphorus, potassium, etc.
                console.log("📝 Using demo page data format");
                chem = {
                  nitrogen: Number(data.nitrogen) || 0,
                  phosphorus: Number(data.phosphorus) || 0,
                  potassium: Number(data.potassium) || 0,
                  copper: Number(data.copper) || 0,
                  iron: Number(data.iron) || 0,
                  zinc: Number(data.zinc) || 0,
                  boron: Number(data.boron) || 0,
                  created_at: data.created_at,
                } as ChemicalData;
              } else if (data.N_ppm !== undefined) {
                // API format: N_ppm, P_ppm, K_ppm, etc.
                console.log("📝 Using API data format (N_ppm, P_ppm, etc.)");
                chem = {
                  nitrogen: Number(data.N_ppm) || 0,
                  phosphorus: Number(data.P_ppm) || 0,
                  potassium: Number(data.K_ppm) || 0,
                  copper: Number(data.Cu_ppm) || 0,
                  iron: Number(data.Fe_ppm) || 0,
                  zinc: Number(data.Zn_ppm) || 0,
                  boron: Number(data.B_ppm) || 0,
                  created_at: data.created_at,
                } as ChemicalData;
              } else {
                console.error(
                  "❌ Unknown data format - neither demo nor API format detected"
                );
                console.log("🔍 Available keys:", Object.keys(data));
                console.log(
                  "🔍 Sample values:",
                  Object.entries(data).slice(0, 5)
                );
                return; // Don't update state if we can't parse the data
              }

              console.log("🧬 Parsed chemical data:", chem);
              console.log("✅ Setting chemical data state...");

              setChemicalData(chem);

              console.log("🎯 Chemical data state updated successfully");
            }
          } catch (error) {
            console.log("📥 Message is not JSON");
            console.error("❌ JSON parsing error:", error);
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

  return (
    <div className="h-screen overflow-hidden bg-gray-50 p-4">
      {/* Header */}

      <div className="w-full h-full space-y-4">
        {/* Two-column layout: Left navigation and info, Right stacked graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
          {/* Left Side - Controls, then Connection + Heading */}
          <div className="flex flex-col space-y-3 h-full">
            {/* Rover Controls */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Groundhog</h1>
            </div>
            <Card className="py-3 flex-1">
              <CardHeader className="px-4">
                <CardTitle className="text-gray-900 text-sm">
                  Rover Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 h-full">
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                  <Button
                    onClick={() => sendCommand("drive", 1)}
                    disabled={mqttStatus !== "connected"}
                    size="sm"
                    className="h-24 w-48 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <ArrowUp className="h-10 w-10" />
                  </Button>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => sendCommand("turn", -30)}
                      disabled={mqttStatus !== "connected"}
                      size="sm"
                      className="h-24 w-48 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <ArrowLeft className="h-10 w-10" />
                    </Button>
                    <Button
                      onClick={() => sendCommand("turn", 30)}
                      disabled={mqttStatus !== "connected"}
                      size="sm"
                      className="h-24 w-48 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <ArrowRight className="h-10 w-10" />
                    </Button>
                  </div>
                  <Button
                    onClick={() => sendCommand("drive", -1)}
                    disabled={mqttStatus !== "connected"}
                    size="sm"
                    className="h-24 w-48 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <ArrowDown className="h-10 w-10" />
                  </Button>
                  <div className="pt-3 border-t border-gray-200 w-full">
                    <Button
                      onClick={() => sendCommand("probe", 1)}
                      disabled={mqttStatus !== "connected"}
                      size="sm"
                      className="w-full h-16 bg-purple-600 hover:bg-purple-700 text-white text-base"
                    >
                      🔍 Probe
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connection Status */}
            <Card className="py-3">
              <CardHeader className="px-4">
                <CardTitle className="flex items-center gap-2 text-gray-900 text-sm">
                  <Activity className="h-4 w-4" />
                  Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {mqttStatus === "connected" && (
                      <Wifi className="h-4 w-4 text-green-600" />
                    )}
                    {mqttStatus === "disconnected" && (
                      <WifiOff className="h-4 w-4 text-red-600" />
                    )}
                    {mqttStatus === "connecting" && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                    {mqttStatus === "error" && (
                      <WifiOff className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-gray-700 capitalize text-sm">
                      {mqttStatus}
                    </span>
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

            {/* Rover Heading */}
            <Card className="py-3">
              <CardHeader className="px-4">
                <CardTitle className="flex items-center gap-2 text-gray-900 text-sm">
                  <Compass className="h-4 w-4" />
                  Rover Location Data
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Heading:</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center"
                      style={{
                        transform: `rotate(${roverData.heading_deg}deg)`,
                      }}
                    >
                      <ArrowUp className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-gray-900 font-mono text-base">
                      {roverData.heading_deg.toFixed(1)}°
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Time Series (top) + Dashboard charts (below) */}
          <div className="space-y-3">
            {/* Time Series Graphs in 2x2 grid - Fixed layout */}
            <div className="grid grid-cols-2 gap-3 min-w-0">
              <Card className="py-2">
                <CardHeader className="px-3 pb-2">
                  <CardTitle className="flex items-center gap-2 text-gray-900 text-xs">
                    <Thermometer className="h-3.5 w-3.5 text-red-600" />
                    Temperature
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pt-0">
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={sensorData}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={(value) =>
                            new Date(value).toLocaleTimeString()
                          }
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          domain={["dataMin - 1", "dataMax + 1"]}
                        />
                        <ChartTooltip
                          labelFormatter={(value) =>
                            new Date(value).toLocaleTimeString()
                          }
                          formatter={(value) => [
                            String(value) + "°C",
                            "Temperature",
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="temperature"
                          stroke="#dc2626"
                          strokeWidth={2}
                          dot={false}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="py-2">
                <CardHeader className="px-3 pb-2">
                  <CardTitle className="flex items-center gap-2 text-gray-900 text-xs">
                    <Droplets className="h-3.5 w-3.5 text-blue-600" />
                    Humidity
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pt-0">
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={sensorData}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={(value) =>
                            new Date(value).toLocaleTimeString()
                          }
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          domain={["dataMin - 1", "dataMax + 1"]}
                        />
                        <ChartTooltip
                          labelFormatter={(value) =>
                            new Date(value).toLocaleTimeString()
                          }
                          formatter={(value) => [
                            String(value) + "%",
                            "Humidity",
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="humidity"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={false}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="py-2">
                <CardHeader className="px-3 pb-2">
                  <CardTitle className="flex items-center gap-2 text-gray-900 text-xs">
                    <Zap className="h-3.5 w-3.5 text-purple-600" />
                    EC
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pt-0">
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={sensorData}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={(value) =>
                            new Date(value).toLocaleTimeString()
                          }
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          domain={["dataMin - 0.1", "dataMax + 0.1"]}
                        />
                        <ChartTooltip
                          labelFormatter={(value) =>
                            new Date(value).toLocaleTimeString()
                          }
                          formatter={(value) => [String(value) + " dS/m", "EC"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="EC"
                          stroke="#9333ea"
                          strokeWidth={2}
                          dot={false}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="py-2">
                <CardHeader className="px-3 pb-2">
                  <CardTitle className="flex items-center gap-2 text-gray-900 text-xs">
                    <Gauge className="h-3.5 w-3.5 text-green-600" />
                    pH
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pt-0">
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={sensorData}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={(value) =>
                            new Date(value).toLocaleTimeString()
                          }
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          domain={["dataMin - 0.1", "dataMax + 0.1"]}
                        />
                        <ChartTooltip
                          labelFormatter={(value) =>
                            new Date(value).toLocaleTimeString()
                          }
                          formatter={(value) => [String(value), "pH"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="pH"
                          stroke="#16a34a"
                          strokeWidth={2}
                          dot={false}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* API Status Indicator */}
            {isApiLoading && (
              <Card className="py-2 mb-3">
                <CardContent className="px-4 py-2">
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>🤖 Requesting ML prediction...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* NPK Chart - Full Width */}
            <Card className="py-2 h-full">
              <CardHeader className="px-4 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-900">
                  NPK (Nitrogen, Phosphorus, Potassium)
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <div className="w-full" style={{ height: 120 }}>
                  <ChartContainer
                    config={{
                      value: { label: "Value", color: "var(--color-value)" },
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            name: "Nitrogen (N)",
                            value: chemicalData?.nitrogen || 0,
                          },
                          {
                            name: "Phosphorus (P)",
                            value: chemicalData?.phosphorus || 0,
                          },
                          {
                            name: "Potassium (K)",
                            value: chemicalData?.potassium || 0,
                          },
                        ]}
                        margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                      >
                        <CartesianGrid
                          vertical={false}
                          strokeDasharray="3 3"
                          stroke="#f0f0f0"
                        />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          tickMargin={8}
                          axisLine={false}
                          fontSize={10}
                          interval={0}
                          textAnchor="middle"
                        />
                        <YAxis
                          dataKey="value"
                          tickLine={false}
                          tickMargin={8}
                          axisLine={false}
                          fontSize={10}
                          domain={[0, "dataMax + 10"]}
                          tickFormatter={(value) => `${value} ppm`}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent />}
                        />
                        <Bar
                          dataKey="value"
                          fill="var(--color-value)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={80}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            {/* Data Status */}
            {!chemicalData && (
              <Card className="py-2">
                <CardContent className="px-4 py-3 text-sm text-gray-600">
                  Waiting for sensor data to generate ML predictions...
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
