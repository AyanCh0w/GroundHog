"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  const tagline = "Know Your Soil, Grow Your Future — with GroundHog.";
  const fullText = `GroundHog aims to help farmers monitor soil health more efficiently by
automating the process of checking critical soil conditions, to reduce
the use of inefficient irrigation systems to reduce unnecessary crop
deaths through overwatering. By providing asynchronous data on soil
pH, nutrient levels, temperature, and moisture, the rover helps
farmers make better decisions about irrigation, fertilization, and
crop management. This reduces the need for manual sampling, saves
time, and supports more sustainable and precise farming practices. Our
solution and dream is a small autonomous rover designed to move
through rows of farmland and automatically collect soil data. It uses
a rack-and-gear mechanism powered by servomotors to push a 4-in-1 soil
sensor into the soil. The rover navigates the farm using GPS,
transmitting soil data (pH, electrical conductivity, temperature, moisture) to an
interactive website (here) where farmers can view soil conditions mapped to
specific locations in their field.`;

  const [displayedText, setDisplayedText] = useState("");
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [splashTagline, setSplashTagline] = useState("");

  useEffect(() => {
    if (showSplash) {
      let i = 0;
      const interval = setInterval(() => {
        setSplashTagline(tagline.slice(0, i + 1));
        i++;
        if (i === tagline.length) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    }
  }, [showSplash]);

  useEffect(() => {
    const timer1 = setTimeout(() => setFadeOut(true), 2000);
    const timer2 = setTimeout(() => setShowSplash(false), 2500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  useEffect(() => {
    if (!showSplash) {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayedText(fullText.slice(0, i + 1));
        i++;
        if (i === fullText.length) clearInterval(interval);
      }, 18);
      return () => clearInterval(interval);
    }
  }, [showSplash]);

  // ...existing code...
  if (showSplash) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
        {/* Splash Content */}
        <div className="relative z-20 flex flex-col items-center justify-center w-full">
          <img
            src="https://img.freepik.com/premium-vector/groundhog-logo-design-vector-illustration_685330-1069.jpg?w=360"
            alt="Groundhog Logo"
            className={`w-64 h-64 object-contain mb-8 transition-opacity duration-500 ${
              fadeOut ? "opacity-0" : "opacity-100"
            }`}
          />
          <p
            className={`text-2xl font-bold text-green-700 font-mono transition-opacity duration-500 ${
              fadeOut ? "opacity-0" : "opacity-100"
            }`}
          >
            {splashTagline}
          </p>
        </div>
      </div>
    );
  }
  // ...existing code...

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden">
      {/* Video Background */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        src="https://cdn.pixabay.com/video/2023/04/25/160402-821086414_large.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Overlay for readability */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/40 z-10" />

      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center justify-center w-full">
        <div className="relative z-20 flex flex-row items-center justify-center w-full">
          <h1 className="text-6xl font-bold" style={{ color: "#f0ead2" }}>
            G
          </h1>
          <h1 className="text-6xl font-bold" style={{ color: "#dde5b6" }}>
            R
          </h1>
          <h1 className="text-6xl font-bold" style={{ color: "#adc178" }}>
            O
          </h1>
          <h1 className="text-6xl font-bold" style={{ color: "#a98467" }}>
            U
          </h1>
          <h1 className="text-6xl font-bold" style={{ color: "#f0ead2" }}>
            N
          </h1>
          <h1 className="text-6xl font-bold" style={{ color: "#dde5b6" }}>
            D
          </h1>
          <h1 className="text-6xl font-bold" style={{ color: "#adc178" }}>
            H
          </h1>
          <h1 className="text-6xl font-bold" style={{ color: "#a98467" }}>
            O
          </h1>
          <h1 className="text-6xl font-bold" style={{ color: "#f0ead2" }}>
            G
          </h1>
        </div>
        <br />
        <div className="relative z-20 flex flex-row items-center justify-center w-full">
          <Link href={"/dashboard"}>
            <Button
              className="cursor-pointer w-38  border-4 border-black"
              variant="secondary"
            >
              Log In
            </Button>
          </Link>

          <Link href={"/dashboard"}>
            <Button
              className="cursor-pointer w-38 border-4 border-black"
              variant="secondary"
            >
              Create an account
            </Button>
          </Link>
        </div>
        <br />
        <br />
        <h1 className="text-4xl font-bold underline text-white">Information</h1>
        <p className="whitespace-pre-line font-mono text-white">
          {displayedText}
        </p>
        <p className="mt-4 text-green-500 font-bold text-lg">{tagline}</p>
      </div>
    </div>
  );
  // ...existing code...
}
