"use client";

// React & core libraries
import React, { use, useEffect, useRef } from "react";

// Mapbox
import mapboxgl, { Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Charts (Recharts & custom chart components)
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// UI Components
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Icons
import { ChevronDownIcon } from "lucide-react";

// Types & data utilities
import { ChemicalEstimate } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { heatmapConfigs } from "@/components/heatmapConfig";
import type { FeatureCollection, Feature, Point } from "geojson";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [mapCenter, setMapCenter] = React.useState<[number, number]>([0, 0]);
  const [selectedSensor, setSelectedSensor] =
    React.useState<string>("moisture");
  const [roverPoints, setRoverPoints] = React.useState<any[]>([]);
  const [chemicalData, setChemicalData] =
    React.useState<null | ChemicalEstimate>();
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();
  const [mapStyle, setMapStyle] = React.useState<string>("standard-satellite");

  // Fetch recent soil chemical analysis
  useEffect(() => {
    async function getChemicalData(): Promise<void> {
      let { data: chemicalData, error } = await supabase
        .from("chemicalEstimate")
        .select("*")
        .eq("farm_id", "usg");

      setChemicalData(chemicalData ? chemicalData[1] : null);
    }

    getChemicalData();
  }, []);

  // Fetch farm data to set initial map center
  useEffect(() => {
    async function getFarmData(): Promise<void> {
      let { data: farmData, error } = await supabase
        .from("farmData")
        .select("*")
        .eq("farm_id", "usg");

      if (farmData) {
        setMapCenter([farmData[0].long, farmData[0].lat]);
      }
    }
    getFarmData();
  }, []);

  // Fetch rover points when sensor changes
  useEffect(() => {
    async function fetchRoverPoints() {
      let { data: roverpoints, error } = await supabase
        .from("rover-points")
        .select("*")
        .eq("farm_id", "usg");
      if (roverpoints) setRoverPoints(roverpoints);
    }
    fetchRoverPoints();
  }, [selectedSensor]);

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
      new mapboxgl.Marker().setLngLat(mapCenter).addTo(mapRef.current!);
      const nav = new mapboxgl.NavigationControl({ visualizePitch: true });
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
        mapRef.current!.addLayer(
          {
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
          },
          "waterway-label"
        );
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

  return (
    <div className="flex flex-col">
      <div className="flex flex-row w-screen h-10 px-6 bg-accent items-center justify-between">
        <p className=" text-2xl font-medium">Ground Hog</p>
      </div>

      <div className="flex flex-row w-screen h-[calc(100vh-40px)]">
        <div className="w-2/5 flex flex-col p-4 bg-white gap-4 overflow-y-auto">
          <div className="flex flex-col p-4">
            <p className="text-2xl font-bold mb-2">USG Farms</p>
            <p>
              Soil pH is balanced at 6.7 with minor acidic spots. EC (1.2 dS/m),
              moisture (30%), and temperature (22°C) are within optimal ranges.
              Nitrogen and potassium are sufficient, but phosphorus is slightly
              low, requiring targeted supplementation.
            </p>
            <Button
              onClick={() => {
                console.log(chemicalData);
                console.log(roverPoints);
              }}
            >
              test
            </Button>
          </div>
          <div className="flex gap-4">
            {/* Percentage - Secondary Macronutrients */}
            {chemicalData ? (
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
                    <div className="text-sm text-gray-600">Percentage (%)</div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="flex-1">
                <Skeleton className="w-full h-40" />
              </Card>
            )}

            {/* dS/m - Electrical Conductivity */}
            {chemicalData ? (
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
                    <div className="text-sm text-gray-600">dS/m</div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="flex-1">
                <Skeleton className="w-full h-40" />
              </Card>
            )}

            {/* pH - Soil Acidity/Alkalinity */}
            {chemicalData ? (
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
            ) : (
              <Card className="flex-1">
                <Skeleton className="w-full h-40" />
              </Card>
            )}
          </div>
          {chemicalData ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Macronutrients
                </CardTitle>
                <CardDescription>Kilograms per Hectare (Kg/Ha)</CardDescription>
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
                      { name: "Potassium (K)", value: chemicalData.potassium },
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
                    <Bar dataKey="value" fill="var(--color-value)" radius={8} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          ) : (
            <Card className="w-full h-full">
              <Skeleton className="w-80 h-80" />
            </Card>
          )}

          {/* PPM - Micronutrients */}
          {chemicalData ? (
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
                    <Bar dataKey="value" fill="var(--color-value)" radius={8} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          ) : (
            <Card className="w-full h-full">
              <Skeleton className="w-80 h-80" />
            </Card>
          )}

          {/* Single Value Charts - Horizontal Layout */}
        </div>

        <div className="w-3/5 flex flex-col items-center justify-center">
          <div className="relative w-full h-full p-4">
            <div
              ref={mapContainerRef}
              className="w-full h-full rounded-2xl overflow-hidden"
            />

            <div className="absolute top-6 left-6 z-10 flex gap-2 items-start p-2 rounded-2xl backdrop-blur-lg outline-1">
              {/* Sensor Dropdown */}
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[180px] justify-between"
                  >
                    {selectedDate
                      ? selectedDate.toLocaleDateString()
                      : "Select Date"}
                    <ChevronDownIcon className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    captionLayout="dropdown"
                    onSelect={(date) => setSelectedDate(date)}
                  />
                </PopoverContent>
              </Popover>
              <Select value={mapStyle} onValueChange={setMapStyle}>
                <SelectTrigger className="w-[200px] bg-white">
                  <SelectValue placeholder="Map Style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard-satellite">Satellite</SelectItem>
                  <SelectItem value="outdoors-v12">Street</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
