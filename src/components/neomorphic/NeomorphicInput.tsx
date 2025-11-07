import React from 'react';
import { TextInput, StyleSheet, View, Text, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface NeomorphicInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const NeomorphicInput: React.FC<NeomorphicInputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}) => {
  const { colors, themeMode } = useTheme();

  // Dual-shadow implementation for indented appearance:
  // - Outer view: light shadow (bottom-right) - inverted for inset effect
  // - Inner view: dark shadow (top-left) - inverted for inset effect
  // - Creates recessed/indented appearance typical of neomorphic inputs

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      {/* Outer View - Light Shadow (bottom-right for inset effect) */}
      <View
        style={[
          styles.outerContainer,
          {
            backgroundColor: 'transparent',
            // Light shadow (bottom-right)
            shadowColor: colors.shadowLight,
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: themeMode === 'dark' ? 0.03 : 0.6,
            shadowRadius: 6,
          },
          error && { borderColor: colors.error, borderWidth: 1, borderRadius: 16 },
        ]}
      >
        {/* Inner View - Dark Shadow (top-left for inset effect) */}
        <View
          style={[
            styles.innerContainer,
            {
              backgroundColor: colors.surface,
              // Dark shadow (top-left)
              shadowColor: colors.shadowDark,
              shadowOffset: { width: -2, height: -2 },
              shadowOpacity: themeMode === 'dark' ? 0.6 : 0.15,
              shadowRadius: 6,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              { color: colors.text },
              style,
            ]}
            placeholderTextColor={colors.textSecondary}
            {...props}
          />
        </View>
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  outerContainer: {
    borderRadius: 16,
  },
  innerContainer: {
    borderRadius: 16,
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
