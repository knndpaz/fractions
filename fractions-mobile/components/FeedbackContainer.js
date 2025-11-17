import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import {
  UI_DIMENSIONS,
  FONT_SIZES,
  BORDER_RADII,
  ELEVATIONS,
  Z_INDICES,
} from "../constants/quizConstants";

const FeedbackContainer = ({
  visible,
  isCorrect,
  onContinue,
  fadeAnim,
  slideAnim,
}) => {
  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.feedbackContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.feedbackCard, isCorrect ? styles.correctCard : styles.incorrectCard]}>
        <Text style={styles.feedbackTitle}>
          {isCorrect ? "Correct!" : "Incorrect!"}
        </Text>
        <Text style={styles.feedbackSubtext}>
          {isCorrect ? "Great job!" : "Try again next time."}
        </Text>
        <TouchableOpacity
          style={[styles.continueButton, isCorrect ? styles.correctButton : styles.incorrectButton]}
          onPress={onContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  feedbackContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: Z_INDICES.FEEDBACK_CONTAINER,
  },
  feedbackCard: {
    borderRadius: BORDER_RADII.FEEDBACK_CARD,
    padding: 24,
    width: UI_DIMENSIONS.QUIZ_CARD_WIDTH,
    minHeight: UI_DIMENSIONS.FEEDBACK_CARD_HEIGHT,
    alignItems: "center",
    elevation: ELEVATIONS.FEEDBACK_CARD,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    borderWidth: 3,
    borderColor: "#fff",
  },
  correctCard: {
    backgroundColor: "#4CAF50",
  },
  incorrectCard: {
    backgroundColor: "#FF6B6B",
  },
  feedbackTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: FONT_SIZES.FEEDBACK_TITLE,
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  feedbackSubtext: {
    fontFamily: "Poppins-Regular",
    fontSize: FONT_SIZES.FEEDBACK_SUBTEXT,
    color: "#fff",
    marginBottom: 24,
    textAlign: "center",
  },
  continueButton: {
    borderRadius: BORDER_RADII.ANSWER_BUTTON,
    paddingHorizontal: 24,
    paddingVertical: 12,
    elevation: ELEVATIONS.ANSWER_BUTTON,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  correctButton: {
    backgroundColor: "#66BB6A",
  },
  incorrectButton: {
    backgroundColor: "#EF5350",
  },
  continueButtonText: {
    fontFamily: "Poppins-Bold",
    fontSize: FONT_SIZES.ACTION_BUTTON_TEXT,
    color: "#fff",
  },
});

export default FeedbackContainer;
