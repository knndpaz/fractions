import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import {
  UI_DIMENSIONS,
  FONT_SIZES,
  BORDER_RADII,
  ELEVATIONS,
  Z_INDICES,
  PLATFORM_OFFSETS,
} from "../constants/quizConstants";

const ProgressIndicator = ({ currentQuizIndex, totalQuestions }) => {
  const renderProgressDots = () => {
    const dots = [];
    for (let i = 1; i <= totalQuestions; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.progressDot,
            i <= currentQuizIndex && styles.progressDotActive,
          ]}
        />
      );
    }
    return dots;
  };

  return (
    <View style={styles.progressContainer}>
      <Text style={styles.progressText}>
        {currentQuizIndex}/{totalQuestions}
      </Text>
      <View style={styles.progressDotsContainer}>
        {renderProgressDots()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? PLATFORM_OFFSETS.IOS_PROGRESS_TOP : PLATFORM_OFFSETS.ANDROID_PROGRESS_TOP,
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: BORDER_RADII.PROGRESS_CONTAINER,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: Z_INDICES.PROGRESS_CONTAINER,
    elevation: ELEVATIONS.PROGRESS_CONTAINER,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  progressText: {
    fontFamily: "Poppins-Bold",
    fontSize: FONT_SIZES.LEVEL_TEXT,
    color: "#333",
    textAlign: "center",
    marginBottom: 4,
  },
  progressDotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ddd",
  },
  progressDotActive: {
    backgroundColor: "#4CAF50",
  },
});

export default ProgressIndicator;
