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

const LevelIndicator = ({ level, stage }) => {
  return (
    <View style={styles.levelContainer}>
      <Text style={styles.levelText}>
        Level {level} - Stage {stage}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  levelContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? PLATFORM_OFFSETS.IOS_LEVEL_TOP : PLATFORM_OFFSETS.ANDROID_LEVEL_TOP,
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: BORDER_RADII.LEVEL_INDICATOR,
    paddingHorizontal: 16,
    paddingVertical: 6,
    zIndex: Z_INDICES.LEVEL_INDICATOR,
    elevation: ELEVATIONS.LEVEL_INDICATOR,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  levelText: {
    fontFamily: "Poppins-Bold",
    fontSize: FONT_SIZES.LEVEL_TEXT,
    color: "#333",
    textAlign: "center",
  },
});

export default LevelIndicator;
