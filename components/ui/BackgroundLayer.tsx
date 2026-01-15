"use client";

import React from "react";
import { cn } from "@/lib/utils"; // Assuming you have a standard shadcn utility for class merging

/**
 * 1. Define the Shape of User Preferences
 * These match the dropdown options seen in your screenshots.
 */
export interface BackgroundConfig {
  url: string | null;          // null if "None" is selected
  repeat: "repeat" | "no-repeat";
  size: "auto" | "cover" | "contain";
  position: "center" | "top" | "left" | "right" | "bottom";
}

/**
 * Default settings in case data is missing
 */
const DEFAULT_CONFIG: BackgroundConfig = {
  url: null, // Default to no image
  repeat: "no-repeat",
  size: "cover",
  position: "center",
};

interface BackgroundLayerProps {
  /**
   * The configuration object usually loaded from your user's settings profile.
   * If not provided, it falls back to defaults.
   */
  config?: BackgroundConfig;
}

export default function BackgroundLayer({ config = DEFAULT_CONFIG }: BackgroundLayerProps) {
  // If user selected "None" (url is null/empty), we only render the glass tint logic over the base background color
  const hasImage = !!config.url;

  // 2. Map User Selections to Tailwind Utility Classes
  const sizeClass = {
    auto: "bg-auto",
    cover: "bg-cover",
    contain: "bg-contain",
  }[config.size];

  const repeatClass = {
    repeat: "bg-repeat",
    "no-repeat": "bg-no-repeat",
  }[config.repeat];

  const positionClass = {
    center: "bg-center",
    top: "bg-top",
    left: "bg-left",
    right: "bg-right",
    bottom: "bg-bottom",
  }[config.position];

  return (
    <>
      {/* === LAYER 1: The User's Custom Wallpaper === 
        z-index: -2
      */}
      {hasImage && (
        <div
          className={cn(
            "fixed inset-0 z-[-2] h-full w-full transition-all duration-300 ease-in-out",
            // We use 'bg-fixed' to keep the wallpaper static while content scrolls
            "bg-fixed", 
            // Apply the dynamic mappings
            sizeClass,
            repeatClass,
            positionClass
          )}
          style={{
            backgroundImage: `url('${config.url}')`,
          }}
          aria-hidden="true"
        />
      )}

      {/* === LAYER 2: The "SunBuggy Atmosphere" (Glass Effect) === 
        z-index: -1
        This layer persists even if no image is selected, ensuring text contrast 
        remains consistent (frosted/smoked) against whatever is behind.
      */}
      <div
        className={cn(
          "fixed inset-0 z-[-1] h-full w-full pointer-events-none transition-colors duration-500",
          // Light Mode: White tint + Blur (Frosted)
          "bg-white/30 backdrop-blur-[2px]",
          // Dark Mode: Black tint + Blur (Smoked)
          "dark:bg-black/60"
        )}
      />
    </>
  );
}