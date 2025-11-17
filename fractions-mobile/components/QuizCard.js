import React from "react";
import { View, Text, Image, StyleSheet, Platform } from "react-native";
import {
  UI_DIMENSIONS,
  FONT_SIZES,
  BORDER_RADII,
  ELEVATIONS,
  Z_INDICES,
  PLATFORM_OFFSETS,
} from "../constants/quizConstants";

const QuizCard = ({ question, image }) => {
  return (
    <View style={styles.quizCard}>
      <Text style={styles.questionLabel}>Question:</Text>
      <Text style={styles.questionText}>{question}</Text>
      {image && (
        <Image
          source={image}
          style={styles.questionImage}
          resizeMode="contain"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  quizCard: {
    position: "absolute",
    top: Platform.OS === "ios" ? PLATFORM_OFFSETS.IOS_QUIZ_TOP : PLATFORM_OFFSETS.ANDROID_QUIZ_TOP,
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: BORDER_RADII.QUIZ_CARD,
    padding: 20,
    width: UI_DIMENSIONS.QUIZ_CARD_WIDTH,
    minHeight: UI_DIMENSIONS.QUIZ_CARD_HEIGHT,
    zIndex: Z_INDICES.QUIZ_CARD,
    elevation: ELEVATIONS.QUIZ_CARD,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 3,
    borderColor: "#e0e0e0",
  },
  questionLabel: {
    fontFamily: "Poppins-Bold",
    fontSize: FONT_SIZES.QUESTION_LABEL,
    color: "#333",
    marginBottom: 8,
  },
  questionText: {
    fontFamily: "Poppins-Regular",
    fontSize: FONT_SIZES.ANSWER_TEXT,
    color: "#555",
    lineHeight: 24,
    marginBottom: 16,
  },
  questionImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginTop: 8,
  },
});

export default QuizCard;
