// MQTT Implementation Template
// This file contains the MQTT implementation that was removed from the dashboard
// Use this as a reference when you need to re-implement MQTT functionality

import { useEffect, useRef, useState } from "react";
import mqtt, { MqttClient } from "mqtt";

// MQTT State Types
type MqttStatus = "disconnected" | "connecting" | "connected" | "error";

interface RoverLocation {
  lat: number;
  long: number;
}

// MQTT Hook - Custom hook for MQTT functionality
export function useMqtt() {
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

      // Subscribe to a topic (example: 'test/topic')
      client.subscribe("jumpstart/ultra", (err) => {
        if (err) {
          console.error("❌ Subscription error:", err);
          setMqttStatus("error");
        } else {
          console.log("📡 Subscribed to jumpstart/ultra");
        }
      });
    });

    client.on("message", (topic, message) => {
      // Log message payload
      console.log(`📥 Topic: ${topic}, Message: ${message.toString()}`);

      // Try to parse location data from MQTT message
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

  // Cleanup on unmount
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
  };
}

// Rover Marker Animation Helper
export function useRoverMarkerAnimation(
  roverLocation: RoverLocation | null,
  roverMarkerRef: React.RefObject<any>,
  mapRef: React.RefObject<any>
) {
  useEffect(() => {
    if (roverLocation && roverMarkerRef.current && mapRef.current) {
      // Animate the marker to the new position
      const animateMarker = (timestamp: number) => {
        const currentPos = roverMarkerRef.current!.getLngLat();
        const targetPos = [roverLocation.long, roverLocation.lat];

        // Calculate the distance to move
        const dx = targetPos[0] - currentPos.lng;
        const dy = targetPos[1] - currentPos.lat;

        // If we're close enough to the target, stop animating
        if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) {
          roverMarkerRef.current!.setLngLat([
            roverLocation.long,
            roverLocation.lat,
          ] as [number, number]);
          return;
        }

        // Smooth animation - move 10% of the distance each frame
        const newLng = currentPos.lng + dx * 0.1;
        const newLat = currentPos.lat + dy * 0.1;

        roverMarkerRef.current!.setLngLat([newLng, newLat] as [number, number]);

        // Continue animation
        requestAnimationFrame(animateMarker);
      };

      // Start the animation
      requestAnimationFrame(animateMarker);
    }
  }, [roverLocation, roverMarkerRef, mapRef]);
}

// MQTT Connection Button Component
export interface MqttButtonProps {
  mqttStatus: MqttStatus;
  connectToMqtt: () => void;
  disconnectFromMqtt: () => void;
}

// Note: This would need the actual Button component and icons imported
// Example usage in component:
/*
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff } from "lucide-react";

export function MqttConnectionButton({ mqttStatus, connectToMqtt, disconnectFromMqtt }: MqttButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={mqttStatus === "connected" ? disconnectFromMqtt : connectToMqtt}
      disabled={mqttStatus === "connecting"}
    >
      {mqttStatus === "connecting" && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
      )}
      {mqttStatus === "connected" && (
        <Wifi className="h-4 w-4 mr-2 text-green-600" />
      )}
      {mqttStatus === "error" && (
        <WifiOff className="h-4 w-4 mr-2 text-red-600" />
      )}
      {mqttStatus === "disconnected" && (
        <WifiOff className="h-4 w-4 mr-2" />
      )}
    </Button>
  );
}
*/

// Instructions for re-implementation:
// 1. Import the useMqtt hook in your component
// 2. Destructure the values you need: const { mqttStatus, roverLocation, connectToMqtt, disconnectFromMqtt } = useMqtt();
// 3. Use the useRoverMarkerAnimation hook if you need animated rover markers
// 4. Add the MQTT connection button to your UI using the example above
// 5. Make sure to install the mqtt package: npm install mqtt @types/mqtt
