"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import mapboxgl, { Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Play,
  MapPin,
  MousePointer,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Waypoint, WaypointPath } from "@/lib/types";

export default function WaypointsPage() {
  const router = useRouter();
  const [farmID, setFarmID] = useState<string>("");
  const [paths, setPaths] = useState<WaypointPath[]>([]);
  const [currentPath, setCurrentPath] = useState<Partial<WaypointPath>>({
    name: "",
    description: "",
    waypoints: [],
    is_active: false,
  });
  const [editingPathId, setEditingPathId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
  const [mapReady, setMapReady] = useState(false);

  // Map references
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const waypointMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const pathLineRef = useRef<mapboxgl.GeoJSONSource | null>(null);

  useEffect(() => {
    const farmIdFromCookie = Cookies.get("farm_id");
    console.log("Cookie farm_id value:", farmIdFromCookie);
    console.log("All cookies:", document.cookie);
    setFarmID(farmIdFromCookie || "");
    console.log("Farm ID state set to:", farmIdFromCookie);

    if (farmIdFromCookie) {
      console.log("Farm ID found, fetching paths...");
      fetchPaths();
    } else {
      console.log("No farm ID found in cookie");
    }
  }, []); // Only run once on mount

  // Fetch paths when farmID changes
  useEffect(() => {
    if (farmID) {
      console.log("Farm ID changed, fetching paths...");
      fetchPaths();

      // Test database connection
      testDatabaseConnection();
    }
  }, [farmID]);

  const testDatabaseConnection = async () => {
    try {
      console.log("Testing database connection...");

      const { data, error } = await supabase
        .from("waypoint_paths")
        .select("count")
        .eq("farm_id", farmID);

      if (error) {
        console.error("Database connection test failed:", error);
      } else {
        console.log("Database connection test successful, count:", data);
      }
    } catch (err) {
      console.error("Database connection test error:", err);
    }
  };

  const fetchPaths = async () => {
    if (!farmID) return;
    console.log("Fetching paths for farmID:", farmID);

    try {
      // First, get all paths for this farm
      const { data: pathsData, error: pathsError } = await supabase
        .from("waypoint_paths")
        .select("*")
        .eq("farm_id", farmID)
        .order("created_at", { ascending: false });

      if (pathsError) {
        console.error("Error fetching paths:", pathsError);
        return;
      }

      console.log("Raw paths data:", pathsData);

      if (pathsData && pathsData.length > 0) {
        // For each path, fetch its waypoints
        const pathsWithWaypoints = await Promise.all(
          pathsData.map(async (path) => {
            const { data: waypointsData, error: waypointsError } =
              await supabase
                .from("waypoints")
                .select("*")
                .eq("path_id", path.id)
                .order("order_index", { ascending: true });

            if (waypointsError) {
              console.error(
                `Error fetching waypoints for path ${path.id}:`,
                waypointsError
              );
              return { ...path, waypoints: [] };
            }

            return { ...path, waypoints: waypointsData || [] };
          })
        );

        console.log("Paths with waypoints:", pathsWithWaypoints);
        setPaths(pathsWithWaypoints);
      } else {
        console.log("No paths found for farm ID:", farmID);
        setPaths([]);
      }
    } catch (error) {
      console.error("Error in fetchPaths:", error);
    }
  };

  // Fetch farm data when farmID changes - exactly like dashboard
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
        console.log("Farm center set to:", [farmData[0].long, farmData[0].lat]);
      }
    }
    getFarmData();
  }, [farmID]);

  // Initialize map
  useEffect(() => {
    console.log("Initializing map with center:", mapCenter);
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_KEY;
    if (mapContainerRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: mapCenter,
        zoom: 18,
      });

      // Add navigation controls
      const nav = new mapboxgl.NavigationControl({
        visualizePitch: true,
        showZoom: true,
      });
      mapRef.current.addControl(nav, "bottom-right");

      // Add farm center marker only if we have valid coordinates
      if (mapCenter[0] !== 0 || mapCenter[1] !== 0) {
        console.log("Adding farm marker at initialization:", mapCenter);
        const farmMarker = document.createElement("div");
        farmMarker.innerHTML = "🏠";
        farmMarker.className = "text-2xl";

        new mapboxgl.Marker({
          element: farmMarker,
        })
          .setLngLat(mapCenter)
          .addTo(mapRef.current);
      } else {
        console.log("No valid coordinates for farm marker at initialization");
      }

      // Add click event to create waypoints
      mapRef.current.on("click", (e) => {
        if (
          editingPathId ||
          (!editingPathId &&
            currentPath.waypoints &&
            currentPath.waypoints.length > 0)
        ) {
          addWaypointFromMap(e.lngLat.lng, e.lngLat.lat);
        }
      });

      // Wait for style to load before initializing waypoints and path layer
      mapRef.current.once("style.load", () => {
        console.log("Map style loaded, initializing waypoints...");
        setMapReady(true);

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
        if (mapRef.current && !mapRef.current.getLayer("path-line-layer")) {
          mapRef.current.addLayer({
            id: "path-line-layer",
            type: "line",
            source: "path-line",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#3B82F6",
              "line-width": 3,
              "line-opacity": 0.8,
            },
          });
        }
        pathLineRef.current = mapRef.current
          ? (mapRef.current.getSource(
              "path-line"
            ) as mapboxgl.GeoJSONSource | null)
          : null;
        updateMapWaypoints();
      });
    }
    return () => {
      mapRef.current?.remove();
    };
  }, [mapCenter]);

  // Update waypoints on map when currentPath changes
  useEffect(() => {
    if (!mapRef.current || !currentPath.waypoints) return;

    updateMapWaypoints();
  }, [currentPath.waypoints]);

  // Handle editing path changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Update waypoints when editing path changes
    if (currentPath.waypoints) {
      updateMapWaypoints();
    }
  }, [editingPathId]);

  const updateMapWaypoints = () => {
    if (!mapRef.current || !currentPath.waypoints) return;

    // Clear existing waypoint markers
    waypointMarkersRef.current.forEach((marker) => marker.remove());
    waypointMarkersRef.current = [];

    if (currentPath.waypoints.length > 0) {
      currentPath.waypoints.forEach((waypoint) => {
        const marker = new mapboxgl.Marker({ color: "#3B82F6", scale: 1.0 })
          .setLngLat([waypoint.long, waypoint.lat])
          .addTo(mapRef.current!);
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="p-2">
            <h3 class="font-semibold">${waypoint.name}</h3>
            <p class="text-sm text-gray-600">${waypoint.lat.toFixed(
              6
            )}, ${waypoint.long.toFixed(6)}</p>
          </div>
        `);
        marker.setPopup(popup);
        waypointMarkersRef.current.push(marker);
      });
    }

    // Update or clear path line
    const coords = [...(currentPath.waypoints || [])]
      .sort((a, b) => a.order_index - b.order_index)
      .map((wp) => [wp.long, wp.lat]);

    const source =
      (mapRef.current.getSource("path-line") as mapboxgl.GeoJSONSource) || null;
    if (!source) {
      // If style is loaded but source missing, create it once
      if (mapRef.current.isStyleLoaded()) {
        try {
          mapRef.current.addSource("path-line", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: [] },
            },
          });
          if (!mapRef.current.getLayer("path-line-layer")) {
            mapRef.current.addLayer({
              id: "path-line-layer",
              type: "line",
              source: "path-line",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: {
                "line-color": "#3B82F6",
                "line-width": 3,
                "line-opacity": 0.8,
              },
            });
          }
          pathLineRef.current = mapRef.current.getSource(
            "path-line"
          ) as mapboxgl.GeoJSONSource;
        } catch (e) {
          console.warn("Could not create path-line source/layer yet:", e);
          return;
        }
      } else {
        return;
      }
    }

    const pathSource =
      (mapRef.current.getSource("path-line") as mapboxgl.GeoJSONSource) || null;
    if (pathSource) {
      const lineData =
        coords.length > 1
          ? {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: coords },
            }
          : {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: [] as number[][] },
            };
      pathSource.setData(lineData as any);
    }
  };

  const addWaypointFromMap = (long: number, lat: number) => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) {
      console.log("Map not ready, cannot add waypoint");
      return;
    }

    const newWaypoint: Partial<Waypoint> = {
      name: `Waypoint ${(currentPath.waypoints?.length || 0) + 1}`,
      lat: lat,
      long: long,
      order_index: currentPath.waypoints?.length || 0,
    };

    setCurrentPath((prev) => ({
      ...prev,
      waypoints: [...(prev.waypoints || []), newWaypoint as Waypoint],
    }));
  };

  const addWaypoint = () => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) {
      console.log("Map not ready, cannot add waypoint");
      return;
    }

    // Get the center of the current map view
    const mapCenter = mapRef.current.getCenter();

    const newWaypoint: Partial<Waypoint> = {
      name: `Waypoint ${(currentPath.waypoints?.length || 0) + 1}`,
      lat: mapCenter.lat,
      long: mapCenter.lng,
      order_index: currentPath.waypoints?.length || 0,
    };

    setCurrentPath((prev) => ({
      ...prev,
      waypoints: [...(prev.waypoints || []), newWaypoint as Waypoint],
    }));
  };

  const updateWaypoint = (index: number, field: keyof Waypoint, value: any) => {
    setCurrentPath((prev) => ({
      ...prev,
      waypoints: prev.waypoints?.map((wp, i) =>
        i === index ? { ...wp, [field]: value } : wp
      ),
    }));
  };

  const removeWaypoint = (index: number) => {
    setCurrentPath((prev) => ({
      ...prev,
      waypoints: prev.waypoints?.filter((_, i) => i !== index),
    }));
  };

  const reorderWaypoints = (fromIndex: number, toIndex: number) => {
    if (!currentPath.waypoints) return;

    const newWaypoints = [...currentPath.waypoints];
    const [movedWaypoint] = newWaypoints.splice(fromIndex, 1);
    newWaypoints.splice(toIndex, 0, movedWaypoint);

    // Update order numbers (for display purposes only)
    const updatedWaypoints = newWaypoints.map((wp, index) => ({
      ...wp,
      order_index: index,
    }));

    setCurrentPath((prev) => ({
      ...prev,
      waypoints: updatedWaypoints,
    }));
  };

  const savePath = async () => {
    if (!farmID || !currentPath.name || !currentPath.waypoints?.length) {
      alert("Please provide a path name and at least one waypoint");
      return;
    }

    console.log("=== SAVING PATH ===");
    console.log("Farm ID:", farmID);
    console.log("Path name:", currentPath.name);
    console.log("Waypoints count:", currentPath.waypoints?.length);
    console.log("Waypoints data:", currentPath.waypoints);

    try {
      if (editingPathId) {
        // Update existing path
        console.log("Updating path:", editingPathId);
        const { error: pathUpdateError } = await supabase
          .from("waypoint_paths")
          .update({
            name: currentPath.name,
            description: currentPath.description,
            is_active: currentPath.is_active,
          })
          .eq("id", editingPathId);

        if (pathUpdateError) {
          console.error("Error updating path:", pathUpdateError);
          throw new Error(`Failed to update path: ${pathUpdateError.message}`);
        }

        // Update waypoints
        console.log("Updating waypoints for path:", editingPathId);
        for (const waypoint of currentPath.waypoints) {
          // Validate waypoint data
          if (
            !waypoint.name ||
            typeof waypoint.lat !== "number" ||
            typeof waypoint.long !== "number"
          ) {
            console.error("Invalid waypoint data:", waypoint);
            throw new Error(
              `Invalid waypoint data: ${JSON.stringify(waypoint)}`
            );
          }

          if (waypoint.id) {
            console.log("Updating existing waypoint:", waypoint.id);
            const { error: updateError } = await supabase
              .from("waypoints")
              .update({
                name: waypoint.name,
                lat: waypoint.lat,
                long: waypoint.long,
                order_index: currentPath.waypoints?.indexOf(waypoint) || 0,
              })
              .eq("id", waypoint.id);

            if (updateError) {
              console.error("Error updating waypoint:", updateError);
              throw new Error(
                `Failed to update waypoint: ${updateError.message}`
              );
            }
          } else {
            console.log("Creating new waypoint for existing path");
            const waypointData = {
              path_id: editingPathId,
              farm_id: farmID,
              name: waypoint.name,
              lat: waypoint.lat,
              long: waypoint.long,
              order_index: currentPath.waypoints?.indexOf(waypoint) || 0,
            };

            const { data: waypointResult, error: waypointError } =
              await supabase
                .from("waypoints")
                .insert(waypointData)
                .select()
                .single();

            if (waypointError) {
              console.error("Error inserting waypoint:", waypointError);
              throw new Error(
                `Failed to insert waypoint: ${waypointError.message}`
              );
            }

            console.log("New waypoint created:", waypointResult);
          }
        }
      } else {
        // Create new path
        console.log("Creating new path with data:", {
          farm_id: farmID,
          name: currentPath.name,
          description: currentPath.description,
          is_active: currentPath.is_active,
        });

        const { data: pathData, error: pathError } = await supabase
          .from("waypoint_paths")
          .insert({
            farm_id: farmID,
            name: currentPath.name,
            description: currentPath.description,
            is_active: currentPath.is_active,
          })
          .select()
          .single();

        if (pathError) {
          console.error("Error creating path:", pathError);
          throw new Error(`Failed to create path: ${pathError.message}`);
        }

        if (!pathData) {
          throw new Error("Path was created but no data returned");
        }

        if (pathData) {
          // Create waypoints
          console.log("Creating waypoints for path:", pathData.id);
          for (const waypoint of currentPath.waypoints) {
            // Validate waypoint data
            if (
              !waypoint.name ||
              typeof waypoint.lat !== "number" ||
              typeof waypoint.long !== "number"
            ) {
              console.error("Invalid waypoint data:", waypoint);
              throw new Error(
                `Invalid waypoint data: ${JSON.stringify(waypoint)}`
              );
            }

            const waypointData = {
              path_id: pathData.id,
              farm_id: farmID,
              name: waypoint.name,
              lat: waypoint.lat,
              long: waypoint.long,
              order_index: currentPath.waypoints?.indexOf(waypoint) || 0,
            };
            console.log("Inserting waypoint:", waypointData);

            const { data: waypointResult, error: waypointError } =
              await supabase
                .from("waypoints")
                .insert(waypointData)
                .select()
                .single();

            if (waypointError) {
              console.error("Error inserting waypoint:", waypointError);
              throw new Error(
                `Failed to insert waypoint: ${waypointError.message}`
              );
            }

            console.log("Waypoint created:", waypointResult);
          }
        }
      }

      // Reset form and refresh paths
      setCurrentPath({
        name: "",
        description: "",
        waypoints: [],
        is_active: false,
      });
      setEditingPathId(null);
      fetchPaths();
    } catch (error) {
      console.error("Error saving path:", error);
      alert("Error saving path");
    }
  };

  const editPath = (path: WaypointPath) => {
    setCurrentPath({
      name: path.name,
      description: path.description,
      waypoints: path.waypoints,
      is_active: path.is_active,
    });
    setEditingPathId(path.id);
  };

  const deletePath = async (pathId: string) => {
    if (confirm("Are you sure you want to delete this path?")) {
      await supabase.from("waypoints").delete().eq("path_id", pathId);
      await supabase.from("waypoint_paths").delete().eq("id", pathId);
      fetchPaths();
    }
  };

  const goToNavigation = (pathId: string) => {
    router.push(`/navigation?path=${pathId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Waypoint Management</h1>
            <p className="text-gray-600">
              Create and manage navigation paths for your rover
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Farm ID: {farmID || "Not set"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPaths}
              disabled={!farmID}
            >
              Refresh Paths
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={testDatabaseConnection}
              disabled={!farmID}
            >
              Test DB
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create/Edit Path Form */}
          <Card>
            <CardHeader>
              <CardTitle>
                {editingPathId ? "Edit Path" : "Create New Path"}
              </CardTitle>
              <CardDescription>
                Define waypoints for autonomous navigation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="path-name">Path Name</Label>
                <Input
                  id="path-name"
                  value={currentPath.name}
                  onChange={(e) =>
                    setCurrentPath((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter path name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="path-description">Description (Optional)</Label>
                <Input
                  id="path-description"
                  value={currentPath.description}
                  onChange={(e) =>
                    setCurrentPath((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter path description"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-active"
                  checked={currentPath.is_active}
                  onChange={(e) =>
                    setCurrentPath((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                />
                <Label htmlFor="is-active">Set as active path</Label>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <Label>Waypoints</Label>
                  <Button onClick={addWaypoint} size="sm" disabled={!mapReady}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Waypoint
                  </Button>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {currentPath.waypoints?.map((waypoint, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 border rounded-lg"
                    >
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <div className="flex-1 space-y-2">
                        <Input
                          value={waypoint.name}
                          onChange={(e) =>
                            updateWaypoint(index, "name", e.target.value)
                          }
                          placeholder="Waypoint name"
                          size={1}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            step="any"
                            value={waypoint.lat}
                            onChange={(e) =>
                              updateWaypoint(
                                index,
                                "lat",
                                parseFloat(e.target.value)
                              )
                            }
                            placeholder="Latitude"
                            size={1}
                          />
                          <Input
                            type="number"
                            step="any"
                            value={waypoint.long}
                            onChange={(e) =>
                              updateWaypoint(
                                index,
                                "long",
                                parseFloat(e.target.value)
                              )
                            }
                            placeholder="Longitude"
                            size={1}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeWaypoint(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="text-xs text-gray-500 text-center">
                          {index + 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={savePath} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {editingPathId ? "Update Path" : "Save Path"}
                </Button>

                {editingPathId && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentPath({
                        name: "",
                        description: "",
                        waypoints: [],
                        is_active: false,
                      });
                      setEditingPathId(null);
                    }}
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Interactive Map */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Interactive Map</CardTitle>
              <CardDescription>
                {!mapReady
                  ? "Map is loading... Please wait before adding waypoints."
                  : "Click on the map to add waypoints. Lines will automatically connect them in order."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div
                  ref={mapContainerRef}
                  className="w-full h-96 rounded-lg overflow-hidden"
                />

                {/* Crosshair in the center (small dot) */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-2 h-2 rounded-full bg-red-500 border border-white shadow" />
                  </div>
                </div>

                <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-lg">
                  <div className="flex items-center gap-2 text-sm">
                    {!mapReady ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span>Loading map...</span>
                      </>
                    ) : (
                      <>
                        <MousePointer className="h-4 w-4 text-blue-500" />
                        <span>Click to add waypoints</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span>Waypoints</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 bg-blue-500"></div>
                      <span>Path Line</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🏠</span>
                      <span>Farm Center</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Existing Paths */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Saved Paths</CardTitle>
            <CardDescription>Manage your navigation paths</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paths.map((path) => (
                <div key={path.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{path.name}</h3>
                      {path.description && (
                        <p className="text-sm text-gray-600">
                          {path.description}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {path.waypoints.length} waypoints
                      </p>
                      {path.is_active && (
                        <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => goToNavigation(path.id)}>
                        <Play className="h-4 w-4 mr-2" />
                        Navigate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editPath(path)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePath(path.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {paths.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No paths created yet</p>
                  <p className="text-sm">
                    Create your first navigation path to get started
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
