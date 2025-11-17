import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";
import {
  UI_DIMENSIONS,
  FONT_SIZES,
  BORDER_RADII,
  ELEVATIONS,
  ANSWER_LAYOUT,
} from "../constants/quizConstants";

const { width: screenWidth } = Dimensions.get("window");

const AnswerButtons = ({ answers, onAnswerPress, buttonScales, disabled }) => {
  const renderAnswerButton = (answer, index) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.answerButton,
        {
          transform: [{ scale: buttonScales[index] }],
        },
      ]}
      onPress={() => !disabled && onAnswerPress(index)}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={styles.answerText}>{answer}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.answerContainer}>
      <View style={styles.answerRow}>
        {answers.slice(0, 2).map((answer, index) => renderAnswerButton(answer, index))}
      </View>
      <View style={styles.answerRow}>
        {answers.slice(2, 4).map((answer, index) => renderAnswerButton(answer, index + 2))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  answerContainer: {
    position: "absolute",
    bottom: ANSWER_LAYOUT.CONTAINER_BOTTOM,
    alignSelf: "center",
    gap: ANSWER_LAYOUT.GAP,
  },
  answerRow: {
    flexDirection: "row",
    gap: ANSWER_LAYOUT.GAP,
  },
  answerButton: {
    backgroundColor: "#fff",
    borderRadius: BORDER_RADII.ANSWER_BUTTON,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: UI_DIMENSIONS.ANSWER_BUTTON_WIDTH,
    height: UI_DIMENSIONS.ANSWER_BUTTON_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    elevation: ELEVATIONS.ANSWER_BUTTON,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  answerText: {
    fontFamily: "Poppins-Bold",
    fontSize: FONT_SIZES.ANSWER_TEXT,
    color: "#333",
    textAlign: "center",
  },
});

export default AnswerButtons;
