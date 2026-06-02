import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { BadgeTier } from "@/context/AuthContext";

interface BadgeIconProps {
  tier: BadgeTier;
  size?: number;
}

export function BadgeIcon({ tier, size = 18 }: BadgeIconProps) {
  if (tier === "basic") return null;

  const color = tier === "pro_blue" ? "#3B82F6" : "#8B5CF6";

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="11" fill={color} />
      <Circle cx="12" cy="12" r="10" fill={color} opacity={0.9} />
      <Path
        d="M7 12.5L10.5 16L17 9"
        stroke="white"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
