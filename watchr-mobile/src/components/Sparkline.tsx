// src/components/Sparkline.tsx
import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface SparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

const Sparkline: React.FC<SparklineProps> = ({ data, color, width = 52, height = 26 }) => {
  if (!data || data.length === 0) {
    return <Svg width={width} height={height} />;
  }

  // Normalize data to fit within the SVG bounds
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Prevent division by zero
  
  const normalizedData = data.map(value => (value - min) / range);
  
  // Create SVG path
  const points = normalizedData.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - (value * height);
    return `${x},${y}`;
  }).join(' ');

  return (
    <Svg width={width} height={height}>
      <Path
        d={`M${points}`}
        fill="none"
        stroke={color}
        strokeWidth={1.2}
        opacity={0.85}
      />
    </Svg>
  );
};

export default Sparkline;
