import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, View, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface NeomorphicSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export const NeomorphicSwitch: React.FC<NeomorphicSwitchProps> = ({
  value,
  onValueChange,
  style,
  disabled = false,
}) => {
  const { colors, themeMode } = useTheme();
  const [pressed, setPressed] = useState(false);
  const [animatedValue] = useState(new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  const thumbPosition = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  // Helper function to add opacity to hex color
  const addOpacityToColor = (hexColor: string, opacity: number): string => {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Return rgba
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const offStateColor = addOpacityToColor(colors.accent, 0.3);

  const trackColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [offStateColor, colors.accent],
  });

  return (
    <View
      style={[
        styles.outerShadow,
        {
          backgroundColor: colors.background,
          shadowColor: pressed ? colors.shadowLight : colors.shadowDark,
          shadowOffset: pressed ? { width: -1, height: -1 } : { width: 2, height: 2 },
          shadowOpacity: themeMode === 'dark' ? 0.6 : 0.15,
          shadowRadius: 4,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.innerShadow,
          {
            backgroundColor: colors.background,
            shadowColor: pressed ? colors.shadowDark : colors.shadowLight,
            shadowOffset: pressed ? { width: 1, height: 1 } : { width: -2, height: -2 },
            shadowOpacity: themeMode === 'dark' ? 0.05 : 0.6,
            shadowRadius: 4,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.switchContainer}
          onPress={handlePress}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          disabled={disabled}
          activeOpacity={1}
        >
          <Animated.View
            style={[
              styles.track,
              {
                backgroundColor: trackColor,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.thumb,
                {
                  backgroundColor: colors.background,
                  shadowColor: colors.shadowDark,
                  shadowOffset: { width: 1, height: 1 },
                  shadowOpacity: themeMode === 'dark' ? 0.6 : 0.2,
                  shadowRadius: 3,
                  transform: [{ translateX: thumbPosition }],
                },
              ]}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerShadow: {
    borderRadius: 18,
    width: 52,
    height: 32,
  },
  innerShadow: {
    borderRadius: 18,
    width: 52,
    height: 32,
  },
  switchContainer: {
    borderRadius: 18,
    width: 52,
    height: 32,
  },
  track: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    padding: 2,
  },
  thumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    left: 0,
  },
});
