import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View, Animated, Easing } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface NeomorphicChipProps {
  label: string;
  onPress: () => void;
  selected?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const NeomorphicChip: React.FC<NeomorphicChipProps> = ({
  label,
  onPress,
  selected = false,
  style,
  textStyle,
}) => {
  const { colors, themeMode } = useTheme();
  const [pressed, setPressed] = useState(false);
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const backgroundColorAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  const isActive = selected || pressed;

  // Animate on selection change
  useEffect(() => {
    // Background color transition
    Animated.timing(backgroundColorAnim, {
      toValue: selected ? 1 : 0,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    // Bounce animation when selected
    if (selected) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [selected]);

  // Interpolate background color
  const animatedBackgroundColor = backgroundColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.background, colors.accent],
  });

  // Interpolate text color
  const animatedTextColor = backgroundColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.text, '#FFFFFF'],
  });

  return (
    <Animated.View
      style={[
        styles.outerShadow,
        {
          backgroundColor: colors.background,
          shadowColor: isActive ? colors.shadowLight : colors.shadowDark,
          shadowOffset: isActive ? { width: -2, height: -2 } : { width: 3, height: 3 },
          shadowOpacity: themeMode === 'dark' ? 0.6 : 0.15,
          shadowRadius: 6,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      <View
        style={[
          styles.innerShadow,
          {
            backgroundColor: colors.background,
            shadowColor: isActive ? colors.shadowDark : colors.shadowLight,
            shadowOffset: isActive ? { width: 2, height: 2 } : { width: -3, height: -3 },
            shadowOpacity: themeMode === 'dark' ? 0.05 : 0.6,
            shadowRadius: 6,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.touchable}
          onPress={onPress}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          activeOpacity={1}
        >
          <Animated.View
            style={[
              styles.chip,
              {
                backgroundColor: animatedBackgroundColor,
              },
            ]}
          >
            <Animated.Text
              style={[
                styles.text,
                { color: animatedTextColor },
                textStyle,
              ]}
            >
              {label}
            </Animated.Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerShadow: {
    borderRadius: 12,
    flex: 1,
  },
  innerShadow: {
    borderRadius: 12,
    flex: 1,
  },
  touchable: {
    flex: 1,
    borderRadius: 12,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
