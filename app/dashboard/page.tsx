"use client";

// React & core libraries
import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

// Mapbox
import mapboxgl, { Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import mqtt, { MqttClient } from "mqtt";

// Charts (Recharts & custom chart components)
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Icons
import {
  ArrowLeftToLineIcon,
  ArrowRightToLineIcon,
  Wifi,
  WifiOff,
  House,
  Navigation,
} from "lucide-react";

// Types & data utilities
import { ChemicalEstimate } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { heatmapConfigs } from "@/components/heatmapConfig";
import type { FeatureCollection, Feature, Point } from "geojson";

export default function Dashboard() {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [selectedSensor, setSelectedSensor] =
    React.useState<string>("moisture");
  const [roverPoints, setRoverPoints] = React.useState<any[]>([]);
  const [chemicalData, setChemicalData] =
    React.useState<null | ChemicalEstimate>();
  const [mapStyle, setMapStyle] = React.useState<string>("standard-satellite");
  const [largeMap, setLargeMap] = React.useState<string>("w-2/5");

  const [farmName, setFarmName] = React.useState<string>("");
  const [farmerName, setFarmerName] = React.useState<string>("");
  const [farmID, setFarmID] = React.useState<string | undefined>(undefined);
  const [mapCenter, setMapCenter] = React.useState<[number, number]>([0, 0]);

  const [roverPointsDebug, setRoverPointsDebug] = React.useState<string>("");

  // MQTT state
  const [mqttStatus, setMqttStatus] = React.useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [mqttClient, setMqttClient] = React.useState<MqttClient | null>(null);
  const [roverLocation, setRoverLocation] = React.useState<{
    lat: number;
    long: number;
  } | null>(null);
  const roverMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const connectToMqtt = () => {
    if (mqttStatus === "connected" || mqttStatus === "connecting") return;

    setMqttStatus("connecting");

    const client: MqttClient = mqtt.connect(
      "wss://mqtt-dashboard.com:8884/mqtt"
    );

    client.on("connect", () => {
      console.log("✅ Connected to MQTT broker");
      setMqttStatus("connected");
      setMqttClient(client);

      // Subscribe to a topic (example: 'test/topic')
      client.subscribe("jumpstart/ultra", (err) => {
        if (err) {
          console.error("❌ Subscription error:", err);
          setMqttStatus("error");
        } else {
          console.log("📡 Subscribed to jumpstart/ultra");
        }
      });
    });

    client.on("message", (topic, message) => {
      // Log message payload
      console.log(`📥 Topic: ${topic}, Message: ${message.toString()}`);

      // Try to parse location data from MQTT message
      try {
        const data = JSON.parse(message.toString());
        if (data.lat && data.long) {
          console.log(`📍 Rover location update: ${data.lat}, ${data.long}`);
          setRoverLocation({ lat: data.lat, long: data.long });
        }
      } catch (error) {
        console.log("📥 Message is not JSON or doesn't contain location data");
      }
    });

    client.on("error", (err) => {
      console.error("❌ MQTT Error:", err);
      setMqttStatus("error");
    });

    client.on("close", () => {
      console.log("🔌 MQTT connection closed");
      setMqttStatus("disconnected");
      setMqttClient(null);
    });
  };

  const disconnectFromMqtt = () => {
    if (mqttClient && mqttStatus === "connected") {
      mqttClient.end();
      setMqttStatus("disconnected");
      setMqttClient(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mqttClient && mqttClient.connected) {
        mqttClient.end();
      }
    };
  }, [mqttClient]);

  // Fetch recent soil chemical analysis
  useEffect(() => {
    if (!farmID) {
      console.log("No farm ID found");
      return;
    }

    async function getChemicalData(): Promise<void> {
      let { data: chemicalData, error } = await supabase
        .from("chemical-estimate")
        .select("*")
        .eq("farm_id", farmID);
      console.log("Chemical data:", chemicalData);
      setChemicalData(chemicalData ? chemicalData[0] : null);
    }

    getChemicalData();
    console.log("Chemical data:", chemicalData);
  }, [farmID]);

  // Set farm ID from cookie
  useEffect(() => {
    const farmIdFromCookie = Cookies.get("farm_id");
    setFarmID(farmIdFromCookie);
  }, []);

  // Fetch farm data when farmID changes
  useEffect(() => {
    if (!farmID) return;

    console.log("Using farm ID:", farmID);
    async function getFarmData(): Promise<void> {
      let { data: farmData, error } = await supabase
        .from("farm-data")
        .select("*")
        .eq("farm_id", farmID);

      if (farmData) {
        setMapCenter([farmData[0].long, farmData[0].lat]);
        setFarmName(farmData[0].farm_name);
        setFarmerName(farmData[0].farmer_name);
      }
    }
    getFarmData();
  }, [farmID]);

  // Fetch rover points when sensor changes or farmID changes
  useEffect(() => {
    if (!farmID) {
      console.log("No farm ID available, skipping rover points fetch");
      return;
    }

    async function fetchRoverPoints() {
      let { data: roverpoints, error } = await supabase
        .from("rover-points")
        .select("*")
        .eq("farm_id", farmID);
      if (roverpoints) setRoverPoints(roverpoints);
      console.log("Rover points:", roverpoints);
      console.log("Farm ID:", farmID);
    }
    fetchRoverPoints();
  }, [selectedSensor, farmID]);

  // Update map and heatmap layer
  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_KEY;
    if (mapContainerRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: mapCenter,
        zoom: 18,
      });

      // Add marker for farm center
      const farmMarker = document.createElement("House");
      new mapboxgl.Marker({
        element: farmMarker,
      })
        .setLngLat(mapCenter)
        .addTo(mapRef.current!);

      // Add animated rover marker
      roverMarkerRef.current = new mapboxgl.Marker({
        color: "#F84C4C", // Red color for rover
        scale: 1.2,
      })
        .setLngLat(mapCenter)
        .addTo(mapRef.current!);

      // Add navigation control
      const nav = new mapboxgl.NavigationControl({
        visualizePitch: true,
        showZoom: true,
      });
      mapRef.current.addControl(nav, "bottom-right");

      mapRef.current.on("load", () => {
        // Add rover points as geojson source
        const geojson: FeatureCollection<Point> = {
          type: "FeatureCollection",
          features: roverPoints.map((pt) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [pt.long, pt.lat],
            },
            properties: pt,
          })) as Feature<Point>[],
        };
        if (mapRef.current!.getSource("rover-points")) {
          (mapRef.current!.getSource("rover-points") as any).setData(geojson);
        } else {
          mapRef.current!.addSource("rover-points", {
            type: "geojson",
            data: geojson,
          });
        }
        // Remove previous heatmap layer if exists
        if (mapRef.current!.getLayer("rover-heatmap")) {
          mapRef.current!.removeLayer("rover-heatmap");
        }
        // Add heatmap layer
        const config =
          heatmapConfigs[selectedSensor as keyof typeof heatmapConfigs];
        mapRef.current!.addLayer({
          id: "rover-heatmap",
          type: "heatmap",
          source: "rover-points",
          maxzoom: 22,
          paint: {
            "heatmap-weight": config.weight as any,
            "heatmap-intensity": config.intensity as any,
            "heatmap-color": config.color as any,
            "heatmap-radius": config.radius as any,
            "heatmap-opacity": config.opacity as any,
          },
        });
        mapRef.current!.on("click", (e) => {
          console.log("Clicked location:", e.lngLat);
        });
      });
    }
    return () => {
      mapRef.current?.remove();
    };
  }, [mapCenter, roverPoints, selectedSensor]);

  useEffect(() => {
    mapRef.current!.setStyle("mapbox://styles/mapbox/" + mapStyle);
  }, [mapStyle]);

  // Animate rover marker when location updates
  useEffect(() => {
    if (roverLocation && roverMarkerRef.current && mapRef.current) {
      // Animate the marker to the new position
      const animateMarker = (timestamp: number) => {
        const currentPos = roverMarkerRef.current!.getLngLat();
        const targetPos = [roverLocation.long, roverLocation.lat];

        // Calculate the distance to move
        const dx = targetPos[0] - currentPos.lng;
        const dy = targetPos[1] - currentPos.lat;

        // If we're close enough to the target, stop animating
        if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) {
          roverMarkerRef.current!.setLngLat([
            roverLocation.long,
            roverLocation.lat,
          ] as [number, number]);
          return;
        }

        // Smooth animation - move 10% of the distance each frame
        const newLng = currentPos.lng + dx * 0.1;
        const newLat = currentPos.lat + dy * 0.1;

        roverMarkerRef.current!.setLngLat([newLng, newLat] as [number, number]);

        // Continue animation
        requestAnimationFrame(animateMarker);
      };

      // Start the animation
      requestAnimationFrame(animateMarker);
    }
  }, [roverLocation]);

  return (
    <div className="flex flex-col">
      <div className="flex flex-row w-screen h-screen">
        <div
          className={`${largeMap} flex flex-col p-4 bg-white gap-4 overflow-y-scroll `}
        >
          <div className="flex flex-col p-4">
            <p className="text-sm text-gray-600">{farmerName}</p>
            <p className="text-2xl font-bold mb-2">{farmName}</p>
            <p>
              Soil pH is balanced at 6.7 with minor acidic spots. EC (1.2 dS/m),
              moisture (30%), and temperature (22°C) are within optimal ranges.
              Nitrogen and potassium are sufficient, but phosphorus is slightly
              low, requiring targeted supplementation.
            </p>
          </div>
          {/* Soil Analysis */}

          {chemicalData ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col">
                <div className="flex flex-row justify-center gap-4 font-medium font-mono text-sm">
                  Latest Chemical Analysis:&nbsp;
                  {new Date(chemicalData?.created_at || "")
                    .toDateString()
                    .slice(4)}
                </div>
                <div className="flex flex-row justify-center gap-4 font-medium font-mono text-sm">
                  {roverPoints.length > 0
                    ? "Latest Rover Input:"
                    : "No Rover Data Input"}
                  {roverPoints.length > 0 &&
                    new Date(roverPoints[0]?.created_at || "")
                      .toDateString()
                      .slice(4)}
                </div>
              </div>
              <div className="flex flex-row gap-4">
                {/* Percentage - Secondary Macronutrients */}
                <Card className="flex-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      Sulphur (S)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {chemicalData.sulphur}
                      </div>
                      <div className="text-sm text-gray-600">
                        Percentage (%)
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* dS/m - Electrical Conductivity */}
                <Card className="flex-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      Electrical Conductivity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">
                        {chemicalData.ec}
                      </div>
                      <div
                        className="text-sm text-gray-60
                    0"
                      >
                        dS/m
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* pH - Soil Acidity/Alkalinity */}
                <Card className="flex-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      Soil acidity/alkalinity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600">
                        {chemicalData.ph}
                      </div>
                      <div className="text-sm text-gray-600">pH</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Macronutrients
                  </CardTitle>
                  <CardDescription>
                    Kilograms per Hectare (Kg/Ha)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      value: {
                        label: "Value",
                        color: "var(--chart-1)",
                      },
                    }}
                  >
                    <BarChart
                      accessibilityLayer
                      data={[
                        { name: "Nitrogen (N)", value: chemicalData.nitrogen },
                        {
                          name: "Phosphorus (P)",
                          value: chemicalData.phosphorus,
                        },
                        {
                          name: "Potassium (K)",
                          value: chemicalData.potassium,
                        },
                      ]}
                      width={400}
                      height={200}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <YAxis
                        dataKey="value"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Bar
                        dataKey="value"
                        fill="var(--color-value)"
                        radius={8}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* PPM - Micronutrients */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Macronutrients
                  </CardTitle>
                  <CardDescription>Parts Per Million (PPM)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      value: {
                        label: "Value",
                        color: "var(--chart-1)",
                      },
                    }}
                  >
                    <BarChart
                      accessibilityLayer
                      data={[
                        { name: "Copper (Cu)", value: chemicalData.copper },
                        { name: "Iron (Fe)", value: chemicalData.iron },
                        { name: "Zinc (Zn)", value: chemicalData.zinc },
                        { name: "Boron (B)", value: chemicalData.boron },
                      ]}
                      width={400}
                      height={200}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <YAxis
                        dataKey="value"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Bar
                        dataKey="value"
                        fill="var(--color-value)"
                        radius={8}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-2xl font-bold">No data available</p>
              <p className="text-sm text-gray-600">
                After you use the rover, the data will eventually show up here.
              </p>
              <Button
                variant="outline"
                onClick={async () => {
                  setRoverPointsDebug("Fetching...");
                  let { data: roverpoints, error } = await supabase
                    .from("rover-points")
                    .select("*")
                    .eq("farm_id", farmID);
                  setRoverPointsDebug(JSON.stringify(roverpoints));
                }}
              >
                [Debug] Fetch Rover Points
              </Button>
              <p className="text-sm text-gray-600 font-mono">
                {roverPointsDebug == "[ ]" ? roverPointsDebug : "No data"}
              </p>
            </div>
          )}
        </div>
        <div className={"w-3/5 flex flex-col items-center justify-center"}>
          <div className="relative w-full h-full p-4">
            <div
              ref={mapContainerRef}
              className="w-full h-full rounded-2xl overflow-hidden"
            />

            <div className="absolute top-6 left-6 z-10 flex gap-2 items-start p-2 rounded-2xl backdrop-blur-lg outline-1">
              {/* Sensor Dropdown */}
              <Button
                variant={"outline"}
                onClick={() => {
                  setLargeMap(largeMap === "w-2/5" ? "w-4/5" : "w-2/5");
                  console.log(largeMap);
                }}
              >
                {largeMap === "w-2/5" ? (
                  <ArrowRightToLineIcon />
                ) : (
                  <ArrowLeftToLineIcon />
                )}
              </Button>
              <Select value={selectedSensor} onValueChange={setSelectedSensor}>
                <SelectTrigger className="w-[200px] bg-white">
                  <SelectValue placeholder="Sensor Map Display" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moisture">Moisture</SelectItem>
                  <SelectItem value="temperature">Temperature</SelectItem>
                  <SelectItem value="pH">pH</SelectItem>
                  <SelectItem value="EC">Electrical Conductivity</SelectItem>
                </SelectContent>
              </Select>

              <Select value={mapStyle} onValueChange={setMapStyle}>
                <SelectTrigger className="w-[200px] bg-white">
                  <SelectValue placeholder="Map Style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard-satellite">Satellite</SelectItem>
                  <SelectItem value="outdoors-v12">Street</SelectItem>
                </SelectContent>
              </Select>

              {/* MQTT Connection Button */}
              <Button
                variant={"outline"}
                onClick={
                  mqttStatus === "connected"
                    ? disconnectFromMqtt
                    : connectToMqtt
                }
                disabled={mqttStatus === "connecting"}
              >
                {mqttStatus === "connecting" && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                )}
                {mqttStatus === "connected" && (
                  <Wifi className="h-4 w-4 mr-2 text-green-600" />
                )}
                {mqttStatus === "error" && (
                  <WifiOff className="h-4 w-4 mr-2 text-red-600" />
                )}
                {mqttStatus === "disconnected" && (
                  <WifiOff className="h-4 w-4 mr-2" />
                )}
              </Button>

              {/* Navigation Button */}
              <Button
                variant={"outline"}
                onClick={() => router.push("/waypoints")}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Waypoints
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
