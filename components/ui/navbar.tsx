"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Navbar() {
  const navbarVariants = {
    initial: { opacity: 0, y: -20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  const buttonVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.3 + i * 0.1,
        duration: 0.4,
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

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10"
      variants={navbarVariants}
      initial="initial"
      animate="animate"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <motion.div
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <img
              src="https://img.freepik.com/premium-vector/groundhog-logo-design-vector-illustration_685330-1069.jpg?w=360"
              alt="Groundhog Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="text-white font-bold text-lg font-mono">
              GroundHog
            </span>
          </motion.div>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-4">
            <motion.div
              custom={0}
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              whileTap="tap"
            >
              <Link href="/demo">
                <Button
                  variant="outline"
                  className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-200"
                >
                  Demo
                </Button>
              </Link>
            </motion.div>

            <motion.div
              custom={1}
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              whileTap="tap"
            >
              <Link href="/login">
                <Button
                  variant="outline"
                  className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-200"
                >
                  Login
                </Button>
              </Link>
            </motion.div>

            <motion.div
              custom={2}
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              whileTap="tap"
            >
              <Link href="/onboard">
                <Button className="bg-green-600 hover:bg-green-700 text-white border-0 transition-all duration-200">
                  Register Farm
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
