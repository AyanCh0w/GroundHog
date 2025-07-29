"use client";

import Cookies from "js-cookie";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  MapPin,
  Upload,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FarmData {
  farmName: string;
  farmerName: string;
  latitude: number;
  longitude: number;
}

export default function OnboardPage() {
  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [farmData, setFarmData] = useState<FarmData>({
    farmName: "",
    farmerName: "",
    latitude: 0,
    longitude: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize map when component mounts
  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_KEY;
    if (currentStep === 2 && mapContainer.current && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [-90, 38], // Default to NYC, will be updated with user location
        zoom: 3,
      });

      // Get user's location and center map
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            map.current?.flyTo({
              center: [longitude, latitude],
              zoom: 14,
            });
            setFarmData((prev) => ({ ...prev, latitude, longitude }));
          },
          () => {
            // Fallback to default location if geolocation fails
            console.log("Geolocation not available");
          }
        );
      }

      // Add click handler to place marker
      map.current.on("click", (e: mapboxgl.MapMouseEvent) => {
        const { lng, lat } = e.lngLat;

        // Remove existing marker
        if (marker.current) {
          marker.current.remove();
        }

        // Add new marker
        marker.current = new mapboxgl.Marker({ color: "#22c55e" })
          .setLngLat([lng, lat])
          .addTo(map.current!);

        setFarmData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
      });

      return () => {
        if (map.current) {
          map.current.remove();
        }
      };
    }
  }, [currentStep]);

  const handleNext = () => {
    if (
      currentStep === 1 &&
      !farmData.farmName.trim() &&
      !farmData.farmerName.trim()
    ) {
      setError("Please enter a farm name and your name");
      return;
    }
    if (
      currentStep === 2 &&
      farmData.latitude === 0 &&
      farmData.longitude === 0
    ) {
      setError("Please select a location on the map");
      return;
    }

    setError("");
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
    setError("");
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      const { data, error: supabaseError } = await supabase
        .from("farmData")
        .insert([
          {
            farm_name: farmData.farmName,
            farm_id: farmData.farmName.toLowerCase().replace(/ /g, "_"),
            farmer_name: farmData.farmerName,
            lat: farmData.latitude,
            long: farmData.longitude,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (supabaseError) {
        throw supabaseError;
      }

      // Redirect to dashboard after successful creation
      Cookies.set(
        "farm_id",
        farmData.farmName.toLowerCase().replace(/ /g, "_"),
        {
          expires: 7,
        }
      );
      router.push("/dashboard");
    } catch (err) {
      console.error("Error creating farm:", err);
      setError("Failed to create farm. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 1, title: "Farm Name", description: "Enter a name for your farm" },
    {
      id: 2,
      title: "Location",
      description: "Select your farm location on the map",
    },
    { id: 3, title: "Complete", description: "Review and create your farm" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.id
                      ? "bg-green-500 border-green-500 text-white"
                      : "bg-white border-gray-300 text-gray-500"
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-0.5 mx-2 ${
                      currentStep > step.id ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {steps[currentStep - 1].title}
            </h2>
            <p className="text-gray-600">
              {steps[currentStep - 1].description}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep === 1 && <MapPin className="w-5 h-5" />}
              {currentStep === 2 && <MapPin className="w-5 h-5" />}
              {currentStep === 3 && <Upload className="w-5 h-5" />}
              {currentStep === 1 && "Farm Name"}
              {currentStep === 2 && "Select Location"}
              {currentStep === 3 && "Create Farm"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Give your farm a memorable name"}
              {currentStep === 2 &&
                "Click on the map to set your farm location"}
              {currentStep === 3 && "Review your farm details and create it"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Step 1: Farm Name */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex flex-col gap-4">
                  <div>
                    <Label htmlFor="farmerName">Your Name</Label>
                    <Input
                      id="farmerName"
                      type="text"
                      placeholder="Enter your name..."
                      value={farmData.farmerName}
                      onChange={(e) =>
                        setFarmData((prev) => ({
                          ...prev,
                          farmerName: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="farmName">Farm Name</Label>
                    <Input
                      id="farmName"
                      type="text"
                      placeholder="Enter your farm name..."
                      value={farmData.farmName}
                      onChange={(e) =>
                        setFarmData((prev) => ({
                          ...prev,
                          farmName: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Map */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="h-96 rounded-lg overflow-hidden border">
                  <div ref={mapContainer} className="w-full h-full" />
                </div>
                <div className="text-sm text-gray-600">
                  <p>Click anywhere on the map to set your farm location</p>
                  {farmData.latitude !== 0 && farmData.longitude !== 0 && (
                    <p className="mt-2 font-mono text-xs">
                      Selected: {farmData.latitude.toFixed(6)},{" "}
                      {farmData.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Farm Details</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Name:</span>{" "}
                      {farmData.farmerName}
                    </p>
                    <p>
                      <span className="font-medium">Location:</span>{" "}
                      {farmData.latitude.toFixed(6)},{" "}
                      {farmData.longitude.toFixed(6)}
                    </p>

                    <Alert variant="destructive">
                      <AlertTitle>
                        Farm ID (Save this as you will need this to login)
                      </AlertTitle>
                      <AlertDescription>
                        <p className="font-mono text-lg">
                          {farmData.farmName.toLowerCase().replace(/ /g, "_")}
                        </p>
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Create Farm
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
