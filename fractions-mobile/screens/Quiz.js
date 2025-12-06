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
  ScrollView,
} from "react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { LevelProgress } from "../utils/levelProgress";
import { DatabaseService, supabase } from "../supabase";
import { useMusic } from "../App";
import { helpSteps } from "../data/helpSteps";
import { questions, getProcessedQuestions } from "../data/questions";
import {
  QUIZ_CONFIG,
  ANIMATION_DURATIONS,
  ANIMATION_VALUES,
  SCALING_CONFIG,
  TIMER_THRESHOLDS,
  TIMER_COLORS,
  BUTTON_SCALES_COUNT,
  SPARKLE_POSITIONS,
  UI_DIMENSIONS,
  FONT_SIZES,
  BORDER_RADII,
  ELEVATIONS,
  OPACITIES,
  Z_INDICES,
  PLATFORM_OFFSETS,
  ANSWER_LAYOUT,
  HELP_CONFIG,
  SOUND_PATHS,
  IMAGE_PATHS,
  ASSET_FOLDERS,
} from "../constants/quizConstants";

const { width, height } = Dimensions.get("window");

// Enhanced responsive scaling functions with max constraints
const scale = (size) => {
  const scaledSize = (width / SCALING_CONFIG.BASE_WIDTH) * size;
  // Cap scaling for larger screens
  return Math.min(scaledSize, size * 1.5);
};

const verticalScale = (size) => {
  const scaledSize = (height / SCALING_CONFIG.BASE_HEIGHT) * size;
  // Cap scaling for larger screens
  return Math.min(scaledSize, size * 1.5);
};

const moderateScale = (size, factor = SCALING_CONFIG.MODERATE_SCALE_FACTOR) => {
  const scaled = size + (scale(size) - size) * factor;
  // Cap scaling for larger screens
  return Math.min(scaled, size * 1.3);
};

// Check if device is tablet/desktop
const isLargeScreen = width > 768;
const isDesktop = width > 1024;

export default function Quiz({ navigation, route }) {
  const { switchToBattleMusic, switchToBackgroundMusic, battleMusic } = useMusic();
  const [timer, setTimer] = useState(60);
  const [quizIndex, setQuizIndex] = useState(1);
  const [answerStatus, setAnswerStatus] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [correctSound, setCorrectSound] = useState(null);
  const [wrongSound, setWrongSound] = useState(null);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [currentHelpStep, setCurrentHelpStep] = useState(0);
  const [helpStepsCompleted, setHelpStepsCompleted] = useState(false);
  const [wrongAnswersCount, setWrongAnswersCount] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [originalMusicVolume, setOriginalMusicVolume] = useState(1.0);
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

  // Process questions with shuffling for Level 2 Stage 2
  const processedQuestions = useMemo(
    () => getProcessedQuestions(questions),
    []
  );

  // Get current question and help steps
  const currentQuestion =
    processedQuestions[levelGroup]?.[stage]?.[quizIndex - 1] ||
    processedQuestions[1][1][0];

  const currentHelpSteps =
    helpSteps[levelGroup]?.[stage]?.[quizIndex] || helpSteps[1][1][1];

  useEffect(() => {
    switchToBattleMusic();
    animateCardIn();
    startSparkleAnimation();
    return () => {
      switchToBackgroundMusic();
      Speech.stop();
      restoreMusicVolume();
    };
  }, []);

  // Speak help step when modal opens or step changes
  useEffect(() => {
    if (helpModalVisible && currentHelpSteps[currentHelpStep]) {
      // Add a small delay to let the modal animation complete
      const timer = setTimeout(() => {
        speakText(currentHelpSteps[currentHelpStep]);
      }, 300);
      return () => clearTimeout(timer);
    }
    return () => {
      if (!helpModalVisible) {
        Speech.stop();
        setIsSpeaking(false);
        restoreMusicVolume();
      }
    };
  }, [helpModalVisible, currentHelpStep]);

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
      await LevelProgress.recordAnswer(levelGroup, stage, true);
      setTimeout(() => {
        setHelpModalVisible(true);
        setCurrentHelpStep(0);
        setHelpStepsCompleted(false);
      }, 500);
    } else if (!isCorrect && wrongSound) {
      await wrongSound.replayAsync();
      setWrongAnswersCount((prev) => prev + 1);
      await LevelProgress.recordAnswer(levelGroup, stage, false);
    }
  };

  const handleNext = async () => {
    if (answerStatus !== "correct" || !helpStepsCompleted) return;
    if (quizIndex < 5) {
      setQuizIndex(quizIndex + 1);
      setTimer(60);
      setAnswerStatus(null);
      setSelectedIdx(null);
      setHelpStepsCompleted(false);
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
    setHelpStepsCompleted(false);
  };

  const lowerMusicVolume = async () => {
    if (battleMusic) {
      try {
        const status = await battleMusic.getStatusAsync();
        if (status.isLoaded && status.volume !== undefined) {
          setOriginalMusicVolume(status.volume);
          await battleMusic.setVolumeAsync(0.2); // Lower to 20%
          console.log('Battle music volume lowered to 0.2');
        }
      } catch (error) {
        console.log('Error lowering music volume:', error);
      }
    }
  };

  const restoreMusicVolume = async () => {
    if (battleMusic) {
      try {
        await battleMusic.setVolumeAsync(originalMusicVolume);
        console.log('Battle music volume restored to', originalMusicVolume);
      } catch (error) {
        console.log('Error restoring music volume:', error);
      }
    }
  };

  const speakText = async (text) => {
    // Stop any ongoing speech
    await Speech.stop();
    setIsSpeaking(true);
    
    // Lower music volume when speech starts
    await lowerMusicVolume();
    
    Speech.speak(text, {
      language: 'en',
      pitch: 1.0,
      rate: 0.85,
      onDone: async () => {
        setIsSpeaking(false);
        await restoreMusicVolume();
      },
      onStopped: async () => {
        setIsSpeaking(false);
        await restoreMusicVolume();
      },
      onError: async () => {
        setIsSpeaking(false);
        await restoreMusicVolume();
      },
    });
  };

  const handleHelpNext = async () => {
    // Stop speech when moving to next step
    await Speech.stop();
    await restoreMusicVolume();
    setIsSpeaking(false);
    
    if (currentHelpStep < currentHelpSteps.length - 1) {
      const nextStep = currentHelpStep + 1;
      setCurrentHelpStep(nextStep);
      // Auto-play speech will be triggered by useEffect
    } else {
      setHelpModalVisible(false);
      setCurrentHelpStep(0);
      setHelpStepsCompleted(true);
    }
  };

  const handleHelpPrevious = async () => {
    // Stop speech when moving to previous step
    await Speech.stop();
    await restoreMusicVolume();
    setIsSpeaking(false);
    
    if (currentHelpStep > 0) {
      const prevStep = currentHelpStep - 1;
      setCurrentHelpStep(prevStep);
      // Auto-play speech will be triggered by useEffect
    }
  };

  const handleHelpClose = async () => {
    if (currentHelpStep === currentHelpSteps.length - 1) {
      await Speech.stop();
      await restoreMusicVolume();
      setHelpModalVisible(false);
      setCurrentHelpStep(0);
      setHelpStepsCompleted(true);
      setIsSpeaking(false);
    }
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
        <View style={styles.gradientOverlay} />

        <Animated.View
          style={[
            styles.sparkle,
            {
              opacity: sparkleOpacity,
              transform: [{ rotate: sparkleRotate }],
            },
          ]}
        >
          <Text style={styles.sparkleText}>✨</Text>
        </Animated.View>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

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

        <View style={styles.levelIndicator}>
          <Text style={styles.levelText}>{currentQuestion.title}</Text>
        </View>

        {/* ScrollView wrapper for better responsiveness */}
        <ScrollView
          style={styles.contentScrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
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
              <Text style={styles.questionLabel}>
                Solve the Fraction Problem
              </Text>
            </View>

            {currentQuestion.question ? (
              <View style={styles.questionContainer}>
                <Text style={styles.questionText}>
                  {currentQuestion.question}
                </Text>
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
                      {isSelected &&
                        answerStatus === "correct" &&
                        isCorrect && <Text style={styles.answerIcon}>✓</Text>}
                      {isSelected && answerStatus === "wrong" && (
                        <Text style={styles.answerIcon}>✗</Text>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </View>

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
                    ? helpStepsCompleted
                      ? "You got it right!"
                      : "Review the solution steps..."
                    : "You can do better!"}
                </Text>
                {answerStatus === "correct" && helpStepsCompleted ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.nextBtn]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnText}>
                      {quizIndex < 5 ? "Next Question →" : "Finish Quiz 🎯"}
                    </Text>
                  </TouchableOpacity>
                ) : answerStatus === "wrong" ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.tryAgainBtn]}
                    onPress={handleTryAgain}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnText}>Try Again 🔄</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </Animated.View>
          )}
        </ScrollView>

        <Modal
          visible={helpModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={handleHelpClose}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.helpModal}>
              <View style={styles.helpHeader}>
                <TouchableOpacity
                  style={styles.speakerBtn}
                  onPress={() => {
                    if (isSpeaking) {
                      Speech.stop();
                      setIsSpeaking(false);
                    } else {
                      speakText(currentHelpSteps[currentHelpStep]);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.speakerBtnText}>{isSpeaking ? '🔊' : '🔈'}</Text>
                </TouchableOpacity>
                <Text style={styles.helpTitle}>Solution Steps</Text>
                {currentHelpStep === currentHelpSteps.length - 1 && (
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={handleHelpClose}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.closeBtnText}>✓</Text>
                  </TouchableOpacity>
                )}
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
    width: moderateScale(44),
    height: moderateScale(44),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(22),
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: moderateScale(2),
    borderColor: "#FFA85C",
  },
  backBtnText: {
    fontSize: moderateScale(22),
    color: "#FFA85C",
    fontWeight: "bold",
  },
  timerContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? verticalScale(50) : verticalScale(40),
    alignSelf: "center",
    borderRadius: moderateScale(25),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    zIndex: 10,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: moderateScale(3),
    borderColor: "#fff",
  },
  timerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  timerIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
    resizeMode: "contain",
    tintColor: "#fff",
  },
  timerText: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(28),
    color: "#fff",
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  timerLabel: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(12),
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? verticalScale(105) : verticalScale(95),
    alignSelf: "center",
    flexDirection: "row",
    gap: scale(6),
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(16),
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  progressDot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: "#e0e0e0",
    borderWidth: moderateScale(1.5),
    borderColor: "#bdbdbd",
  },
  progressDotActive: {
    backgroundColor: "#FFA85C",
    borderColor: "#ff8c00",
    width: moderateScale(14),
    height: moderateScale(14),
    borderRadius: moderateScale(7),
  },
  progressDotCompleted: {
    backgroundColor: "#4CAF50",
    borderColor: "#2e7d32",
  },
  levelIndicator: {
    position: "absolute",
    top: Platform.OS === "ios" ? verticalScale(145) : verticalScale(135),
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(14),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
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
    fontSize: moderateScale(12),
    color: "#222",
    textAlign: "center",
  },
  contentScrollView: {
    flex: 1,
    marginTop: Platform.OS === "ios" ? verticalScale(185) : verticalScale(175),
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: verticalScale(150),
    minHeight: height - verticalScale(185),
  },
  quizCard: {
    alignSelf: "center",
    width: isDesktop ? Math.min(scale(320), 500) : scale(320),
    maxWidth: "88%",
    backgroundColor: "#fff",
    borderRadius: moderateScale(20),
    padding: moderateScale(12),
    alignItems: "center",
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: moderateScale(3),
    borderColor: "#FFA85C",
    marginBottom: verticalScale(10),
  },
  cardHeader: {
    width: "100%",
    marginBottom: verticalScale(8),
    paddingBottom: verticalScale(8),
    borderBottomWidth: moderateScale(2),
    borderBottomColor: "#f0f0f0",
  },
  questionLabel: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(14),
    color: "#666",
    textAlign: "center",
  },
  questionContainer: {
    padding: moderateScale(6),
    alignItems: "center",
  },
  questionText: {
    fontFamily: "Poppins-Regular",
    fontSize: moderateScale(13),
    color: "#333",
    textAlign: "center",
    lineHeight: moderateScale(20),
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: verticalScale(4),
  },
  quizImage: {
    width: isDesktop ? Math.min(scale(260), 400) : scale(260),
    height: isDesktop ? Math.min(verticalScale(120), 180) : verticalScale(120),
    borderRadius: moderateScale(14),
    marginBottom: verticalScale(8),
  },
  answersContainer: {
    width: "100%",
    paddingHorizontal: scale(20),
    marginTop: verticalScale(8),
    marginBottom: verticalScale(8),
  },
  answersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: isLargeScreen ? scale(15) : scale(10),
  },
  answerBtnWrapper: {
    width: isDesktop ? "22%" : isLargeScreen ? "30%" : "45%",
    maxWidth: isDesktop ? 180 : scale(150),
    minWidth: isDesktop ? 140 : scale(120),
  },
  answerBtn: {
    backgroundColor: "#FFA85C",
    borderRadius: moderateScale(14),
    paddingVertical: isDesktop ? verticalScale(14) : verticalScale(12),
    paddingHorizontal: isDesktop ? scale(20) : scale(16),
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    borderWidth: moderateScale(2),
    borderColor: "#fff",
    minHeight: isDesktop ? verticalScale(60) : verticalScale(52),
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
    fontSize: moderateScale(18),
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  answerIcon: {
    position: "absolute",
    top: moderateScale(-6),
    right: moderateScale(-6),
    fontSize: moderateScale(20),
    backgroundColor: "#fff",
    borderRadius: moderateScale(14),
    width: moderateScale(28),
    height: moderateScale(28),
    textAlign: "center",
    lineHeight: moderateScale(28),
    elevation: 4,
  },
  feedbackContainer: {
    width: "100%",
    paddingHorizontal: scale(20),
    marginTop: verticalScale(5),
    marginBottom: verticalScale(40),
    zIndex: 100,
  },
  feedbackCard: {
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    alignItems: "center",
    elevation: 16,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    borderWidth: moderateScale(3),
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
    fontSize: moderateScale(32),
    marginBottom: verticalScale(4),
  },
  feedbackTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(18),
    color: "#222",
    marginBottom: verticalScale(2),
  },
  feedbackSubtext: {
    fontFamily: "Poppins-Regular",
    fontSize: moderateScale(11),
    color: "#666",
    marginBottom: verticalScale(8),
    textAlign: "center",
  },
  actionBtn: {
    borderRadius: moderateScale(16),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(28),
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    minWidth: scale(160),
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
    fontSize: moderateScale(16),
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  sparkle: {
    position: "absolute",
    top: verticalScale(200),
    left: scale(30),
    zIndex: 1,
  },
  sparkleText: {
    fontSize: moderateScale(28),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  helpModal: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
    width: isDesktop ? Math.min(scale(400), 500) : scale(300),
    maxWidth: "88%",
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    borderWidth: moderateScale(3),
    borderColor: "#FFA85C",
  },
  helpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(16),
    paddingBottom: verticalScale(10),
    borderBottomWidth: moderateScale(2),
    borderBottomColor: "#f0f0f0",
  },
  helpTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(18),
    color: "#222",
  },
  speakerBtn: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  speakerBtnText: {
    fontSize: moderateScale(14),
  },
  closeBtn: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: moderateScale(16),
    color: "#fff",
    fontWeight: "bold",
  },
  helpContent: {
    alignItems: "center",
    marginBottom: verticalScale(16),
    minHeight: verticalScale(120),
  },
  helpStepText: {
    fontFamily: "Poppins-Regular",
    fontSize: moderateScale(13),
    color: "#333",
    textAlign: "center",
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(14),
    paddingHorizontal: scale(8),
  },
  helpProgress: {
    flexDirection: "row",
    gap: scale(6),
  },
  helpDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: "#e0e0e0",
  },
  helpDotActive: {
    backgroundColor: "#FFA85C",
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
  },
  helpNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: scale(12),
  },
  navBtn: {
    flex: 1,
    backgroundColor: "#FFA85C",
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  navBtnDisabled: {
    backgroundColor: "#ccc",
    elevation: 0,
    shadowOpacity: 0,
  },
  navBtnText: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(14),
    color: "#fff",
  },
});
