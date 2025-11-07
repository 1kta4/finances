import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface NeomorphicCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  pressed?: boolean;
}

export const NeomorphicCard: React.FC<NeomorphicCardProps> = ({
  children,
  style,
  pressed = false
}) => {
  const { colors, themeMode } = useTheme();

  // Dual-shadow implementation:
  // - Outer view: dark shadow (bottom-right)
  // - Inner view: light shadow (top-left) via negative offset
  // - Pressed state: inverted shadow positions

  return (
    <View
      style={[
        styles.outerContainer,
        {
          backgroundColor: 'transparent',
          // Dark shadow (bottom-right)
          shadowColor: pressed ? colors.shadowLight : colors.shadowDark,
          shadowOffset: pressed
            ? { width: -3, height: -3 }  // Inverted for pressed
            : { width: 4, height: 4 },
          shadowOpacity: themeMode === 'dark' ? 0.8 : 0.15,
          shadowRadius: pressed ? 6 : 10,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.innerContainer,
          {
            backgroundColor: colors.surface,
            // Light shadow (top-left)
            shadowColor: pressed ? colors.shadowDark : colors.shadowLight,
            shadowOffset: pressed
              ? { width: 3, height: 3 }  // Inverted for pressed
              : { width: -4, height: -4 },
            shadowOpacity: themeMode === 'dark' ? 0.05 : 0.7,
            shadowRadius: pressed ? 6 : 10,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    borderRadius: 20,
  },
  innerContainer: {
    borderRadius: 20,
    padding: 20,
  },
});
