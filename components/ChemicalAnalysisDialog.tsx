"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";

interface ChemicalAnalysisDialogProps {
  farmID: string | undefined;
  onAnalysisComplete?: () => void;
}

interface RoverPoint {
  id: string;
  created_at: string;
  farm_id: string;
  moisture?: number;
  temperature?: number;
  pH?: number;
  EC?: number;
  // Add other fields as needed
}

export default function ChemicalAnalysisDialog({
  farmID,
  onAnalysisComplete,
}: ChemicalAnalysisDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available dates from rover points
  useEffect(() => {
    if (isOpen && farmID) {
      fetchAvailableDates();
    }
  }, [isOpen, farmID]);

  const fetchAvailableDates = async () => {
    try {
      const { data: roverPoints, error } = await supabase
        .from("rover-points")
        .select("created_at")
        .eq("farm_id", farmID)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching rover points:", error);
        return;
      }

      // Extract unique dates and format them as month/day/year
      const dates = [
        ...new Set(
          roverPoints?.map((point) => {
            const date = new Date(point.created_at);
            return `${
              date.getMonth() + 1
            }/${date.getDate()}/${date.getFullYear()}`;
          }) || []
        ),
      ];

      setAvailableDates(dates);
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
      }
    } catch (error) {
      console.error("Error fetching available dates:", error);
    }
  };

  const runAnalysis = async () => {
    if (!selectedDate || !farmID) return;

    setIsLoading(true);
    try {
      // Parse the month/day/year format back to a date for database query
      const [month, day, year] = selectedDate.split("/").map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

      const { data: roverPoints, error } = await supabase
        .from("rover-points")
        .select("*")
        .eq("farm_id", farmID)
        .gte("created_at", startOfDay.toISOString())
        .lte("created_at", endOfDay.toISOString());

      if (error) {
        console.error("Error fetching rover points for analysis:", error);
        return;
      }

      // Calculate averages for specific stats
      const analysis = calculateSpecificAverages(roverPoints || []);

      // Log the analysis results as JSON
      console.log(JSON.stringify(analysis, null, 2));

      // Close dialog and notify parent
      setIsOpen(false);
      onAnalysisComplete?.();
    } catch (error) {
      console.error("Error running analysis:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSpecificAverages = (points: RoverPoint[]) => {
    if (points.length === 0) return null;

    const totals: Record<string, number> = {};
    const counts: Record<string, number> = {};

    // Only calculate averages for the specific fields we want
    const targetFields = ["temperature", "pH", "EC", "moisture"];

    points.forEach((point) => {
      targetFields.forEach((field) => {
        const value = point[field as keyof RoverPoint];
        if (typeof value === "number") {
          if (!totals[field]) {
            totals[field] = 0;
            counts[field] = 0;
          }
          totals[field] += value;
          counts[field]++;
        }
      });
    });

    const averages: Record<string, number> = {};
    targetFields.forEach((field) => {
      if (counts[field] > 0) {
        averages[field] = totals[field] / counts[field];
      }
    });

    return {
      date: selectedDate,
      pointCount: points.length,
      temperature: averages.temperature || 0,
      ph: averages.pH || 0,
      ec: averages.EC || 0,
      humidity: averages.moisture || 0,
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Run New Analysis
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Run Chemical Analysis</DialogTitle>
          <DialogDescription>
            Select a date from available rover data to run a new chemical
            analysis.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="date-select" className="text-right">
              Date
            </label>
            <div className="col-span-3">
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a date" />
                </SelectTrigger>
                <SelectContent>
                  {availableDates.map((date) => (
                    <SelectItem key={date} value={date}>
                      {date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={runAnalysis} disabled={!selectedDate || isLoading}>
            {isLoading ? "Running..." : "Run Analysis"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
