import React from "react";
import { View, Text, Image, Animated, StyleSheet, Platform } from "react-native";
import {
  TIMER_COLORS,
  TIMER_THRESHOLDS,
  UI_DIMENSIONS,
  FONT_SIZES,
  BORDER_RADII,
  ELEVATIONS,
  Z_INDICES,
  PLATFORM_OFFSETS,
  IMAGE_PATHS,
} from "../constants/quizConstants";

const Timer = ({ timer, pulseAnim }) => {
  const getTimerColor = () => {
    if (timer <= TIMER_THRESHOLDS.LOW) return TIMER_COLORS.LOW;
    if (timer <= TIMER_THRESHOLDS.MEDIUM) return TIMER_COLORS.MEDIUM;
    return TIMER_COLORS.HIGH;
  };

  return (
    <Animated.View
      style={[
        styles.timerContainer,
        {
          backgroundColor: getTimerColor(),
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <View style={styles.timerInner}>
        <Image
          source={require("../assets/clock.png")}
          style={styles.timerIcon}
        />
        <Text style={styles.timerText}>{timer}</Text>
        <Text style={styles.timerLabel}>sec</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  timerContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? PLATFORM_OFFSETS.IOS_TOP_OFFSET : PLATFORM_OFFSETS.ANDROID_TOP_OFFSET,
    alignSelf: "center",
    borderRadius: BORDER_RADII.TIMER_CONTAINER,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: Z_INDICES.TIMER_CONTAINER,
    elevation: ELEVATIONS.TIMER_CONTAINER,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 3,
    borderColor: "#fff",
  },
  timerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timerIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
    tintColor: "#fff",
  },
  timerText: {
    fontFamily: "Poppins-Bold",
    fontSize: FONT_SIZES.TIMER,
    color: "#fff",
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  timerLabel: {
    fontFamily: "Poppins-Bold",
    fontSize: FONT_SIZES.TIMER_LABEL,
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default Timer;
