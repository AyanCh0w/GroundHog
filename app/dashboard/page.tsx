"use client";

import mapboxgl, { Map } from "mapbox-gl";
import React, { useEffect, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { Bar, BarChart } from "recharts";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/lib/supabaseClient";
import { heatmapConfigs } from "@/components/heatmapConfig";
import type { FeatureCollection, Feature, Point } from "geojson";

export default function Dashboard() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [mapCenter, setMapCenter] = React.useState<[number, number]>([0, 0]);
  const [selectedSensor, setSelectedSensor] =
    React.useState<string>("moisture");
  const [roverPoints, setRoverPoints] = React.useState<any[]>([]);

  useEffect(() => {
    async function getFarmData(): Promise<void> {
      let { data: farmData, error } = await supabase
        .from("farmData")
        .select("*")
        .eq("id", 2);

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
        .select("*");
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

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();

  return (
    <div className="flex flex-col">
      <div className="flex flex-row w-screen h-[8vh] p-2 bg-emerald-200">
        <p>Navbar</p>
      </div>

      <div className="flex flex-row w-screen h-[92vh]">
        <div className="w-2/5 flex flex-col p-4 bg-white">
          <p>Sidebar Content</p>
          <Button
            onClick={async () => {
              let { data: roverpoints, error } = await supabase
                .from("rover-points")
                .select("*");

              console.log(roverpoints);
            }}
          >
            Test
          </Button>
        </div>

        <div className="w-3/5 flex flex-col items-center justify-center">
          <div className="relative w-full h-full p-4">
            <div
              ref={mapContainerRef}
              className="w-full h-full rounded-2xl overflow-hidden"
            />

            <div className="absolute top-6 left-6 z-10 flex gap-2 items-start">
              {/* Sensor Dropdown */}
              <Select value={selectedSensor} onValueChange={setSelectedSensor}>
                <SelectTrigger className="w-[200px] bg-accent">
                  <SelectValue placeholder="Sensor Map Display" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moisture">Moisture</SelectItem>
                  <SelectItem value="temperature">Temperature</SelectItem>
                  <SelectItem value="pH">pH</SelectItem>
                  <SelectItem value="EC">Electrical Conductivity</SelectItem>
                </SelectContent>
              </Select>

              {/* Calendar Picker */}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
