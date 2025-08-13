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
import { RoverPoint } from "@/lib/types";

interface ChemicalAnalysisDialogProps {
  farmID: string | undefined;
  onAnalysisComplete?: () => void;
}

interface ChemicalPredictionResponse {
  B_ppm: number;
  Cu_ppm: number;
  Fe_ppm: number;
  K_ppm: number;
  N_ppm: number;
  P_ppm: number;
  S_ppm: number;
  Zn_ppm: number;
}

export default function ChemicalAnalysisDialog({
  farmID,
  onAnalysisComplete,
}: ChemicalAnalysisDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Fetch available dates from rover points
  useEffect(() => {
    if (isOpen && farmID) {
      fetchAvailableDates();
      setMessage(null); // Clear any previous messages
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
    setMessage(null); // Clear any previous messages
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
      const averages = calculateSpecificAverages(roverPoints || []);

      if (!averages) {
        console.error("No valid data found for analysis");
        return;
      }

      console.log("Calculated averages for API call:", {
        temp: averages.temperature,
        moisture: averages.humidity,
        ec: averages.ec,
        pH: averages.ph,
      });

      // Validate that we have all required data
      if (
        averages.temperature === 0 ||
        averages.humidity === 0 ||
        averages.ec === 0 ||
        averages.ph === 0
      ) {
        setMessage({
          type: "error",
          text: "Insufficient sensor data for analysis. Please ensure all sensors have readings.",
        });
        return;
      }

      // Call the external API for chemical prediction
      const chemicalPrediction = await fetchChemicalPrediction(averages);

      if (chemicalPrediction) {
        // Insert chemical estimate into database
        await insertChemicalEstimate(chemicalPrediction, averages);

        // Wait a moment to show success message before closing
        setTimeout(() => {
          setIsOpen(false);
          onAnalysisComplete?.();
        }, 2000);
      } else {
        // Close dialog immediately if no prediction
        setIsOpen(false);
        onAnalysisComplete?.();
      }
    } catch (error) {
      console.error("Error running analysis:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChemicalPrediction = async (
    averages: any
  ): Promise<ChemicalPredictionResponse | null> => {
    try {
      const response = await fetch(
        "https://ayanch0w-chemicalpredictiongroundhog.hf.space/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            temp: averages.temperature,
            moisture: averages.humidity,
            ec: averages.ec,
            pH: averages.ph,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Chemical prediction API response:", data);
      return data;
    } catch (error) {
      console.error("Error fetching chemical prediction:", error);
      setMessage({
        type: "error",
        text: "Failed to get chemical prediction from API",
      });
      return null;
    }
  };

  const insertChemicalEstimate = async (
    prediction: ChemicalPredictionResponse,
    averages: any
  ) => {
    try {
      const { error } = await supabase.from("chemical-estimate").insert({
        farm_id: farmID,
        nitrogen: Math.round(prediction.N_ppm),
        phosphorus: Math.round(prediction.P_ppm),
        potassium: Math.round(prediction.K_ppm),
        ec: Math.round(averages.ec),
        sulphur: Math.round(prediction.S_ppm),
        ph: Math.round(averages.ph),
        zinc: Math.round(prediction.Zn_ppm),
        iron: Math.round(prediction.Fe_ppm),
        boron: Math.round(prediction.B_ppm),
        copper: Math.round(prediction.Cu_ppm),
      });

      if (error) {
        console.error("Error inserting chemical estimate:", error);
        setMessage({
          type: "error",
          text: "Failed to save chemical estimate to database",
        });
      } else {
        console.log("Chemical estimate inserted successfully");
        setMessage({
          type: "success",
          text: "Chemical analysis completed and saved successfully!",
        });
      }
    } catch (error) {
      console.error("Error inserting chemical estimate:", error);
      setMessage({
        type: "error",
        text: "Failed to save chemical estimate to database",
      });
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
      temperature: Number((averages.temperature || 0).toFixed(2)),
      ph: Number((averages.pH || 0).toFixed(2)),
      ec: Number((averages.EC || 0).toFixed(2)),
      humidity: Number((averages.moisture || 0).toFixed(2)),
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
        {message && (
          <div
            className={`p-3 rounded-md ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}
        <DialogFooter>
          <Button onClick={runAnalysis} disabled={!selectedDate || isLoading}>
            {isLoading ? "Running..." : "Run Analysis"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
