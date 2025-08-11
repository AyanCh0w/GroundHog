"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { WaypointPath } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Upload,
  Satellite,
  Wifi,
  WifiOff,
  MapPin,
  Navigation,
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import mqtt, { MqttClient } from "mqtt";

// MQTT State Types
type MqttStatus = "disconnected" | "connecting" | "connected" | "error";

interface RoverLocation {
  lat: number;
  long: number;
}

// MQTT Hook for this component
function useMqtt() {
  const [mqttStatus, setMqttStatus] = useState<MqttStatus>("disconnected");
  const [mqttClient, setMqttClient] = useState<MqttClient | null>(null);
  const [roverLocation, setRoverLocation] = useState<RoverLocation | null>(
    null
  );

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

      // Subscribe to rover location topic
      client.subscribe("jumpstart/rover_location", (err) => {
        if (err) {
          console.error("❌ Subscription error:", err);
          setMqttStatus("error");
        } else {
          console.log("📡 Subscribed to jumpstart/rover_location");
        }
      });
    });

    client.on("message", (topic, message) => {
      console.log(`📥 Topic: ${topic}, Message: ${message.toString()}`);

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

  const uploadWaypoints = (waypoints: any[]) => {
    if (!mqttClient || mqttStatus !== "connected") {
      console.error("MQTT not connected");
      return;
    }

    const coordinates = waypoints.map((waypoint) => ({
      name: waypoint.name,
      lat: waypoint.lat,
      long: waypoint.long,
      order_index: waypoint.order_index,
    }));

    const payload = JSON.stringify(coordinates);
    mqttClient.publish("jumpstart/rover_waypoints", payload, (err) => {
      if (err) {
        console.error("❌ Failed to publish waypoints:", err);
      } else {
        console.log("✅ Waypoints uploaded successfully");
      }
    });
  };

  useEffect(() => {
    return () => {
      if (mqttClient && mqttClient.connected) {
        mqttClient.end();
      }
    };
  }, [mqttClient]);

  return {
    mqttStatus,
    mqttClient,
    roverLocation,
    connectToMqtt,
    disconnectFromMqtt,
    uploadWaypoints,
  };
}

// Map component to display waypoints and path using Mapbox
function WaypointMap({
  waypoints,
  roverLocation,
}: {
  waypoints: any[];
  roverLocation?: RoverLocation | null;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const waypointMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const pathLineRef = useRef<mapboxgl.GeoJSONSource | null>(null);
  const roverMarkerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || waypoints.length === 0) return;

    // Calculate center from waypoints
    const lats = waypoints.map((w) => w.lat);
    const longs = waypoints.map((w) => w.long);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLong = (Math.min(...longs) + Math.max(...longs)) / 2;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_KEY!;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [centerLong, centerLat],
      zoom: 18,
      interactive: false, // Make it non-interactive as requested
    });

    // Wait for style to load before adding path layer
    mapRef.current.once("style.load", () => {
      // Add path line source
      if (mapRef.current && !mapRef.current.getSource("path-line")) {
        mapRef.current.addSource("path-line", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: [] },
          },
        });
      }

      // Add path line layer
      if (mapRef.current && !mapRef.current.getLayer("path-line-layer")) {
        mapRef.current.addLayer({
          id: "path-line-layer",
          type: "line",
          source: "path-line",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#3B82F6",
            "line-width": 4,
            "line-opacity": 0.9,
            "line-dasharray": [2, 2],
          },
        });
      }

      pathLineRef.current = mapRef.current
        ? (mapRef.current.getSource("path-line") as mapboxgl.GeoJSONSource)
        : null;

      updateMapWaypoints();

      // Auto-fit all waypoints with padding
      if (waypoints.length > 0 && mapRef.current) {
        const bounds = new mapboxgl.LngLatBounds();
        waypoints.forEach((waypoint) => {
          bounds.extend([waypoint.long, waypoint.lat]);
        });

        // Add padding to bounds for better visibility
        const padding = 50; // pixels
        mapRef.current.fitBounds(bounds, {
          padding: padding,
          duration: 0, // No animation
          maxZoom: 20, // Prevent zooming in too far
        });
      }
    });

    return () => {
      mapRef.current?.remove();
    };
  }, [waypoints]);

  const updateMapWaypoints = () => {
    if (!mapRef.current || !waypoints.length) return;

    // Clear existing waypoint markers
    waypointMarkersRef.current.forEach((marker) => marker.remove());
    waypointMarkersRef.current = [];

    // Add waypoint markers
    waypoints.forEach((waypoint, index) => {
      const markerElement = document.createElement("div");
      markerElement.className = "waypoint-marker";
      markerElement.innerHTML = `
        <div class="relative">
          <div class="w-6 h-6 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
            ${index + 1}
          </div>
          <div class="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            ${waypoint.name}
          </div>
        </div>
      `;

      const marker = new mapboxgl.Marker({
        element: markerElement,
      })
        .setLngLat([waypoint.long, waypoint.lat])
        .addTo(mapRef.current!);

      waypointMarkersRef.current.push(marker);
    });

    // Update path line
    const coords = [...waypoints]
      .sort((a, b) => a.order_index - b.order_index)
      .map((wp) => [wp.long, wp.lat]);

    const pathSource = mapRef.current.getSource(
      "path-line"
    ) as mapboxgl.GeoJSONSource;
    if (pathSource) {
      const lineData = {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: coords },
      };
      pathSource.setData(lineData as any);
    }
  };

  // Update rover marker when location changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing rover marker
    if (roverMarkerRef.current) {
      roverMarkerRef.current.remove();
      roverMarkerRef.current = null;
    }

    // Add new rover marker if location exists
    if (roverLocation) {
      const roverElement = document.createElement("div");
      roverElement.className = "rover-marker";
      roverElement.innerHTML = `
        <div class="relative">
          <div class="w-8 h-8 bg-red-600 border-2 border-white rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg animate-pulse">
            <Navigation className="h-4 w-4" />
          </div>
          <div class="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            Rover
          </div>
        </div>
      `;

      roverMarkerRef.current = new mapboxgl.Marker({
        element: roverElement,
      })
        .setLngLat([roverLocation.long, roverLocation.lat])
        .addTo(mapRef.current);
    }
  }, [roverLocation]);

  // Cleanup rover marker on unmount
  useEffect(() => {
    return () => {
      if (roverMarkerRef.current) {
        roverMarkerRef.current.remove();
      }
    };
  }, []);

  if (waypoints.length === 0) return null;

  return (
    <div className="w-full h-[500px] rounded-lg border overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}

export default function NavigatePage() {
  const searchParams = useSearchParams();
  const pathId = searchParams.get("path");
  const [waypointPath, setWaypointPath] = useState<WaypointPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // MQTT functionality
  const {
    mqttStatus,
    roverLocation,
    connectToMqtt,
    disconnectFromMqtt,
    uploadWaypoints,
  } = useMqtt();

  useEffect(() => {
    if (!pathId) {
      setError("No path ID provided");
      setLoading(false);
      return;
    }

    fetchWaypointPath(pathId);
  }, [pathId]);

  const fetchWaypointPath = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // First, fetch the waypoint path
      const { data: pathData, error: pathError } = await supabase
        .from("waypoint_paths")
        .select("*")
        .eq("id", id)
        .single();

      if (pathError) {
        throw new Error(`Error fetching path: ${pathError.message}`);
      }

      if (!pathData) {
        throw new Error("Path not found");
      }

      // Then, fetch the waypoints for this path
      const { data: waypointsData, error: waypointsError } = await supabase
        .from("waypoints")
        .select("*")
        .eq("path_id", id)
        .order("order_index", { ascending: true });

      if (waypointsError) {
        throw new Error(`Error fetching waypoints: ${waypointsError.message}`);
      }

      // Combine the data
      const completePath: WaypointPath = {
        ...pathData,
        waypoints: waypointsData || [],
      };

      setWaypointPath(completePath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
            <Button
              onClick={() => window.history.back()}
              className="mt-4"
              variant="outline"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!waypointPath) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Path Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested waypoint path could not be found.</p>
            <Button
              onClick={() => window.history.back()}
              className="mt-4"
              variant="outline"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Navigation: {waypointPath.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Created: {new Date(waypointPath.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={
              mqttStatus === "connected" ? disconnectFromMqtt : connectToMqtt
            }
            disabled={mqttStatus === "connecting"}
            className="flex items-center gap-2"
          >
            {mqttStatus === "connecting" && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            )}
            {mqttStatus === "connected" && (
              <Wifi className="h-4 w-4 text-green-600" />
            )}
            {mqttStatus === "error" && (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            {mqttStatus === "disconnected" && <WifiOff className="h-4 w-4" />}
            {mqttStatus === "connected" ? "Disconnect" : "Connect"}
          </Button>

          <Button
            variant="outline"
            onClick={() => uploadWaypoints(waypointPath.waypoints)}
            disabled={mqttStatus !== "connected"}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Waypoints
          </Button>

          {roverLocation && (
            <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-blue-50 text-blue-700">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">
                Rover: {roverLocation.lat.toFixed(6)},{" "}
                {roverLocation.long.toFixed(6)}
              </span>
            </div>
          )}

          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
        </div>
      </div>

      {/* Map Section */}
      <Card>
        <CardHeader>
          <CardTitle>Path Map</CardTitle>
        </CardHeader>
        <CardContent>
          <WaypointMap
            waypoints={waypointPath.waypoints}
            roverLocation={roverLocation}
          />
        </CardContent>
      </Card>

      {/* MQTT Status Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Satellite className="h-5 w-5" />
            MQTT Status & Rover Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Connection Status */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-700">
                Connection Status
              </h3>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    mqttStatus === "connected"
                      ? "bg-green-500"
                      : mqttStatus === "connecting"
                      ? "bg-yellow-500"
                      : mqttStatus === "error"
                      ? "bg-red-500"
                      : "bg-gray-400"
                  }`}
                />
                <span className="text-sm capitalize">{mqttStatus}</span>
              </div>
              <p className="text-xs text-gray-500">
                {mqttStatus === "connected"
                  ? "Connected to MQTT broker and listening for rover updates"
                  : mqttStatus === "connecting"
                  ? "Establishing connection..."
                  : mqttStatus === "error"
                  ? "Connection failed. Check broker settings."
                  : "Not connected. Click Connect to enable MQTT functionality."}
              </p>
            </div>

            {/* Rover Location */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-700">
                Rover Location
              </h3>
              {roverLocation ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span>Lat: {roverLocation.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span>Long: {roverLocation.long.toFixed(6)}</span>
                  </div>
                  <p className="text-xs text-green-600">
                    ✓ Receiving live updates
                  </p>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  <p>No location data received</p>
                  <p className="text-xs mt-1">
                    Rover location will appear here when connected and receiving
                    updates
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Waypoints ({waypointPath.waypoints.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {waypointPath.waypoints.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No waypoints found for this path.
            </p>
          ) : (
            <div className="space-y-3">
              {waypointPath.waypoints.map((waypoint, index) => (
                <div
                  key={waypoint.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{waypoint.name}</p>
                      <p className="text-sm text-gray-500">
                        Lat: {waypoint.lat.toFixed(6)}, Long:{" "}
                        {waypoint.long.toFixed(6)}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Order: {waypoint.order_index}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
