"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { supabase } from "@/lib/supabaseClient";
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
import { Loader2 } from "lucide-react";

export default function Login() {
  const [farmId, setFarmId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    if (!farmId.trim()) {
      setIsLoading(false);
      return;
    }

    try {
      // Check if farm exists in Supabase
      const { data: farmData, error: farmError } = await supabase
        .from("farm-data")
        .select("farm_id, farm_name, farmer_name")
        .eq("farm_id", farmId.trim())
        .single();

      if (farmError || !farmData) {
        setError(true);
        setIsLoading(false);
        return;
      }

      // Set cookie with farm ID
      Cookies.set("farm_id", farmId.trim(), { expires: 7 }); // Expires in 7 days

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setError(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Farm Login
          </CardTitle>
          <CardDescription className="text-center">
            Enter your Farm ID to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="farmId">Farm ID</Label>
              <Input
                id="farmId"
                type="text"
                placeholder="Enter your Farm ID"
                value={farmId}
                onChange={(e) => setFarmId(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            </div>

            {error == true && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md flex flex-col items-center gap-2">
                Invalid Farm ID. Please check and try again.
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => {
                    router.push("/onboard");
                  }}
                >
                  Create Farm?
                </Button>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
