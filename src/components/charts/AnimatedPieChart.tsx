import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

interface PieChartDataItem {
  name: string;
  amount: number;
  color: string;
  legendFontColor?: string;
  legendFontSize?: number;
}

interface AnimatedPieChartProps {
  data: PieChartDataItem[];
  width: number;
  height: number;
  accessor: string;
  backgroundColor?: string;
  style?: any;
  chartKey?: string; // Used to trigger animations on data change
}

interface SliceData {
  color: string;
  name: string;
  startAngle: number;
  endAngle: number;
  pullOut: boolean;
}

interface AnimatedSliceProps {
  animatedValue: Animated.Value;
  slice: SliceData;
  centerX: number;
  centerY: number;
  radius: number;
  chartKey: string;
  index: number;
}

export const AnimatedPieChart: React.FC<AnimatedPieChartProps> = ({
  data,
  width,
  height,
  accessor,
  backgroundColor = 'transparent',
  style,
  chartKey = 'default',
}) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) - 10;
  const [slicesData, setSlicesData] = useState<SliceData[]>([]);
  const [animatedValues, setAnimatedValues] = useState<Animated.Value[]>([]);
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const prevChartKey = useRef(chartKey);
  const prevDataLength = useRef(0);
  const currentAnimations = useRef<Animated.CompositeAnimation | null>(null);

  // Calculate slice data and trigger animations
  useEffect(() => {
    // Stop any running animations
    if (currentAnimations.current) {
      currentAnimations.current.stop();
      currentAnimations.current = null;
    }

    const total = data.reduce((sum, item) => {
      const value = item[accessor as keyof PieChartDataItem];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);

    if (total === 0) {
      setSlicesData([]);
      setAnimatedValues([]);
      return;
    }

    let currentAngle = -Math.PI / 2;

    const newSlices: SliceData[] = data.map((item, index) => {
      const value = item[accessor as keyof PieChartDataItem] as number;
      const percentage = value / total;
      const sliceAngle = percentage * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;

      currentAngle = endAngle;

      return {
        color: item.color,
        name: item.name,
        startAngle,
        endAngle,
        pullOut: index === 0,
      };
    });

    // Create new animation values
    const newAnimatedValues = newSlices.map(() => new Animated.Value(0));
    
    // Update state
    setSlicesData(newSlices);
    setAnimatedValues(newAnimatedValues);

    // Determine if this is a chart change
    const isChartChange = prevChartKey.current !== chartKey && prevDataLength.current > 0;
    prevChartKey.current = chartKey;
    prevDataLength.current = newSlices.length;

    // Use requestAnimationFrame to ensure state has updated before animating
    requestAnimationFrame(() => {
      if (isChartChange) {
        // For chart changes, just animate in the new chart directly
        labelOpacity.setValue(0);

        const animation = Animated.parallel([
          Animated.stagger(
            50,
            newAnimatedValues.map((anim) =>
              Animated.timing(anim, {
                toValue: 1,
                duration: 800,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
              })
            )
          ),
          Animated.timing(labelOpacity, {
            toValue: 1,
            duration: 400,
            delay: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]);

        currentAnimations.current = animation;
        animation.start(({ finished }) => {
          if (finished) {
            currentAnimations.current = null;
          }
        });
      } else {
        // Initial load
        labelOpacity.setValue(0);

        const animation = Animated.parallel([
          Animated.stagger(
            50,
            newAnimatedValues.map((anim) =>
              Animated.timing(anim, {
                toValue: 1,
                duration: 800,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
              })
            )
          ),
          Animated.timing(labelOpacity, {
            toValue: 1,
            duration: 400,
            delay: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]);

        currentAnimations.current = animation;
        animation.start(({ finished }) => {
          if (finished) {
            currentAnimations.current = null;
          }
        });
      }
    });
  }, [data, accessor, chartKey]);

  return (
    <View style={[{ width, backgroundColor }, style]}>
      <Svg width={width} height={height}>
        <G>
          {slicesData.map((slice, index) => {
            if (!animatedValues[index]) return null;

            return (
              <AnimatedSlice
                key={`${chartKey}-${index}`}
                animatedValue={animatedValues[index]}
                slice={slice}
                centerX={centerX}
                centerY={centerY}
                radius={radius}
                chartKey={chartKey}
                index={index}
              />
            );
          })}
        </G>
      </Svg>

      {/* Legend */}
      <Animated.View style={[styles.legendContainer, { opacity: labelOpacity }]}>
        {data.map((item, index) => (
          <View key={`legend-${index}`} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text
              style={[styles.legendText, {
                color: item.legendFontColor || '#7F7F7F',
                fontSize: item.legendFontSize || 12,
              }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

const AnimatedSlice: React.FC<AnimatedSliceProps> = ({
  animatedValue,
  slice,
  centerX,
  centerY,
  radius,
}) => {
  const createArcPath = (
    startAngle: number,
    endAngle: number,
    pullOut: boolean = false
  ): string => {
    const pullOutDistance = pullOut ? 10 : 0;
    const midAngle = (startAngle + endAngle) / 2;
    const offsetX = Math.cos(midAngle) * pullOutDistance;
    const offsetY = Math.sin(midAngle) * pullOutDistance;

    const x1 = centerX + offsetX + radius * Math.cos(startAngle);
    const y1 = centerY + offsetY + radius * Math.sin(startAngle);
    const x2 = centerX + offsetX + radius * Math.cos(endAngle);
    const y2 = centerY + offsetY + radius * Math.sin(endAngle);

    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    return `M ${centerX + offsetX} ${centerY + offsetY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    if (!animatedValue) return;

    // Initialize path
    const updatePath = (value: number) => {
      const animatedEnd = slice.startAngle + (slice.endAngle - slice.startAngle) * value;
      const newPath = createArcPath(slice.startAngle, animatedEnd, slice.pullOut);
      setCurrentPath(newPath);
    };

    // Set initial path
    updatePath((animatedValue as any).__getValue() || 0);

    // Listen for updates
    const listener = animatedValue.addListener(({ value }) => {
      updatePath(value);
    });

    return () => {
      if (animatedValue) {
        animatedValue.removeListener(listener);
      }
    };
  }, [animatedValue, slice.startAngle, slice.endAngle, slice.pullOut, centerX, centerY, radius]);

  return (
    <Path
      d={currentPath}
      fill={slice.color}
    />
  );
};

const styles = StyleSheet.create({
  legendContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginRight: 16,
    width: '45%',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    flex: 1,
  },
});
