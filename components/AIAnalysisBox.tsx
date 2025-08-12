"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import openai from "@/lib/openaiClient";
import {
  AIAnalysisRecord,
  AIAnalysisInput,
  AIAnalysisOutput,
  RoverPoint,
  ChemicalEstimate,
} from "@/lib/types";

interface AIAnalysisBoxProps {
  farmID: string | undefined;
}

export default function AIAnalysisBox({ farmID }: AIAnalysisBoxProps) {
  const [latestAnalysis, setLatestAnalysis] = useState<AIAnalysisRecord | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [lastAnalysisDate, setLastAnalysisDate] = useState<string>("");

  // Fetch the most recent AI analysis on component mount
  useEffect(() => {
    if (farmID) {
      fetchLatestAnalysis();
    }
  }, [farmID]);

  const fetchLatestAnalysis = async () => {
    if (!farmID) return;

    try {
      const { data, error } = await supabase
        .from("ai-analysis")
        .select("*")
        .eq("farm_id", farmID)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching AI analysis:", error);
        return;
      }

      if (data && data.length > 0) {
        setLatestAnalysis(data[0]);
        setLastAnalysisDate(new Date(data[0].created_at).toLocaleDateString());
      }
    } catch (error) {
      console.error("Error fetching AI analysis:", error);
    }
  };

  const runNewAnalysis = async () => {
    if (!farmID) {
      console.log("❌ No farm ID provided, cannot run analysis");
      return;
    }

    console.log("🚀 Starting new AI analysis for farm:", farmID);
    setIsLoading(true);

    try {
      // 1. Fetch most recent rover points for sensor data
      console.log("📡 Fetching rover points...");
      const { data: roverPoints, error: roverError } = await supabase
        .from("rover-points")
        .select("*")
        .eq("farm_id", farmID)
        .order("created_at", { ascending: false })
        .limit(10);

      if (roverError) {
        console.error("❌ Error fetching rover points:", roverError);
        return;
      }

      console.log(
        "✅ Rover points fetched:",
        roverPoints?.length || 0,
        "points"
      );
      if (roverPoints && roverPoints.length > 0) {
        console.log("📍 Latest rover point:", {
          lat: roverPoints[0].lat,
          long: roverPoints[0].long,
          created_at: roverPoints[0].created_at,
        });
      }

      // 2. Fetch most recent chemical estimate
      console.log("🧪 Fetching chemical data...");
      const { data: chemicalData, error: chemicalError } = await supabase
        .from("chemical-estimate")
        .select("*")
        .eq("farm_id", farmID)
        .order("created_at", { ascending: false })
        .limit(1);

      if (chemicalError) {
        console.error("❌ Error fetching chemical data:", chemicalError);
        return;
      }

      console.log(
        "✅ Chemical data fetched:",
        chemicalData ? "Available" : "None"
      );

      if (
        !roverPoints ||
        roverPoints.length === 0 ||
        !chemicalData ||
        chemicalData.length === 0
      ) {
        console.error("❌ No data available for analysis");
        console.log("📊 Data summary:", {
          roverPoints: roverPoints?.length || 0,
          chemicalData: chemicalData?.length || 0,
        });
        return;
      }

      // 3. Calculate averages from rover points
      console.log("🧮 Calculating sensor averages...");
      const sensorData = calculateSensorAverages(roverPoints);
      console.log("📊 Sensor averages calculated:", sensorData);

      // 4. Prepare input for OpenAI
      console.log("🤖 Preparing OpenAI input...");
      const analysisInput: AIAnalysisInput = {
        farm_id: farmID,
        sensor_data: sensorData,
        predicted_nutrients: {
          N_ppm: chemicalData[0].nitrogen,
          P_ppm: chemicalData[0].phosphorus,
          K_ppm: chemicalData[0].potassium,
          Cu_ppm: chemicalData[0].copper,
          Fe_ppm: chemicalData[0].iron,
          Zn_ppm: chemicalData[0].zinc,
          B_ppm: chemicalData[0].boron,
        },
      };
      console.log("📝 Analysis input prepared:", analysisInput);

      // 5. Call OpenAI API
      console.log("🤖 Calling OpenAI API...");
      const analysisOutput = await callOpenAI(analysisInput);
      console.log("✅ OpenAI response received:", analysisOutput);

      // 6. Save to database
      console.log("💾 Saving analysis to database...");
      const { data: savedAnalysis, error: saveError } = await supabase
        .from("ai-analysis")
        .insert({
          farm_id: farmID,
          input_data: analysisInput,
          output_data: analysisOutput,
          last_updated: new Date().toISOString(),
        })
        .select()
        .single();

      if (saveError) {
        console.error("❌ Error saving AI analysis:", saveError);
        return;
      }

      console.log("✅ Analysis saved to database:", savedAnalysis);

      // 7. Update local state
      setLatestAnalysis(savedAnalysis);
      setLastAnalysisDate(
        new Date(savedAnalysis.created_at).toLocaleDateString()
      );
      console.log("🎉 Analysis complete! UI updated with new data");
    } catch (error) {
      console.error("❌ Error running AI analysis:", error);
    } finally {
      setIsLoading(false);
      console.log("🏁 Analysis process finished");
    }
  };

  const calculateSensorAverages = (points: RoverPoint[]) => {
    const totals = { pH: 0, EC: 0, temperature: 0, moisture: 0 };
    const counts = { pH: 0, EC: 0, temperature: 0, moisture: 0 };

    points.forEach((point) => {
      if (point.pH !== undefined) {
        totals.pH += point.pH;
        counts.pH++;
      }
      if (point.EC !== undefined) {
        totals.EC += point.EC;
        counts.EC++;
      }
      if (point.temperature !== undefined) {
        totals.temperature += point.temperature;
        counts.temperature++;
      }
      if (point.moisture !== undefined) {
        totals.moisture += point.moisture;
        counts.moisture++;
      }
    });

    return {
      pH: counts.pH > 0 ? totals.pH / counts.pH : 0,
      EC: counts.EC > 0 ? totals.EC / counts.EC : 0,
      temperature_c:
        counts.temperature > 0 ? totals.temperature / counts.temperature : 0,
      moisture_pct: counts.moisture > 0 ? totals.moisture / counts.moisture : 0,
    };
  };

  const callOpenAI = async (
    input: AIAnalysisInput
  ): Promise<AIAnalysisOutput> => {
    const prompt = `Analyze the following soil data and provide insights:

Farm ID: ${input.farm_id}

Sensor Data:
- pH: ${input.sensor_data.pH}
- EC (Electrical Conductivity): ${input.sensor_data.EC} dS/m
- Temperature: ${input.sensor_data.temperature_c}°C
- Moisture: ${input.sensor_data.moisture_pct}%

Predicted Nutrients (ppm):
- Nitrogen (N): ${input.predicted_nutrients.N_ppm}
- Phosphorus (P): ${input.predicted_nutrients.P_ppm}
- Potassium (K): ${input.predicted_nutrients.K_ppm}
- Copper (Cu): ${input.predicted_nutrients.Cu_ppm}
- Iron (Fe): ${input.predicted_nutrients.Fe_ppm}
- Zinc (Zn): ${input.predicted_nutrients.Zn_ppm}
- Boron (B): ${input.predicted_nutrients.B_ppm}

Please provide:
1. A concise summary of the soil condition
2. 2-3 actionable recommendations (todos)
3. Overall status assessment

Respond in JSON format with keys: summary, todos (array), status.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `
                You are an agronomy assistant.
                Given JSON with pH, EC, temperature_c, moisture_pct, N, P, K, Cu, Fe, Zn, B, output a 2-sentence soil/nutrient summary, exactly 3 actionable to-do’s, and a 2–5 word status phrase.
                Guidelines:
                pH: <6 acidic, 6–7 good, >7.5 alkaline.
                EC (mS/cm): <0.3 low fertility, 0.3–1.5 good, >1.5 high salts.
                Moisture %: <25 dry, 25–60 ok, >60 wet.
                Temp °C: <10 cold stress, 10–30 ok, >32 heat stress.
                Nutrients: N<25 low, P<15 low, K<100 low, Fe<5 low, Zn<4 low, B<0.8 low, Cu<2 low.
                Mention key issues in summary; make todos short, specific, and direct.
                Output only JSON in the exact schema below.
                {
                "summary": "<2 sentences>",
                "todos": [
                    "<todo1>",
                    "<todo2>",
                    "<todo3>"
                ],
                "status": "<2–5 words>"
                }
                Example output:
                {
                "summary": "pH and EC are optimal with moderate fertility. Nitrogen and zinc are low, possibly limiting growth and flowering.",
                "todos": [
                    "Apply light nitrogen fertilizer.",
                    "Spray foliar zinc solution.",
                    "Maintain steady irrigation."
                ],
                "status": "Moderate nutrient imbalance"
                }


              `,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      // Parse the JSON response
      const parsedResponse = JSON.parse(response);
      return {
        summary: parsedResponse.summary || "Analysis completed",
        todos: parsedResponse.todos || [],
        status: parsedResponse.status || "Analysis completed",
      };
    } catch (error) {
      console.error("Error calling OpenAI:", error);
      // Return fallback response
      return {
        summary: "Analysis completed with fallback response",
        todos: [
          "Review soil data manually",
          "Consider standard soil amendments",
        ],
        status: "Analysis completed",
      };
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
        <CardTitle className="text-lg font-medium">AI Soil Analysis</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={runNewAnalysis}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isLoading ? "Analyzing..." : "Reload Analysis"}
        </Button>
      </CardHeader>
      <CardContent>
        {latestAnalysis ? (
          <div className="space-y-3">
            <div className="text-base text-black">
              Last analyzed: {lastAnalysisDate}
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-medium text-base">Status: </span>
                <span className="text-base">
                  {latestAnalysis.output_data.status}
                </span>
              </div>
              <div>
                <span className="font-medium text-base">Summary: </span>
                <p className="text-base text-black mt-1">
                  {latestAnalysis.output_data.summary}
                </p>
              </div>
              <div>
                <span className="font-medium text-base">Recommendations: </span>
                <ul className="text-base text-black mt-1 space-y-1">
                  {latestAnalysis.output_data.todos.map((todo, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      {todo}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-base text-black mb-2">
              No AI analysis available
            </p>
            <p className="text-sm text-black">
              Click "Reload Analysis" to generate your first AI soil analysis
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
