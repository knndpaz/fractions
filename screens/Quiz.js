import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Modal,
} from "react-native";
import PropTypes from "prop-types";
import { Audio } from "expo-av";
import { LevelProgress } from "../utils/levelProgress";
import { DatabaseService, supabase } from "../supabase";
import { useMusic } from "../App";
import { getHelpSteps } from "../data/helpSteps";
import { getProcessedQuestions } from "../data/questions";
import {
  QUIZ_CONFIG,
  ANIMATION_DURATIONS,
  ANIMATION_VALUES,
  SCALING_CONFIG,
  TIMER_THRESHOLDS,
  TIMER_COLORS,
} from "../constants/quizConstants";
import Timer from "../components/Timer";
import ProgressIndicator from "../components/ProgressIndicator";
import LevelIndicator from "../components/LevelIndicator";
import QuizCard from "../components/QuizCard";
import AnswerButtons from "../components/AnswerButtons";
import HelpModal from "../components/HelpModal";
import FeedbackContainer from "../components/FeedbackContainer";
import SparkleEffect from "../components/SparkleEffect";

const { width, height } = Dimensions.get("window");

// Responsive scaling functions
const scale = (size) => (width / SCALING_CONFIG.BASE_WIDTH) * size;
const verticalScale = (size) => (height / SCALING_CONFIG.BASE_HEIGHT) * size;
const moderateScale = (size, factor = SCALING_CONFIG.MODERATE_SCALE_FACTOR) =>
  size + (scale(size) - size) * factor;

export default function Quiz({ navigation, route }) {
  const { switchToBattleMusic, switchToBackgroundMusic } = useMusic();
  const [timer, setTimer] = useState(60);
  const [quizIndex, setQuizIndex] = useState(1);
  const [answerStatus, setAnswerStatus] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [correctSound, setCorrectSound] = useState(null);
  const [wrongSound, setWrongSound] = useState(null);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [currentHelpStep, setCurrentHelpStep] = useState(0);
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

  // Get processed questions from external file
  const questions = useMemo(() => getProcessedQuestions(levelGroup, stage), [levelGroup, stage]);

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

  // Get help steps from external file
  const currentHelpSteps = getHelpSteps(levelGroup, stage, quizIndex);

  const handleHelpNext = () => {
    if (currentHelpStep < currentHelpSteps.length - 1) {
      setCurrentHelpStep(currentHelpStep + 1);
    } else {
      setHelpModalVisible(false);
      setCurrentHelpStep(0);
    }
  };

  const handleHelpPrevious = () => {
    if (currentHelpStep > 0) {
      setCurrentHelpStep(currentHelpStep - 1);
    }
  };

  const handleHelpClose = () => {
    setHelpModalVisible(false);
    setCurrentHelpStep(0);
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

        {/* Sparkle Effect */}
        <SparkleEffect
          sparkleOpacity={sparkleOpacity}
          sparkleRotate={sparkleRotate}
        />

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
            <TouchableOpacity
              style={styles.helpBtn}
              onPress={() => setHelpModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.helpBtnText}>?</Text>
            </TouchableOpacity>
          </View>

          {currentQuestion.question ? (
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>{currentQuestion.question}</Text>
            </View>
          ) : currentQuestion.image ? (
            <View style={styles.imageContainer}>
              <Image
                source={currentQuestion.image}
                style={styles.quizImage}
                resizeMode="contain"
              />
            </View>
          ) : null}
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

        {/* Help Modal */}
        <Modal
          visible={helpModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={handleHelpClose}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.helpModal}>
              <View style={styles.helpHeader}>
                <Text style={styles.helpTitle}>Help Guide</Text>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={handleHelpClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.helpContent}>
                <Text style={styles.helpStepText}>
                  {currentHelpSteps[currentHelpStep]}
                </Text>
                <View style={styles.helpProgress}>
                  {currentHelpSteps.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.helpDot,
                        idx === currentHelpStep && styles.helpDotActive,
                      ]}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.helpNavigation}>
                <TouchableOpacity
                  style={[
                    styles.navBtn,
                    currentHelpStep === 0 && styles.navBtnDisabled,
                  ]}
                  onPress={handleHelpPrevious}
                  disabled={currentHelpStep === 0}
                  activeOpacity={0.8}
                >
                  <Text style={styles.navBtnText}>← Previous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={handleHelpNext}
                  activeOpacity={0.8}
                >
                  <Text style={styles.navBtnText}>
                    {currentHelpStep < currentHelpSteps.length - 1
                      ? "Next →"
                      : "Got it!"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </View>
  );
}

// ...existing styles...
