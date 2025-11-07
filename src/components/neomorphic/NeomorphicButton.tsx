import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface NeomorphicButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  fullWidth?: boolean;
}

export const NeomorphicButton: React.FC<NeomorphicButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
}) => {
  const { colors, themeMode } = useTheme();
  const [pressed, setPressed] = useState(false);
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    setPressed(true);
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.surface,
      borderRadius: 16,
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    if (variant === 'primary') {
      baseStyle.backgroundColor = colors.accent;
    } else if (variant === 'outline') {
      baseStyle.backgroundColor = 'transparent';
      baseStyle.borderWidth = 2;
      baseStyle.borderColor = colors.accent;
    }

    if (disabled) {
      baseStyle.opacity = 0.5;
    }

    return baseStyle;
  };

  const getTextColor = (): string => {
    if (variant === 'primary') {
      return themeMode === 'light' ? '#FFFFFF' : '#000000';
    }
    if (variant === 'outline') {
      return colors.accent;
    }
    return colors.text;
  };

  return (
    <Animated.View
      style={[
        {
          borderRadius: 16,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      {/* Outer View - Dark Shadow (bottom-right) */}
      <View
        style={[
          styles.outerShadow,
          variant === 'outline' && { backgroundColor: 'transparent' },
          {
            backgroundColor: variant === 'outline' ? 'transparent' : colors.surface,
            shadowColor: pressed ? colors.shadowLight : colors.shadowDark,
            shadowOffset: pressed
              ? { width: -2, height: -2 }
              : { width: 3, height: 3 },
            shadowOpacity: themeMode === 'dark' ? 0.6 : (variant === 'outline' ? 0 : 0.12),
            shadowRadius: pressed ? 4 : 8,
          },
        ]}
      >
        {/* Inner View - Light Shadow (top-left) */}
        <View
          style={[
            styles.innerShadow,
            variant === 'outline' && { backgroundColor: 'transparent' },
            {
              backgroundColor: variant === 'outline' ? 'transparent' : colors.surface,
              shadowColor: pressed ? colors.shadowDark : colors.shadowLight,
              shadowOffset: pressed
                ? { width: 2, height: 2 }
                : { width: -3, height: -3 },
              shadowOpacity: themeMode === 'dark' ? 0.03 : (variant === 'outline' ? 0 : 0.6),
              shadowRadius: pressed ? 4 : 8,
            },
          ]}
        >
          <TouchableOpacity
            style={[getButtonStyle(), styles.button]}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            activeOpacity={1}
          >
            <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
              {title}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerShadow: {
    borderRadius: 16,
  },
  innerShadow: {
    borderRadius: 16,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
