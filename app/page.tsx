"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/ui/navbar";

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

  const [showSplash, setShowSplash] = useState(true);
  const [displayedText, setDisplayedText] = useState("");
  const [splashTagline, setSplashTagline] = useState("");

  useEffect(() => {
    if (showSplash) {
      let i = 0;
      const interval = setInterval(() => {
        setSplashTagline(tagline.slice(0, i + 1));
        i++;
        if (i === tagline.length) {
          clearInterval(interval);
          setTimeout(() => setShowSplash(false), 1500);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [showSplash, tagline]);

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

  const titleColors = [
    "#f0ead2", // Light cream
    "#dde5b6", // Light green
    "#adc178", // Medium green
    "#a98467", // Brown
    "#f0ead2", // Light cream
    "#dde5b6", // Light green
    "#adc178", // Medium green
    "#a98467", // Brown
    "#f0ead2", // Light cream
  ];

  const titleLetters = "GROUNDHOG";

  const splashVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, ease: "easeOut" as const },
    },
    exit: {
      opacity: 0,
      scale: 1.1,
      transition: { duration: 0.5, ease: "easeIn" as const },
    },
  };

  const letterVariants = {
    initial: { opacity: 0, y: 50, scale: 0.5 },
    animate: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: "easeOut" as const,
        type: "spring" as const,
        stiffness: 100,
      },
    }),
    hover: {
      y: -10,
      scale: 1.1,
      transition: { duration: 0.2, ease: "easeInOut" as const },
    },
  };

  const buttonVariants = {
    initial: { opacity: 0, y: 20 },
    animate: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 1.2 + i * 0.2,
        duration: 0.6,
        ease: "easeOut" as const,
      },
    }),
    hover: {
      scale: 1.05,
      transition: { duration: 0.2, ease: "easeInOut" as const },
    },
    tap: {
      scale: 0.95,
      transition: { duration: 0.1 },
    },
  };

  const contentVariants = {
    initial: { opacity: 0, y: 30 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 1.8,
        duration: 0.8,
        ease: "easeOut" as const,
      },
    },
  };

  const textVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeInOut" as const,
      },
    },
  };

  if (showSplash) {
    return (
      <AnimatePresence>
        <motion.div
          key="splash"
          className="relative min-h-screen flex items-center justify-center overflow-hidden"
          variants={splashVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <motion.div
            className="flex flex-col items-center justify-center space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <motion.img
              src="/groundhog.png"
              alt="Groundhog Logo"
              className="w-48 h-48 md:w-64 md:h-64 object-contain"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.5,
                duration: 1,
                type: "spring",
                stiffness: 100,
              }}
            />
            <motion.p
              className="text-xl md:text-2xl font-bold text-green-700 font-mono text-center px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              {splashTagline}
            </motion.p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden">
      <Navbar />
      {/* Video Background */}
      <motion.video
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        src="https://cdn.pixabay.com/video/2023/04/25/160402-821086414_large.mp4"
        autoPlay
        loop
        muted
        playsInline
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Overlay for readability */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full bg-black/40 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center justify-center w-full px-4">
        {/* Static Title */}
        <div className="flex flex-wrap justify-center items-center gap-1 md:gap-2 mb-8">
          {titleLetters.split("").map((letter, index) => (
            <motion.h1
              key={index}
              className="text-4xl md:text-6xl lg:text-7xl font-bold cursor-default select-none"
              style={{ color: titleColors[index] }}
              initial={{ opacity: 0, y: 50, scale: 0.5 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  delay: index * 0.1,
                  duration: 0.6,
                  ease: "easeOut" as const,
                  type: "spring" as const,
                  stiffness: 100,
                },
              }}
              whileHover={{ y: -10, scale: 1.1 }}
              transition={{ duration: 0.2, ease: "easeInOut" as const }}
            >
              {letter}
            </motion.h1>
          ))}
        </div>

        {/* Description Section - Appears below without moving title */}
        <div className="w-full max-w-4xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, height: 0, overflow: "hidden" }}
            animate={{
              opacity: 1,
              height: "auto",
              overflow: "visible",
              transition: {
                delay: 1.0,
                duration: 0.8,
                ease: "easeOut" as const,
              },
            }}
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-white mb-6 underline decoration-green-400 decoration-2"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: {
                  delay: 1.2,
                  duration: 0.5,
                  ease: "easeInOut" as const,
                },
              }}
            >
              Information
            </motion.h2>

            <motion.div
              className="whitespace-pre-line font-mono text-white text-sm md:text-base leading-relaxed mb-6"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: {
                  delay: 1.4,
                  duration: 0.5,
                  ease: "easeInOut" as const,
                },
              }}
            >
              {displayedText}
            </motion.div>

            <motion.p
              className="text-green-400 font-bold text-lg md:text-xl"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: {
                  delay: 1.6,
                  duration: 0.5,
                  ease: "easeInOut" as const,
                },
              }}
            >
              {tagline}
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
