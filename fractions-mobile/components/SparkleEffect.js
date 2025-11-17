import React from "react";
import { View, StyleSheet, Animated, Text } from "react-native";
import {
  ANIMATION_DURATIONS,
  Z_INDICES,
  SPARKLE_POSITIONS,
} from "../constants/quizConstants";

const SparkleEffect = ({ sparkleOpacity, sparkleRotate }) => {
  return (
    <View style={styles.sparkleContainer}>
      <Animated.View
        style={[
          styles.sparkle,
          styles.sparkleTopLeft,
          {
            opacity: sparkleOpacity,
            transform: [{ rotate: sparkleRotate }],
          },
        ]}
      >
        <Text style={styles.sparkleText}>✨</Text>
      </Animated.View>
      <Animated.View
        style={[
          styles.sparkle,
          styles.sparkleTopRight,
          {
            opacity: sparkleOpacity,
            transform: [{ rotate: sparkleRotate }],
          },
        ]}
      >
        <Text style={styles.sparkleText}>⭐</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  sparkleContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: Z_INDICES.SPARKLE,
    pointerEvents: "none",
  },
  sparkle: {
    position: "absolute",
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  sparkleTopLeft: {
    top: SPARKLE_POSITIONS.TOP_LEFT.top,
    left: SPARKLE_POSITIONS.TOP_LEFT.left,
  },
  sparkleTopRight: {
    top: SPARKLE_POSITIONS.TOP_RIGHT.top,
    right: SPARKLE_POSITIONS.TOP_RIGHT.right,
  },
  sparkleText: {
    fontSize: 28,
  },
});

export default SparkleEffect;
