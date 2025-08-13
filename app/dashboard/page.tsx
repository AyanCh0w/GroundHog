"use client";

// React & core libraries
import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";

// Mapbox
import mapboxgl, { Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

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
  House,
  Navigation,
  Sprout,
  Globe,
} from "lucide-react";

// Types & data utilities
import { ChemicalEstimate } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { heatmapConfigs } from "@/components/heatmapConfig";
import type { FeatureCollection, Feature, Point } from "geojson";
import ChemicalAnalysisDialog from "@/components/ChemicalAnalysisDialog";
import AIAnalysisBox from "@/components/AIAnalysisBox";

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

  const roverMarkerRef = useRef<mapboxgl.Marker | null>(null);

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

        // Add hover functionality for rover points
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          maxWidth: "300px",
          className: "rover-popup",
        });

        // Change cursor on hover
        mapRef.current!.on("mouseenter", "rover-heatmap", () => {
          mapRef.current!.getCanvas().style.cursor = "pointer";
        });

        mapRef.current!.on("mouseleave", "rover-heatmap", () => {
          mapRef.current!.getCanvas().style.cursor = "";
          popup.remove();
        });

        // Show popup on hover
        mapRef.current!.on("mousemove", "rover-heatmap", (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const coordinates = (feature.geometry as Point).coordinates.slice();
            const properties = feature.properties;

            if (properties) {
              // Create popup content with all data values
              const popupContent = `
                <div class="p-4 bg-white rounded-lg shadow-lg border border-gray-200">
                  <div class="flex items-center justify-between mb-3 pb-2 border-b">
                    <h3 class="font-semibold text-sm text-gray-800">Rover Data Point</h3>
                    <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">${
                      selectedSensor.charAt(0).toUpperCase() +
                      selectedSensor.slice(1)
                    }</span>
                  </div>
                  <div class="space-y-3 text-xs text-gray-700">
                    <div class="grid grid-cols-2 gap-4">
                      <div class="space-y-2">
                        <div class="flex justify-between items-center">
                          <span class="font-medium text-gray-600">Moisture:</span>
                          <span class="text-blue-600 font-semibold">${
                            properties.moisture !== null &&
                            properties.moisture !== undefined
                              ? properties.moisture + "%"
                              : "N/A"
                          }</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="font-medium text-gray-600">Temperature:</span>
                          <span class="text-red-600 font-semibold">${
                            properties.temperature !== null &&
                            properties.temperature !== undefined
                              ? properties.temperature + "°C"
                              : "N/A"
                          }</span>
                        </div>
                      </div>
                      <div class="space-y-2">
                        <div class="flex justify-between items-center">
                          <span class="font-medium text-gray-600">pH:</span>
                          <span class="text-green-600 font-semibold">${
                            properties.pH !== null &&
                            properties.pH !== undefined
                              ? properties.pH
                              : "N/A"
                          }</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="font-medium text-gray-600">EC:</span>
                          <span class="text-purple-600 font-semibold">${
                            properties.EC !== null &&
                            properties.EC !== undefined
                              ? properties.EC + " dS/m"
                              : "N/A"
                          }</span>
                        </div>
                      </div>
                    </div>
                    <div class="border-t pt-2 space-y-2">
                      <div class="flex justify-between items-center">
                        <span class="font-medium text-gray-600">Farm ID:</span>
                        <span class="text-gray-800 font-mono text-xs">${
                          properties.farm_id || "N/A"
                        }</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="font-medium text-gray-600">Timestamp:</span>
                        <span class="text-gray-600 text-xs">${new Date(
                          properties.created_at
                        ).toLocaleString()}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="font-medium text-gray-600">Coordinates:</span>
                        <span class="text-gray-600 font-mono text-xs">${coordinates[1].toFixed(
                          6
                        )}, ${coordinates[0].toFixed(6)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              `;

              popup
                .setLngLat(coordinates as [number, number])
                .setHTML(popupContent)
                .addTo(mapRef.current!);
            }
          }
        });

        // Also show popup on click for better mobile support
        mapRef.current!.on("click", "rover-heatmap", (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const coordinates = (feature.geometry as Point).coordinates.slice();
            const properties = feature.properties;

            if (properties) {
              const popupContent = `
                <div class="p-4 bg-white rounded-lg shadow-lg border border-gray-200">
                  <div class="flex items-center justify-between mb-3 pb-2 border-b">
                    <h3 class="font-semibold text-sm text-gray-800">Rover Data Point</h3>
                    <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">${
                      selectedSensor.charAt(0).toUpperCase() +
                      selectedSensor.slice(1)
                    }</span>
                  </div>
                  <div class="space-y-3 text-xs text-gray-700">
                    <div class="grid grid-cols-2 gap-4">
                      <div class="space-y-2">
                        <div class="flex justify-between items-center">
                          <span class="font-medium text-gray-600">Moisture:</span>
                          <span class="text-blue-600 font-semibold">${
                            properties.moisture !== null &&
                            properties.moisture !== undefined
                              ? properties.moisture + "%"
                              : "N/A"
                          }</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="font-medium text-gray-600">Temperature:</span>
                          <span class="text-red-600 font-semibold">${
                            properties.temperature !== null &&
                            properties.temperature !== undefined
                              ? properties.temperature + "°C"
                              : "N/A"
                          }</span>
                        </div>
                      </div>
                      <div class="space-y-2">
                        <div class="flex justify-between items-center">
                          <span class="font-medium text-gray-600">pH:</span>
                          <span class="text-green-600 font-semibold">${
                            properties.pH !== null &&
                            properties.pH !== undefined
                              ? properties.pH
                              : "N/A"
                          }</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="font-medium text-gray-600">EC:</span>
                          <span class="text-purple-600 font-semibold">${
                            properties.EC !== null &&
                            properties.EC !== undefined
                              ? properties.EC + " dS/m"
                              : "N/A"
                          }</span>
                        </div>
                      </div>
                    </div>
                    <div class="border-t pt-2 space-y-2">
                      <div class="flex justify-between items-center">
                        <span class="font-medium text-gray-600">Farm ID:</span>
                        <span class="text-gray-800 font-mono text-xs">${
                          properties.farm_id || "N/A"
                        }</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="font-medium text-gray-600">Timestamp:</span>
                        <span class="text-gray-600 text-xs">${new Date(
                          properties.created_at
                        ).toLocaleString()}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="font-medium text-gray-600">Coordinates:</span>
                        <span class="text-gray-600 font-mono text-xs">${coordinates[1].toFixed(
                          6
                        )}, ${coordinates[0].toFixed(6)}</span>
                      </div>
                    </div>
                  </div>
                `;

              popup
                .setLngLat(coordinates as [number, number])
                .setHTML(popupContent)
                .addTo(mapRef.current!);
            }
          }
        });

        // Add click event for general map clicks (to close popup when clicking elsewhere)
        mapRef.current!.on("click", (e) => {
          // Only close popup if not clicking on a rover point
          if (!e.features || e.features.length === 0) {
            popup.remove();
          }
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

  return (
    <div className="flex flex-col">
      <div className="flex flex-row w-screen h-screen">
        <div
          className={`${largeMap} flex flex-col p-6 bg-white gap-6 overflow-y-scroll`}
        >
          {/* Header Section */}
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-1">{farmerName}</p>
                <h1 className="text-3xl font-bold text-gray-900">{farmName}</h1>
              </div>
              <Link href="/demo">
                <Button
                  variant="outline"
                  className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                >
                  🚀 Demo Rover
                </Button>
              </Link>
            </div>
            <AIAnalysisBox farmID={farmID} />
          </div>

          {/* Soil Analysis Section */}
          {chemicalData ? (
            <div className="space-y-6">
              {/* Analysis Info Header */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <span>Latest Chemical Analysis:</span>
                      <span className="font-mono text-gray-900">
                        {new Date(chemicalData?.created_at || "")
                          .toDateString()
                          .slice(4)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <span>Latest Rover Input:</span>
                      <span className="font-mono text-gray-900">
                        {roverPoints.length > 0
                          ? new Date(roverPoints[0]?.created_at || "")
                              .toDateString()
                              .slice(4)
                          : "No data available"}
                      </span>
                    </div>
                  </div>
                  <ChemicalAnalysisDialog
                    farmID={farmID}
                    onAnalysisComplete={() => {
                      console.log("Analysis completed");
                    }}
                  />
                </div>
              </div>

              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Sulphur */}
                <Card className="flex-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Sulphur (S)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {chemicalData.sulphur}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">
                        Percentage (%)
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Electrical Conductivity */}
                <Card className="flex-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Electrical Conductivity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600 mb-1">
                        {chemicalData.ec}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">
                        dS/m
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* pH */}
                <Card className="flex-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700">
                      Soil pH
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600 mb-1">
                        {chemicalData.ph}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">
                        pH Level
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="space-y-6">
                {/* Macronutrients Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Macronutrients
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Kilograms per Hectare (Kg/Ha)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full overflow-x-auto">
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
                            {
                              name: "Nitrogen (N)",
                              value: chemicalData.nitrogen,
                            },
                            {
                              name: "Phosphorus (P)",
                              value: chemicalData.phosphorus,
                            },
                            {
                              name: "Potassium (K)",
                              value: chemicalData.potassium,
                            },
                          ]}
                          width={Math.max(400, window.innerWidth * 0.3)}
                          height={200}
                        >
                          <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                          />
                          <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            fontSize={12}
                          />
                          <YAxis
                            dataKey="value"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            fontSize={12}
                          />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                          />
                          <Bar
                            dataKey="value"
                            fill="var(--color-value)"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Micronutrients Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Micronutrients
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Parts Per Million (PPM)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full overflow-x-auto">
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
                          width={Math.max(400, window.innerWidth * 0.3)}
                          height={200}
                        >
                          <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                          />
                          <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            fontSize={12}
                          />
                          <YAxis
                            dataKey="value"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            fontSize={12}
                          />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                          />
                          <Bar
                            dataKey="value"
                            fill="var(--color-value)"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-6">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  No data available
                </h2>
                <p className="text-gray-600 max-w-md">
                  After you use the rover, the data will eventually show up
                  here.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <ChemicalAnalysisDialog
                  farmID={farmID}
                  onAnalysisComplete={() => {
                    console.log("Analysis completed");
                  }}
                />
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
              </div>
              <p className="text-sm text-gray-500 font-mono">
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
              {/* Toggle Map Size Button */}
              <Button
                variant={"outline"}
                onClick={() => {
                  setLargeMap(largeMap === "w-2/5" ? "w-4/5" : "w-2/5");
                }}
                title={largeMap === "w-2/5" ? "Expand Map" : "Collapse Map"}
              >
                {largeMap === "w-2/5" ? (
                  <ArrowRightToLineIcon />
                ) : (
                  <ArrowLeftToLineIcon />
                )}
              </Button>

              {/* Sensor Dropdown */}
              <Select value={selectedSensor} onValueChange={setSelectedSensor}>
                <SelectTrigger
                  className={`${
                    largeMap === "w-4/5" ? "w-12" : "w-[200px]"
                  } bg-white transition-all duration-200`}
                >
                  {largeMap === "w-4/5" ? (
                    <div className="flex items-center justify-center">
                      <Sprout className="h-4 w-4" />
                    </div>
                  ) : (
                    <SelectValue placeholder="Sensor Map Display" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moisture">Moisture</SelectItem>
                  <SelectItem value="temperature">Temperature</SelectItem>
                  <SelectItem value="pH">pH</SelectItem>
                  <SelectItem value="EC">Electrical Conductivity</SelectItem>
                </SelectContent>
              </Select>

              {/* Map Style Dropdown */}
              <Select value={mapStyle} onValueChange={setMapStyle}>
                <SelectTrigger
                  className={`${
                    largeMap === "w-4/5" ? "w-12" : "w-[200px]"
                  } bg-white transition-all duration-200`}
                >
                  {largeMap === "w-4/5" ? (
                    <div className="flex items-center justify-center">
                      <Globe className="h-4 w-4" />
                    </div>
                  ) : (
                    <SelectValue placeholder="Map Style" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard-satellite">Satellite</SelectItem>
                  <SelectItem value="outdoors-v12">Street</SelectItem>
                </SelectContent>
              </Select>

              {/* Navigation Button */}
              <Button
                variant={"outline"}
                onClick={() => router.push("/waypoints")}
                title="Waypoints"
                className={largeMap === "w-4/5" ? "px-2" : ""}
              >
                <Navigation className="h-4 w-4" />
                {largeMap === "w-4/5" ? null : (
                  <span className="ml-2">Waypoints</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
