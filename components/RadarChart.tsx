import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText, G } from 'react-native-svg';
import { Theme } from '../constants/theme';

interface RadarChartProps {
  data: {
    people: number; // 0 to 100
    process: number;
    business: number;
  };
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ data, size = 250 }) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = (size / 2) * 0.7;

  // Angles for 3 domains (People, Process, Business Environment)
  // 0 degrees is top, 120 is bottom right, 240 is bottom left
  const angles = [0, 120, 240];
  const labels = ['People', 'Process', 'Business Env'];
  const values = [data.people, data.process, data.business];

  const getPoint = (angle: number, distance: number) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return {
      x: centerX + distance * Math.cos(rad),
      y: centerY + distance * Math.sin(rad),
    };
  };

  // Background Web (3 levels)
  const backgroundLevels = [0.33, 0.66, 1].map(level => {
    return angles.map(angle => {
      const p = getPoint(angle, radius * level);
      return `${p.x},${p.y}`;
    }).join(' ');
  });

  // Actual Data Polygon
  const dataPoints = angles.map((angle, i) => {
    const val = Math.max(10, values[i]); // Minimum 10% to show something
    const p = getPoint(angle, (radius * val) / 100);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Axis Lines */}
        {angles.map((angle, i) => {
          const p = getPoint(angle, radius);
          return (
            <Line
              key={`line-${i}`}
              x1={centerX}
              y1={centerY}
              x2={p.x}
              y2={p.y}
              stroke={Theme.colors.border}
              strokeWidth="1"
            />
          );
        })}

        {/* Background Grids */}
        {backgroundLevels.map((points, i) => (
          <Polygon
            key={`grid-${i}`}
            points={points}
            fill="none"
            stroke={Theme.colors.border}
            strokeWidth="1"
            strokeDasharray={i === 2 ? "" : "4,4"}
          />
        ))}

        {/* Data Polygon */}
        <Polygon
          points={dataPoints}
          fill="rgba(67, 97, 238, 0.3)"
          stroke={Theme.colors.primary}
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Data Points */}
        {angles.map((angle, i) => {
          const val = Math.max(10, values[i]);
          const p = getPoint(angle, (radius * val) / 100);
          return (
            <Circle
              key={`circle-${i}`}
              cx={p.x}
              cy={p.y}
              r="4"
              fill={Theme.colors.primary}
            />
          );
        })}

        {/* Labels */}
        {angles.map((angle, i) => {
          const p = getPoint(angle, radius + 25);
          return (
            <G key={`label-g-${i}`}>
              <SvgText
                x={p.x}
                y={p.y}
                fill={Theme.colors.text}
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {labels[i]}
              </SvgText>
              <SvgText
                x={p.x}
                y={p.y + 14}
                fill={Theme.colors.primary}
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
              >
                {values[i].toFixed(0)}%
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Theme.spacing.l,
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.m,
    borderRadius: Theme.borderRadius.l,
  },
});
