import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
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

  const isActive = selected || pressed;

  return (
    <View
      style={[
        styles.outerShadow,
        {
          backgroundColor: colors.background,
          shadowColor: isActive ? colors.shadowLight : colors.shadowDark,
          shadowOffset: isActive ? { width: -2, height: -2 } : { width: 3, height: 3 },
          shadowOpacity: themeMode === 'dark' ? 0.6 : 0.15,
          shadowRadius: 6,
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
          style={[
            styles.chip,
            {
              backgroundColor: selected ? colors.accent : colors.background,
            },
          ]}
          onPress={onPress}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          activeOpacity={1}
        >
          <Text
            style={[
              styles.text,
              { color: selected ? '#FFFFFF' : colors.text },
              textStyle,
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
