import React, { useState, useEffect, useRef } from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { Audio } from "expo-av";
import { LevelProgress } from "../utils/levelProgress";
import { DatabaseService, supabase } from "../supabase";
import { useMusic } from "../App";

const { width, height } = Dimensions.get("window");

// Responsive scaling functions
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export default function Quiz({ navigation, route }) {
  const { switchToBattleMusic, switchToBackgroundMusic } = useMusic();
  const [timer, setTimer] = useState(60);
  const [quizIndex, setQuizIndex] = useState(1);
  const [answerStatus, setAnswerStatus] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [correctSound, setCorrectSound] = useState(null);
  const [wrongSound, setWrongSound] = useState(null);
  const stage = route?.params?.stage || route?.params?.level || 1;
  const levelGroup = route?.params?.levelGroup || 1;
  const selectedCharacter = route?.params?.selectedCharacter || 0;

  // Animation refs
  const timerPulse = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const buttonScales = useRef(
    Array(4)
      .fill(0)
      .map(() => new Animated.Value(1))
  ).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    switchToBattleMusic();
    animateCardIn();
    startSparkleAnimation();
    return () => {
      switchToBackgroundMusic();
    };
  }, []);

  useEffect(() => {
    const loadSounds = async () => {
      const { sound: correct } = await Audio.Sound.createAsync(
        require("../assets/audio/Check mark sound effect.mp3")
      );
      const { sound: wrong } = await Audio.Sound.createAsync(
        require("../assets/audio/Wrong Answer Sound effect.mp3")
      );
      setCorrectSound(correct);
      setWrongSound(wrong);
    };
    loadSounds();

    return () => {
      if (correctSound) correctSound.unloadAsync();
      if (wrongSound) wrongSound.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (timer > 0 && answerStatus !== "correct") {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);

      // Pulse timer when low
      if (timer <= 10) {
        Animated.sequence([
          Animated.timing(timerPulse, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(timerPulse, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }

      return () => clearInterval(interval);
    } else if (timer === 0) {
      handleTimeUp();
    }
  }, [timer, navigation, stage, levelGroup, answerStatus]);

  const animateCardIn = () => {
    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startSparkleAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleTimeUp = async () => {
    setAnswerStatus("wrong");
    setSelectedIdx(null);

    if (quizIndex < 5) {
      setQuizIndex(quizIndex + 1);
      setTimer(60);
      animateCardIn();
    } else {
      await LevelProgress.completeLevel(stage, levelGroup, false, 0);

      if (stage === 2) {
        const dialogueTexts = {
          1: "Wow, you fixed the food forests! Let's head to the Potion River",
          2: "Wow, you fixed the Potion River! Let's head to the Crystal Caves",
          3: "Thanks to you, everything is whole again! You've mastered adding dissimilar fractions. See you next time for a brand new adventure!",
        };
        navigation.navigate("Dialogue", {
          dialogueText: dialogueTexts[levelGroup] || "Level completed!",
          subtext: "",
          nextScreen: "LevelSelect",
          nextScreenParams: {},
          selectedCharacter: selectedCharacter,
        });
      } else {
        navigation.replace("MapLevels", {
          levelGroup: levelGroup,
        });
      }
    }
  };

  const questions = {
    1: {
      1: Array(5)
        .fill({
          title: "Level 1 - Stage 1",
          fraction1: { numerator: 1, denominator: 2 },
          fraction2: { numerator: 1, denominator: 4 },
          operation: "+",
          answers: ["3/4", "2/6", "1/3", "2/4"],
          correctAnswer: 0,
        })
        .map((q, i) => ({ ...q, title: `${q.title} - Quiz ${i + 1}/5` })),
      2: Array(5)
        .fill({
          title: "Level 1 - Stage 2",
          fraction1: { numerator: 2, denominator: 3 },
          fraction2: { numerator: 1, denominator: 6 },
          operation: "+",
          answers: ["5/6", "3/9", "2/6", "4/6"],
          correctAnswer: 0,
        })
        .map((q, i) => ({ ...q, title: `${q.title} - Quiz ${i + 1}/5` })),
    },
    2: {
      1: Array(5)
        .fill({
          title: "Level 2 - Stage 1",
          fraction1: { numerator: 3, denominator: 5 },
          fraction2: { numerator: 2, denominator: 10 },
          operation: "+",
          answers: ["4/5", "5/15", "8/10", "1/2"],
          correctAnswer: 2,
        })
        .map((q, i) => ({ ...q, title: `${q.title} - Quiz ${i + 1}/5` })),
      2: Array(5)
        .fill({
          title: "Level 2 - Stage 2",
          fraction1: { numerator: 5, denominator: 8 },
          fraction2: { numerator: 1, denominator: 4 },
          operation: "+",
          answers: ["7/8", "6/12", "6/8", "5/12"],
          correctAnswer: 0,
        })
        .map((q, i) => ({ ...q, title: `${q.title} - Quiz ${i + 1}/5` })),
    },
    3: {
      1: Array(5)
        .fill({
          title: "Level 3 - Stage 1",
          fraction1: { numerator: 7, denominator: 8 },
          fraction2: { numerator: 1, denominator: 16 },
          operation: "+",
          answers: ["15/16", "8/24", "9/16", "1"],
          correctAnswer: 0,
        })
        .map((q, i) => ({ ...q, title: `${q.title} - Quiz ${i + 1}/5` })),
      2: Array(5)
        .fill({
          title: "Level 3 - Stage 2",
          fraction1: { numerator: 3, denominator: 4 },
          fraction2: { numerator: 5, denominator: 6 },
          operation: "+",
          answers: ["8/10", "17/12", "1 5/12", "2/3"],
          correctAnswer: 2,
        })
        .map((q, i) => ({ ...q, title: `${q.title} - Quiz ${i + 1}/5` })),
    },
  };

  const currentQuestion =
    questions[levelGroup]?.[stage]?.[quizIndex - 1] || questions[1][1][0];

  const handleAnswerPress = async (selectedIndex) => {
    if (answerStatus) return;

    // Animate button press
    Animated.sequence([
      Animated.timing(buttonScales[selectedIndex], {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScales[selectedIndex], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedIdx(selectedIndex);
    const isCorrect = selectedIndex === currentQuestion.correctAnswer;
    setAnswerStatus(isCorrect ? "correct" : "wrong");

    if (isCorrect && correctSound) {
      await correctSound.replayAsync();
    } else if (!isCorrect && wrongSound) {
      await wrongSound.replayAsync();
    }
  };

  const handleNext = async () => {
    if (answerStatus !== "correct") return;
    if (quizIndex < 5) {
      setQuizIndex(quizIndex + 1);
      setTimer(60);
      setAnswerStatus(null);
      setSelectedIdx(null);
      cardScale.setValue(0.9);
      cardOpacity.setValue(0);
      animateCardIn();
    } else {
      try {
        const result = await LevelProgress.completeLevel(
          levelGroup,
          stage,
          true,
          timer
        );
      } catch (e) {
        console.warn(
          "LevelProgress.completeLevel failed (ignored):",
          e?.message || e
        );
      }
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data?.user?.id;
        if (userId) {
          await DatabaseService.updateStudentProgress(
            userId,
            levelGroup,
            stage,
            true,
            timer
          );
        }
      } catch (e) {
        console.warn(
          "DatabaseService.updateStudentProgress failed (ignored):",
          e?.message || e
        );
      }

      if (stage === 2) {
        const dialogueTexts = {
          1: "Wow, you fixed the food forests! Let's head to the Potion River",
          2: "Wow, you fixed the Potion River! Let's head to the Crystal Caves",
          3: "Yuhooo! You did it! You build the house and restored the whole neighborhood. You are an official fractions hero.",
        };
        navigation.navigate("Dialogue", {
          dialogueText: dialogueTexts[levelGroup] || "Level completed!",
          subtext: "",
          nextScreen: "LevelSelect",
          nextScreenParams: {},
          selectedCharacter: selectedCharacter,
        });
      } else {
        navigation.replace("MapLevels", {
          levelGroup: levelGroup,
        });
      }
    }
  };

  const handleTryAgain = () => {
    setAnswerStatus(null);
    setSelectedIdx(null);
  };

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  const sparkleRotate = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const getTimerColor = () => {
    if (timer <= 10) return "#FF6B6B";
    if (timer <= 30) return "#FFA85C";
    return "#4CAF50";
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../assets/map 1.png")}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Gradient overlay */}
        <View style={styles.gradientOverlay} />

        {/* Animated sparkles */}
        <Animated.View
          style={[
            styles.sparkle,
            {
              top: verticalScale(100),
              left: scale(40),
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
            {
              top: verticalScale(200),
              right: scale(30),
              opacity: sparkleOpacity,
              transform: [{ rotate: sparkleRotate }],
            },
          ]}
        >
          <Text style={styles.sparkleText}>⭐</Text>
        </Animated.View>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        {/* Enhanced Timer - Now more prominent at top center */}
        <Animated.View
          style={[
            styles.timerContainer,
            {
              backgroundColor: getTimerColor(),
              transform: [{ scale: timerPulse }],
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

        {/* Progress dots */}
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4, 5].map((dot) => (
            <View
              key={dot}
              style={[
                styles.progressDot,
                quizIndex === dot && styles.progressDotActive,
                quizIndex > dot && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>

        {/* Level indicator */}
        <View style={styles.levelIndicator}>
          <Text style={styles.levelText}>{currentQuestion.title}</Text>
        </View>

        {/* Enhanced quiz card */}
        <Animated.View
          style={[
            styles.quizCard,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.questionLabel}>Solve the Fraction Problem</Text>
          </View>

          <View style={styles.fractionRow}>
            <View style={styles.fractionCol}>
              <Image
                source={require("../assets/fractionsample 1.png")}
                style={styles.fractionImg}
              />
              <View style={styles.fractionBox}>
                <Text style={styles.fractionNumerator}>
                  {currentQuestion.fraction1.numerator}
                </Text>
                <View style={styles.fractionLine} />
                <Text style={styles.fractionDenominator}>
                  {currentQuestion.fraction1.denominator}
                </Text>
              </View>
            </View>

            <View style={styles.operatorBox}>
              <Text style={styles.operation}>{currentQuestion.operation}</Text>
            </View>

            <View style={styles.fractionCol}>
              <Image
                source={require("../assets/fractionsample 2.png")}
                style={styles.fractionImg}
              />
              <View style={styles.fractionBox}>
                <Text style={styles.fractionNumerator}>
                  {currentQuestion.fraction2.numerator}
                </Text>
                <View style={styles.fractionLine} />
                <Text style={styles.fractionDenominator}>
                  {currentQuestion.fraction2.denominator}
                </Text>
              </View>
            </View>

            <View style={styles.equalsBox}>
              <Text style={styles.equals}>=</Text>
            </View>

            <View style={styles.questionBox}>
              <Text style={styles.questionMark}>?</Text>
            </View>
          </View>
        </Animated.View>

        {/* Answer buttons */}
        <View style={styles.answersContainer}>
          <View style={styles.answersRow}>
            {currentQuestion.answers.map((answer, idx) => {
              const isSelected = selectedIdx === idx;
              const isCorrect = idx === currentQuestion.correctAnswer;

              return (
                <Animated.View
                  key={idx}
                  style={[
                    styles.answerBtnWrapper,
                    { transform: [{ scale: buttonScales[idx] }] },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.answerBtn,
                      isSelected &&
                        answerStatus === "correct" &&
                        isCorrect &&
                        styles.correctAnswer,
                      isSelected &&
                        answerStatus === "wrong" &&
                        styles.wrongAnswer,
                      isSelected && !answerStatus && styles.selectedAnswer,
                    ]}
                    onPress={() => handleAnswerPress(idx)}
                    disabled={!!answerStatus}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.answerText}>{answer}</Text>
                    {isSelected && answerStatus === "correct" && isCorrect && (
                      <Text style={styles.answerIcon}>✓</Text>
                    )}
                    {isSelected && answerStatus === "wrong" && (
                      <Text style={styles.answerIcon}>✗</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* Enhanced feedback indicator */}
        {answerStatus && (
          <Animated.View style={styles.feedbackContainer}>
            <View
              style={[
                styles.feedbackCard,
                answerStatus === "correct"
                  ? styles.feedbackCorrect
                  : styles.feedbackWrong,
              ]}
            >
              <Text style={styles.feedbackIcon}>
                {answerStatus === "correct" ? "🎉" : "💪"}
              </Text>
              <Text style={styles.feedbackTitle}>
                {answerStatus === "correct" ? "Excellent!" : "Try Again!"}
              </Text>
              <Text style={styles.feedbackSubtext}>
                {answerStatus === "correct"
                  ? "You got it right!"
                  : "You can do better!"}
              </Text>
              {answerStatus === "correct" ? (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.nextBtn]}
                  onPress={handleNext}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnText}>
                    {quizIndex < 5 ? "Next Question →" : "Finish Quiz 🎯"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.tryAgainBtn]}
                  onPress={handleTryAgain}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnText}>Try Again 🔄</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? verticalScale(50) : verticalScale(40),
    left: scale(20),
    zIndex: 10,
    width: moderateScale(48),
    height: moderateScale(48),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(24),
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: moderateScale(3),
    borderColor: "#FFA85C",
  },
  backBtnText: {
    fontSize: moderateScale(24),
    color: "#FFA85C",
    fontWeight: "bold",
  },
  timerContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? verticalScale(50) : verticalScale(40),
    alignSelf: "center",
    borderRadius: moderateScale(30),
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    zIndex: 10,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: moderateScale(4),
    borderColor: "#fff",
  },
  timerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  timerIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    resizeMode: "contain",
    tintColor: "#fff",
  },
  timerText: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(32),
    color: "#fff",
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  timerLabel: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(14),
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? verticalScale(110) : verticalScale(100),
    alignSelf: "center",
    flexDirection: "row",
    gap: scale(8),
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  progressDot: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: "#e0e0e0",
    borderWidth: moderateScale(2),
    borderColor: "#bdbdbd",
  },
  progressDotActive: {
    backgroundColor: "#FFA85C",
    borderColor: "#ff8c00",
    width: moderateScale(16),
    height: moderateScale(16),
    borderRadius: moderateScale(8),
  },
  progressDotCompleted: {
    backgroundColor: "#4CAF50",
    borderColor: "#2e7d32",
  },
  levelIndicator: {
    position: "absolute",
    top: Platform.OS === "ios" ? verticalScale(155) : verticalScale(145),
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(16),
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    borderWidth: moderateScale(2),
    borderColor: "#FFA85C",
  },
  levelText: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(14),
    color: "#222",
    textAlign: "center",
  },
  quizCard: {
    marginTop: Platform.OS === "ios" ? verticalScale(220) : verticalScale(210),
    alignSelf: "center",
    width: scale(340),
    maxWidth: "90%",
    backgroundColor: "#fff",
    borderRadius: moderateScale(24),
    padding: moderateScale(24),
    alignItems: "center",
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: moderateScale(4),
    borderColor: "#FFA85C",
  },
  cardHeader: {
    width: "100%",
    marginBottom: verticalScale(16),
    paddingBottom: verticalScale(12),
    borderBottomWidth: moderateScale(2),
    borderBottomColor: "#f0f0f0",
  },
  questionLabel: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(16),
    color: "#666",
    textAlign: "center",
  },
  fractionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: scale(8),
  },
  fractionCol: {
    alignItems: "center",
  },
  fractionImg: {
    width: moderateScale(60),
    height: moderateScale(60),
    marginBottom: verticalScale(8),
    resizeMode: "contain",
  },
  fractionBox: {
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(12),
    minWidth: moderateScale(50),
  },
  fractionNumerator: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(20),
    color: "#222",
  },
  fractionLine: {
    width: "100%",
    height: moderateScale(2),
    backgroundColor: "#222",
    marginVertical: verticalScale(4),
  },
  fractionDenominator: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(20),
    color: "#222",
  },
  operatorBox: {
    backgroundColor: "#FFA85C",
    borderRadius: moderateScale(16),
    width: moderateScale(48),
    height: moderateScale(48),
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  operation: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(28),
    color: "#fff",
  },
  equalsBox: {
    backgroundColor: "#4CAF50",
    borderRadius: moderateScale(16),
    width: moderateScale(48),
    height: moderateScale(48),
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  equals: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(28),
    color: "#fff",
  },
  questionBox: {
    backgroundColor: "#FF6B6B",
    borderRadius: moderateScale(16),
    width: moderateScale(48),
    height: moderateScale(48),
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  questionMark: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(32),
    color: "#fff",
  },
  answersContainer: {
    position: "absolute",
    bottom: verticalScale(140),
    width: "100%",
    paddingHorizontal: scale(20),
  },
  answersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: scale(12),
  },
  answerBtnWrapper: {
    width: "45%",
    maxWidth: scale(160),
  },
  answerBtn: {
    backgroundColor: "#FFA85C",
    borderRadius: moderateScale(16),
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(20),
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    borderWidth: moderateScale(3),
    borderColor: "#fff",
    minHeight: verticalScale(60),
  },
  selectedAnswer: {
    backgroundColor: "#ff9933",
    transform: [{ scale: 0.95 }],
  },
  correctAnswer: {
    backgroundColor: "#4CAF50",
  },
  wrongAnswer: {
    backgroundColor: "#FF6B6B",
  },
  answerText: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(20),
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  answerIcon: {
    position: "absolute",
    top: moderateScale(-8),
    right: moderateScale(-8),
    fontSize: moderateScale(24),
    backgroundColor: "#fff",
    borderRadius: moderateScale(16),
    width: moderateScale(32),
    height: moderateScale(32),
    textAlign: "center",
    lineHeight: moderateScale(32),
    elevation: 4,
  },
  feedbackContainer: {
    position: "absolute",
    bottom: verticalScale(20),
    left: scale(20),
    right: scale(20),
    zIndex: 100,
  },
  feedbackCard: {
    borderRadius: moderateScale(24),
    padding: moderateScale(24),
    alignItems: "center",
    elevation: 16,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    borderWidth: moderateScale(4),
  },
  feedbackCorrect: {
    backgroundColor: "#fff",
    borderColor: "#4CAF50",
  },
  feedbackWrong: {
    backgroundColor: "#fff",
    borderColor: "#FF6B6B",
  },
  feedbackIcon: {
    fontSize: moderateScale(48),
    marginBottom: verticalScale(8),
  },
  feedbackTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(24),
    color: "#222",
    marginBottom: verticalScale(4),
  },
  feedbackSubtext: {
    fontFamily: "Poppins-Regular",
    fontSize: moderateScale(14),
    color: "#666",
    marginBottom: verticalScale(16),
    textAlign: "center",
  },
  actionBtn: {
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(32),
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    minWidth: scale(180),
  },
  nextBtn: {
    backgroundColor: "#4CAF50",
  },
  tryAgainBtn: {
    backgroundColor: "#FF6B6B",
  },
  actionBtnText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(18),
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  sparkle: {
    position: "absolute",
    zIndex: 1,
  },
  sparkleText: {
    fontSize: moderateScale(32),
  },
});
