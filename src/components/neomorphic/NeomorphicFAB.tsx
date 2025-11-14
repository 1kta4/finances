import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface NeomorphicFABProps {
  icon: string;
  onPress: () => void;
}

export const NeomorphicFAB: React.FC<NeomorphicFABProps> = ({ icon, onPress }) => {
  const { colors, themeMode } = useTheme();
  const [pressed, setPressed] = useState(false);
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    setPressed(true);
    Animated.timing(scaleAnim, {
      toValue: 0.95,
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

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Dark Shadow Layer */}
      <View
        style={[
          styles.shadowLayer,
          {
            backgroundColor: colors.background,
            shadowColor: pressed ? colors.shadowLight : colors.shadowDark,
            shadowOffset: pressed ? { width: -4, height: -4 } : { width: 6, height: 6 },
            shadowOpacity: themeMode === 'dark' ? 0.8 : 0.2,
            shadowRadius: pressed ? 8 : 12,
          },
        ]}
      >
        {/* Light Shadow Layer */}
        <View
          style={[
            styles.shadowLayer,
            {
              backgroundColor: colors.background,
              shadowColor: pressed ? colors.shadowDark : colors.shadowLight,
              shadowOffset: pressed ? { width: 4, height: 4 } : { width: -6, height: -6 },
              shadowOpacity: themeMode === 'dark' ? 0.1 : 0.8,
              shadowRadius: pressed ? 8 : 12,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
          >
            <Text style={styles.icon}>{icon}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  shadowLayer: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
