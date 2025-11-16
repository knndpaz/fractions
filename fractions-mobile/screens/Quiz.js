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
import { Audio } from "expo-av";
import { LevelProgress } from "../utils/levelProgress";
import { DatabaseService, supabase } from "../supabase";
import { useMusic } from "../App";

// Shuffle function
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

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

  const questions = useMemo(() => {
    const baseQuestions = {
      1: {
        1: [
          {
            title: "Level 1 - Stage 1 - Quiz 1/5",
            image: require("../assets/Easy Stage 1/1_20251113_172858_0000.png"),
            answers: ["3/4", "2/6", "1/3", "2/4"],
            correctAnswer: 0,
          },
          {
            title: "Level 1 - Stage 1 - Quiz 2/5",
            image: require("../assets/Easy Stage 1/2_20251113_172858_0001.png"),
            answers: ["5/6", "3/9", "2/6", "4/6"],
            correctAnswer: 0,
          },
          {
            title: "Level 1 - Stage 1 - Quiz 3/5",
            image: require("../assets/Easy Stage 1/3_20251113_172858_0002.png"),
            answers: ["4/5", "5/15", "5/8", "1/2"],
            correctAnswer: 2,
          },
          {
            title: "Level 1 - Stage 1 - Quiz 4/5",
            image: require("../assets/Easy Stage 1/4_20251113_172858_0003.png"),
            answers: ["7/8", "6/12", "6/8", "1/2"],
            correctAnswer: 3,
          },
          {
            title: "Level 1 - Stage 1 - Quiz 5/5",
            image: require("../assets/Easy Stage 1/5_20251113_172858_0004.png"),
            answers: ["15/16", "8/24", "9/16", "1"],
            correctAnswer: 3,
          },
        ],
        2: [
          {
            title: "Level 1 - Stage 2 - Quiz 1/5",
            image: require("../assets/Easy Stage 2/6_20251113_172858_0005.png"),
            answers: ["2/5", "1/3", "3/5", "1/2"],
            correctAnswer: 0,
          },
          {
            title: "Level 1 - Stage 2 - Quiz 2/5",
            image: require("../assets/Easy Stage 2/7_20251113_172858_0006.png"),
            answers: ["1/2", "3/4", "2/3", "1/4"],
            correctAnswer: 0,
          },
          {
            title: "Level 1 - Stage 2 - Quiz 3/5",
            image: require("../assets/Easy Stage 2/8_20251113_172858_0007.png"),
            answers: ["1/2", "2/5", "3/4", "1/3"],
            correctAnswer: 0,
          },
          {
            title: "Level 1 - Stage 2 - Quiz 4/5",
            image: require("../assets/Easy Stage 2/9_20251113_172858_0008.png"),
            answers: ["1/2", "3/5", "2/3", "1/4"],
            correctAnswer: 0,
          },
          {
            title: "Level 1 - Stage 2 - Quiz 5/5",
            image: require("../assets/Easy Stage 2/10_20251113_172858_0009.png"),
            answers: ["13/10", "1 1/5", "11/10", "3/2"],
            correctAnswer: 0,
          },
        ],
      },
      2: {
        1: [
          {
            title: "Level 2 - Stage 1 - Quiz 1/5",
            image: require("../assets/Medium Stage 1/12_20251113_172004_0011.png"),
            answers: ["8/10", "2/3", "5/15", "1/2"],
            correctAnswer: 1,
          },
          {
            title: "Level 2 - Stage 1 - Quiz 2/5",
            image: require("../assets/Medium Stage 1/13_20251113_172004_0012.png"),
            answers: ["3/5", "1", "9/10", "1/2"],
            correctAnswer: 1,
          },
          {
            title: "Level 2 - Stage 1 - Quiz 3/5",
            image: require("../assets/Medium Stage 1/14_20251113_172004_0013.png"),
            answers: ["11/15", "2/3", "7/15", "1/2"],
            correctAnswer: 1,
          },
          {
            title: "Level 2 - Stage 1 - Quiz 4/5",
            image: require("../assets/Medium Stage 1/15_20251113_172004_0014.png"),
            answers: ["3/5", "4/5", "7/10", "2/3"],
            correctAnswer: 1,
          },
          {
            title: "Level 2 - Stage 1 - Quiz 5/5",
            image: require("../assets/Medium Stage 1/16_20251113_172004_0015.png"),
            answers: ["5/8", "3/4", "11/12", "1/2"],
            correctAnswer: 1,
          },
        ],
        2: [
          {
            title: "Level 2 - Stage 2 - Quiz 1/5",
            image: require("../assets/Medium Stage 2/17_20251113_172004_0016.png"),
            answers: ["9/14", "8/13", "10/15", "7/12"],
            correctAnswer: 0,
          },
          {
            title: "Level 2 - Stage 2 - Quiz 2/5",
            image: require("../assets/Medium Stage 2/18_20251113_172004_0017.png"),
            answers: ["3/4", "4/5", "5/6", "7/9"],
            correctAnswer: 1,
          },
          {
            title: "Level 2 - Stage 2 - Quiz 3/5",
            image: require("../assets/Medium Stage 2/19_20251113_172004_0018.png"),
            answers: ["11/15", "10/14", "12/16", "9/13"],
            correctAnswer: 0,
          },
          {
            title: "Level 2 - Stage 2 - Quiz 4/5",
            image: require("../assets/Medium Stage 2/20_20251113_172004_0019.png"),
            answers: ["7/10", "6/9", "8/11", "5/8"],
            correctAnswer: 0,
          },
          {
            title: "Level 2 - Stage 2 - Quiz 5/5",
            image: require("../assets/Medium Stage 2/21_20251113_172004_0020.png"),
            answers: ["3/4", "2/3", "4/5", "5/7"],
            correctAnswer: 0,
          },
        ],
      },
      3: {
        1: [
          {
            title: "Level 3 - Stage 1 - Quiz 1/5",
            question: "In Tagum National Trade School, a teacher used 5/12 class time for discussion and 1/8 for a short quiz. How much of the class time was used in total?",
            answers: ["7/20", "13/24", "11/24", "5/12"],
            correctAnswer: 1,
          },
          {
            title: "Level 3 - Stage 1 - Quiz 2/5",
            question: "At Energy Park, a group of students cleaned 7/16 of the garden area in the morning and 1/8 in the afternoon. How much of the garden area did they clean altogether?",
            answers: ["15/32", "11/16", "9/16", "7/16"],
            correctAnswer: 2,
          },
          {
            title: "Level 3 - Stage 1 - Quiz 3/5",
            question: "During a tree planting at New City Hall, volunteers planted 3/10 seedlings in the first hour and 2/15 in the second hour. How many parts of the seedlings were planted in all?",
            answers: ["5/25", "7/30", "3/10", "13/30"],
            correctAnswer: 3,
          },
          {
            title: "Level 3 - Stage 1 - Quiz 4/5",
            question: "A Tagum City National High School student spent 5/18 reviewing Math and 1/6 studying Science. How much of her day did she spend studying?",
            answers: ["11/36", "4/9", "7/18", "5/18"],
            correctAnswer: 1,
          },
          {
            title: "Level 3 - Stage 1 - Quiz 5/5",
            question: "At the Tagum Public Market, a vendor sold 2/9 of his bananas in the morning and 3/18 in the afternoon. How many of his bananas were sold in total?",
            answers: ["5/27", "11/36", "7/18", "2/9"],
            correctAnswer: 2,
          },
        ],
        2: [
          {
      title: "Level 3 - Stage 2 - Quiz 1/5",
      question: "In La Filipina, a tricycle traveled 7/20 of its route before and 3/10 after lunch. How much of the route did the tricycle travel altogether?",
      answers: ["1/2", "13/20", "4/5", "9/20"],
      correctAnswer: 1,
    },
    {
      title: "Level 3 - Stage 2 - Quiz 2/5",
      question: "During the Tagum City Festival, dancers practiced 5/16 of the total dance steps on Monday and 3/8 on Tuesday. How many of the dance steps have been practiced already?",
      answers: ["1/2", "13/16", "11/16", "7/16"],
      correctAnswer: 2,
    },
    {
      title: "Level 3 - Stage 2 - Quiz 3/5",
      question: "At Tagum City Riverbank, the cleanup team finished 4/15 of the river section in the morning and 1/10 in the afternoon. How much of the riverbank did they clean altogether?",
      answers: ["7/30", "2/5", "3/10", "11/30"],
      correctAnswer: 3,
    },
    {
      title: "Level 3 - Stage 2 - Quiz 4/5",
      question: "A student from DNHS read 7/12 of her book in the library and 1/6 at home. How much of the book did she finish reading?",
      answers: ["2/3", "3/4", "5/6", "1/2"],
      correctAnswer: 1,
    },
    {
      title: "Level 3 - Stage 2 - Quiz 5/5",
      question: "In a barangay sports event in Apokon, a player completed 9/20 of his target laps in the first round and 1/10 in the second round. How many parts of his total laps did he complete altogether?",
      answers: ["7/20", "13/20", "11/20", "2/5"],
      correctAnswer: 2,
    },
        ],
      },
    };

    // For Level 2 Stage 2, shuffle answers and update correctAnswer
    const level2Stage2 = baseQuestions[2][2];
    level2Stage2.forEach((quiz) => {
      const originalAnswers = [...quiz.answers];
      const originalCorrectIndex = quiz.correctAnswer;
      const shuffled = shuffleArray(originalAnswers);
      quiz.answers = shuffled;
      const correctString = originalAnswers[originalCorrectIndex];
      quiz.correctAnswer = shuffled.indexOf(correctString);
    });

    return baseQuestions;
  }, []);

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

  const helpSteps = {
    1: {
      1: {
        1: [
          "Step 1: Set the fractions in vertical form\n\n1/2 + 1/4",
          "Step 2: Find the LCD\n\nMultiples of 2: 2, 4, 6, 8, 20\nMultiples of 4: 4, 8, 12, 16, 20\n\nBoth lists have 4 as the smallest number in common.\nTherefore, the LCD is 4",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 4\n\nFor 1/4: already has denominator 4\n1/4 = (1 × 1)/(4 × 1) = 1/4\n\nFor 1/2:\n1 × 2 = 2\n2 × 2 = 4 → multiply both numerator and denominator by 2\n\n1/2 = (1 × 2)/(2 × 2) = 2/4\n\n- So the renamed (similar) fractions are:\n2/4 + 1/4 =",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n2/4 + 1/4 = 3/4",
          "Step 5: Final Answer\n\nn = 3/4"
        ],
        2: [
          "Step 1: Set the fractions in vertical form\n\n2/3 + 1/6 =",
          "Step 2: Find the LCD\n\nMultiples of 3: 3, 6, 9, 12, 15, 18\nMultiples of 6: 6, 12, 18, 24\n\n- both lists have 6 as the smallest number in common.\nTherefore, the LCD is 6",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 6\n\nFor 2/3:\n3 × 2 = 6 → multiply both numerator and denominator by 2\n\n2/3 = (2 × 2)/(3 × 2) = 4/6\n\nFor 1/6: already has denominator 6\n1/6 = (1 × 1)/(6 × 1) = 1/6\n\n- Multiply:\n4/6 + 1/6 =",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n4/6 + 1/6 = 5/6",
          "Step 5: Final Answer\n\nn = 5/6"
        ],
        3: [
          "Step 1: Set the fractions in vertical form\n\n3/8 + 1/4 =",
          "Step 2: Find the LCD\n\nMultiples of 8: 8, 16, 24, 32, 40\nMultiples of 4: 4, 8, 12, 16, 20\n\n- Both lists have 8 as the smallest number in common.\nTherefore, the LCD is 8",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 8\n\nFor 3/8: already has denominator 8\n3/8 = (3 × 1)/(8 × 1) = 3/8\n\nFor 1/4:\n1 × 2 = 2\n4 × 2 = 8 → multiply both numerator and denominator by 2\n\n1/4 = (1 × 2)/(4 × 2) = 2/8\n\n- So the renamed (similar) fractions are:\n3/8 + 2/8 =",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n3/8 + 2/8 = 5/8",
          "Step 5: Final Answer\n\nn = 5/8"
        ],
        4: [
          "Step 1: Set the fractions in vertical form\n\n1/5 + 3/10 =",
          "Step 2: Find the LCD\n\nMultiples of 5: 5, 10, 15, 20, 25\nMultiples of 10: 10, 20, 30, 40, 50\n\n- both lists have 10 as the smallest number in common.\nTherefore, the LCD is 10",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 10\n\nFor 1/5:\n1 × 2 = 2\n5 × 2 = 10 → multiply both numerator and denominator by 2.\n\n1/5 = (1 × 2)/(5 × 2) = 2/10\n\nFor 3/10: already has denominator 10.\n3/10 = (3 × 1)/(10 × 1) = 3/10\n\n- Multiply:\n2/10 + 3/10 =",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n2/10 + 3/10 = 5/10",
          "Step 5: Simplify the answer.\n\n- Divide the numerator and denominator by the same number (their Greatest Common Factor, or GCF).\n\n- Find the GCF of the numerator and denominator for 5/10\n\n• Factors of 5 → 1, 5.\n• Factors of 10 → 1, 2, 5, 10\n\n- So, the Greatest Common Factor (GCF) is 5\n\n- Divide both numerator and denominator by the GCF.\n\n5 ÷ 5 = 1\n10 ÷ 5 = 2",
          "Step 6: Final Answer\n\nn = 1/2"
        ],
        5: [
          "Step 1: Set the fractions in vertical form\n\n3/9 + 2/3 =",
          "Step 2: Find the LCD\n\nMultiples of 9: 9, 18, 27, 36, 45\nMultiples of 3: 3, 6, 9, 12, 15\n\n- Both lists have 9 as the smallest number in common.\nTherefore, the LCD is 9",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 9\n\nFor 3/9: already has denominator 9\n3/9 = (3 × 1)/(9 × 1) = 3/9\n\nFor 2/3:\n2 × 3 = 6\n3 × 3 = 9 → multiply both numerator and denominator by 3.\n\n2/3 = (2 × 3)/(3 × 3) = 6/9\n\nSo the renamed (similar) fractions are:\n3/9 + 6/9 =",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n3/9 + 6/9 = 9/9",
          "Step 5: Final Answer\n\nn = 1"
        ]
      },
      2: {
        1: [
          "Step 1: Set the fractions in vertical form\n\n2/10 + 1/5",
          "Step 2: Find the LCD\n\nMultiples of 10: 10, 20, 30, 40, 50\nMultiples of 5: 5, 10, 15, 20, 25\n\n- both lists have 10 as the smallest number in common.\nTherefore, the LCD is 10",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 10\n\nFor 2/10: already has denominator 10\n2/10 = (2 × 1)/(10 × 1) = 2/10\n\nFor 1/5:\n1 × 2 = 2\n5 × 2 = 10 → multiply both numerator and denominator by 2\n\n1/5 = (1 × 2)/(5 × 2) = 2/10\n\n- So the renamed (similar) fractions are:\n2/10 + 2/10 =",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n2/10 + 2/10 = 4/10",
          "Step 5: Simplify the answer.\n\n- Divide the numerator and denominator by the same number (their Greatest Common Factor, or GCF).\n\n- Find the GCF of the numerator and denominator for 4/10\n\n• Factors of 4 → 1, 2, 4\n• Factors of 10 → 1, 2, 5, 10\n\n- So, the Greatest Common Factor (GCF) is 2\n\n- Divide both numerator and denominator by the GCF.\n\n4 ÷ 2 = 2\n10 ÷ 2 = 5",
          "Step 6: Final Answer\n\nn = 2/5"
        ],
        2: [
          "Step 1: Set the fractions in vertical form\n\n1/6 + 1/3 =",
          "Step 2: Find the LCD\n\nMultiples of 6: 6, 12, 18, 24, 30\nMultiples of 3: 3, 6, 9, 12, 15\n\n- both lists have 6 as the smallest number in common.\nTherefore, the LCD is 6",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 6\n\nFor 1/6: already has denominator 6\n1/6 = (1 × 1)/(6 × 1) = 1/6\n\nFor 1/3:\n1 × 2 = 2\n3 × 2 = 6 → multiply both numerator and denominator by 2\n\n1/3 = (1 × 2)/(3 × 2) = 2/6\n\n- So the renamed (similar) fractions are:\n1/6 + 2/6 =",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n1/6 + 2/6 = 3/6",
          "Step 5: Simplify the answer.\n\n- Divide the numerator and denominator by the same number (their Greatest Common Factor, or GCF).\n\n- Find the GCF of the numerator and denominator for 3/6\n\n• Factors of 3 → 1, 3\n• Factors of 6 → 1, 2, 3, 6\n\n- So, the Greatest Common Factor (GCF) is 3\n\n- Divide both numerator and denominator by the GCF.\n\n3 ÷ 3 = 1\n6 ÷ 3 = 2",
          "Step 6: Final Answer\n\nn = 1/2"
        ],
        3: [
          "Step 1: Set the fractions in vertical form\n\n2/8 + 1/2",
          "Step 2: Find the LCD\n\nMultiples of 8: 8, 16, 24, 32, 40\nMultiples of 2: 2, 4, 6, 8, 10\n\n- both lists have 8 as the smallest number in common.\nTherefore, the LCD is 8",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 8\n\nFor 2/8: already has denominator 8\n2/8 = (2 × 1)/(8 × 1) = 2/8\n\nFor 1/2:\n1 × 4 = 4\n2 × 4 = 8 → multiply both numerator and denominator by 4\n\n1/2 = (1 × 4)/(2 × 4) = 4/8\n\n- So the renamed (similar) fractions are:\n2/8 + 4/8 =",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n2/8 + 4/8 = 6/8",
          "Step 5: Simplify the answer.\n\n- Divide the numerator and denominator by the same number (their Greatest Common Factor, or GCF).\n\n- Find the GCF of the numerator and denominator for 6/8\n\n• Factors of 6 → 1, 2, 3, 6\n• Factors of 8 → 1, 2, 4, 8\n\n- So, the Greatest Common Factor (GCF) is 2\n\n- Divide both numerator and denominator by the GCF.\n\n6 ÷ 2 = 3\n8 ÷ 2 = 4",
          "Step 6: Final Answer\n\nn = 1/2"
        ],
        4: [
          "Step 1: Set the fractions in vertical form\n\n3/9 + 1/6 =",
          "Step 2: Find the LCD\n\nMultiples of 9: 9, 18, 27, 36, 45\nMultiples of 6: 6, 12, 18, 24, 30\n\n- both lists have 18 as the smallest number in common.\nTherefore, the LCD is 18",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 18\n\nFor 3/9:\n3 × 2 = 6\n9 × 2 = 18 → multiply both numerator and denominator by 2\n\n3/9 = (3 × 2)/(9 × 2) = 6/18\n\nFor 1/6:\n1 × 3 = 3\n6 × 3 = 18 → multiply both numerator and denominator by 3\n\n1/6 = (1 × 3)/(6 × 3) = 3/18\n\n- Multiply:\n6/18 + 3/18 =",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n6/18 + 3/18 = 9/18",
          "Step 5: Simplify the answer.\n\n- Divide the numerator and denominator by the same number (their Greatest Common Factor, or GCF).\n\n- Find the GCF of the numerator and denominator for 9/18\n\n• Factors of 9 → 1, 3, 9\n• Factors of 18 → 1, 2, 3, 9, 18\n\n- So, the Greatest Common Factor (GCF) is 9\n\n- Divide both numerator and denominator by the GCF.\n\n9 ÷ 9 = 1\n18 ÷ 9 = 2",
          "Step 6: Final Answer\n\nn = 1/2"
        ],
        5: [
          "Step 1: Set the fractions in vertical form\n\n5/10 + 4/5 =",
          "Step 2: Find the LCD\n\nMultiples of 10: 10, 20, 30, 40, 50\nMultiples of 5: 5, 10, 15, 20, 25\n\n- both lists have 10 as the smallest number in common.\nTherefore, the LCD is 10",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 10\n\nFor 5/10: already has denominator 10\n5/10 = (5 × 1)/(10 × 1) = 5/10\n\nFor 4/5:\n4 × 2 = 8\n5 × 2 = 10 → multiply both numerator and denominator by 2\n\n4/5 = (4 × 2)/(5 × 2) = 8/10\n\n- So the renamed (similar) fractions are:\n5/10 + 8/10 =",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n5/10 + 8/10 = 13/10",
          "Step 6: Final Answer\n\nn = 13/10"
        ]
      },
    },
    2: {
      1: {
        1: [
          "Step 1: Set the fractions in vertical form\n\n2/6 + 1/3",
          "Step 2: Find the LCD\n\nMultiples of 6: 6, 12, 18, 24\nMultiples of 3: 3, 6, 9, 12\n\n- both lists have 6 as the smallest number in common.\nTherefore, the LCD is 6",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 6\n\nFor 2/6:\n6 × 1 = 6 → multiply both numerator and denominator by 1\n\n2/6 = (2 × 1)/(6 × 1) = 2/6\n\nFor 1/3:\n3 × 2 = 6 → multiply both numerator and denominator by 2\n\n1/3 = (1 × 2)/(3 × 2) = 2/6\n\n- So the renamed (similar) fractions are:\n2/6 + 2/6",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n2/6 + 2/6 = 4/6",
          "Step 5: Simplify the answer.\n\n- Divide the numerator and denominator by the same number (their Greatest Common Factor, or GCF).\n\n- Find the GCF of the numerator and denominator for 4/6\n\n• Factors of 4 → 1, 2, 4\n• Factors of 6 → 1, 2, 3, 6\n\n- So, the Greatest Common Factor (GCF) is 2 (no bigger common factor).\n\n- Divide both numerator and denominator by the GCF.\n\n4 ÷ 2 = 2\n6 ÷ 2 = 3",
          "Final Answer:\n\n= 2/3"
        ],
        2: [
          "Step 1: Set the fractions in vertical form.\n\n4/8 + 2/4",
          "Step 2: Find the LCD.\n\nMultiples of 8: 8, 16, 24\nMultiples of 4: 4, 8, 12\n\n- both lists have 8 as the smallest number in common.\nTherefore, the LCD is 8",
          "Step 3: Rename as similar fractions.\n- Find what number to multiply each denominator by to make 8.\n\nFor 4/8:\n8 × 1 = 8 → multiply both numerator and denominator by 1\n\n4/8 = (4 × 1)/(8 × 1) = 4/8\n\nFor 2/4:\n4 × 2 = 8 → multiply both numerator and denominator by 2\n\n2/4 = (2 × 2)/(4 × 2) = 4/8\n\n- So the renamed (similar) fractions are:\n4/8 + 4/8",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n4/8 + 4/8 = 8/8",
          "Step 5: Simplify the answer.\n\n- Divide the numerator and denominator by the same number (their Greatest Common Factor, or GCF).\n\n- Find the GCF of the numerator and denominator for 8/8\n\n• Factors of 8 → 1, 2, 4, 8\n• Factors of 8 → 1, 2, 4, 8\n\n- So, the Greatest Common Factor (GCF) is 8\n\n- Divide both numerator and denominator by the GCF.\n\n8 ÷ 8 = 1\n8 ÷ 8 = 1",
          "Final Answer:\n\n= 1"
        ],
        3: [
          "Step 1: Set the fractions in vertical form\n\n4/8 + 1/6 =",
          "Step 2: Find the LCD\n\nMultiples of 8: 8, 16, 24, 32\nMultiples of 6: 6, 12, 18, 24\n\n- Both lists have 24 as the smallest number in common.\nTherefore, the LCD is 24",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 24\n\nFor 4/8:\n8 × 3 = 24 → multiply both numerator and denominator by 3\n\n4/8 = (4 × 3)/(8 × 3) = 12/24\n\nFor 1/6:\n6 × 4 = 24 → multiply both numerator and denominator by 4\n\n1/6 = (1 × 4)/(6 × 4) = 4/24\n\n- So, the renamed (similar) fractions are:\n12/24 + 4/24 =",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n12/24 + 4/24 = 16/24",
          "Step 5: Simplify the answer.\n\n- Divide the numerator and denominator by the same number (their Greatest Common Factor, or GCF).\n\n- Find the GCF of the numerator and denominator for 16/24\n\n• Factors of 16 → 1, 2, 4, 8, 16\n• Factors of 24 → 1, 2, 3, 4, 6, 8, 12, 24\n\n- So, the Greatest Common Factor (GCF) is 8\n\n- Divide both numerator and denominator by the GCF.\n\n16 ÷ 8 = 2\n24 ÷ 8 = 3",
          "Final Answer:\n\n= 2/3"
        ],
        4: [
          "Step 1: Set the fractions in vertical form\n\n6/10 + 1/5 =",
          "Step 2: Find the LCD\n\nMultiples of 10: 10, 20, 30...\nMultiples of 5: 5, 10, 15...\n\n- both lists have 10 as the smallest number in common.\nTherefore, the LCD is 10",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 10\n\nFor 6/10: already has denominator 10\n6/10 = (6 × 1)/(10 × 1) = 6/10\n\nFor 1/5:\n5 × 2 = 10 → multiply both numerator and denominator by 2\n\n1/5 = (1 × 2)/(5 × 2) = 2/10\n\n- So the renamed (similar) fractions are:\n6/10 + 2/10 =",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n6/10 + 2/10 = 8/10",
          "Step 5: Simplify the answer.\n\n- Divide the numerator and denominator by the same number (their Greatest Common Factor, or GCF).\n\n- Find the GCF of the numerator and denominator for 8/10\n\n• Factors of 8 → 1, 2, 4, 8\n• Factors of 10 → 1, 2, 5, 10\n\n- So, the Greatest Common Factor (GCF) is 2\n\n- Divide both numerator and denominator by the GCF.\n\n8 ÷ 2 = 4\n10 ÷ 2 = 5",
          "Final Answer:\n\n= 4/5"
        ],
        5: [
          "Step 1: Set the fractions in vertical form\n\n3/12 + 2/4 =",
          "Step 2: Find the LCD\n\nMultiples of 12: 12, 24, 36\nMultiples of 4: 4, 8, 12\n\n- Both lists have 12 as the smallest number in common.\nTherefore, the LCD is 12",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make the LCD.\n\nFor 3/12:\n12 × 1 = 12 → multiply numerator and denominator by 1\n\n3/12 = (3 × 1)/(12 × 1) = 3/12\n\nFor 2/4:\n4 × 3 = 12 → multiply numerator and denominator by 3\n\n2/4 = (2 × 3)/(4 × 3) = 6/12\n\n- So, the renamed (similar) fractions are:\n3/12 + 6/12 =",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n3/12 + 6/12 = 9/12",
          "Step 5: Simplify the answer.\n\n- Divide the numerator and denominator by the same number (their Greatest Common Factor, or GCF).\n\n- Find the GCF of the numerator and denominator for 9/12\n\n• Factors of 9 → 1, 3, 9\n• Factors of 12 → 1, 2, 3, 4, 6, 12\n\n- So, the GCF is 3. Divide both numerator and denominator by the GCF.\n\n9 ÷ 3 = 3\n12 ÷ 3 = 4",
          "Final Answer:\n\n= 3/4"
        ]
      },
      2: {
        1: [
          "Step 1: Set the fractions in vertical form\n\n7/14 + 1/7 =",
          "Step 2: Find the LCD\n\nMultiples of 14: 14, 28, 42\nMultiples of 7: 7, 14, 21\n\n- Both lists have 14 as the smallest number in common.\nTherefore, the LCD is 14",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make the LCD.\n\nFor 7/14:\n14 × 1 = 14 → multiply numerator and denominator by 1\n\n7/14 = (7 × 1)/(14 × 1) = 7/14\n\nFor 1/7:\n7 × 2 = 14 → multiply numerator and denominator by 2\n\n1/7 = (1 × 2)/(7 × 2) = 2/14\n\n- So, the renamed (similar) fractions are:\n7/14 + 2/14 =",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n7/14 + 2/14 = 9/14",
          "Step 5: Simplify the answer.\n\n- Divide the numerator and denominator by the same number (their Greatest Common Factor, or GCF).\n\n- Find the GCF of the numerator and denominator for 9/14\n\n• Factors of 9 → 1, 3, 9\n• Factors of 14 → 1, 2, 7, 14\n\n- So, the GCF is 1. Divide both numerator and denominator by the GCF.\n\n9 ÷ 1 = 9\n14 ÷ 1 = 14",
          "Final Answer:\n\n= 9/14"
        ],
        2: [
          "Step 1: Set the fractions in vertical form\n\n4/10 + 2/5 =",
          "Step 2: Find the LCD\n\nMultiples of 10: 10, 20, 30...\nMultiples of 5: 5, 10, 15...\n\n- both lists have 10 as the smallest number in common.\nTherefore, the LCD is 10",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 10.\n\nFor 4/10: already has denominator 10\n4/10 = (4 × 1)/(10 × 1) = 4/10\n\nFor 2/5:\n5 × 2 = 10 → multiply both numerator and denominator by 2\n\n2/5 = (2 × 2)/(5 × 2) = 4/10\n\n- So the renamed (similar) fractions are:\n4/10 + 4/10 =",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n4/10 + 4/10 = 8/10",
          "Step 5: Simplify the answer.\n\n- Divide the numerator and denominator by the same number (their Greatest Common Factor, or GCF).\n\n- Find the GCF of the numerator and denominator for 8/10\n\n• Factors of 8 → 1, 2, 4, 8\n• Factors of 10 → 1, 2, 5, 10\n\n- So, the Greatest Common Factor (GCF) is 2\n\n- Divide both numerator and denominator by the GCF.\n\n8 ÷ 2 = 4\n10 ÷ 2 = 5",
          "Final Answer:\n\n= 4/5"
        ],
        3: [
          "Step 1: Set the fractions in vertical form\n\n6/15 + 1/3 =",
          "Step 2: Find the LCD\n\nMultiples of 15: 15, 30, 45...\nMultiples of 3: 3, 6, 9, 12, 15...\n\n- both lists have 15 as the smallest number in common.\nTherefore, the LCD is 15",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 15.\n\nFor 6/15: already has denominator 15\n6/15 = (6 × 1)/(15 × 1) = 6/15\n\nFor 1/3:\n3 × 5 = 15 → multiply both numerator and denominator by 5\n\n1/3 = (1 × 5)/(3 × 5) = 5/15\n\n- So the renamed (similar) fractions are:\n6/15 + 5/15 =",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n6/15 + 5/15 = 11/15",
          "Step 5: Simplify the answer.\n\n- Divide the numerator and denominator by the same number (their Greatest Common Factor, or GCF).\n\n- Find the GCF of the numerator and denominator for 11/15\n\n• Factors of 11 → 1, 11\n• Factors of 15 → 1, 3, 5, 15\n\n- So, the Greatest Common Factor (GCF) is 1 (no bigger common factor).\n\n- Divide both numerator and denominator by the GCF.\n\n11 ÷ 1 = 11\n15 ÷ 1 = 15",
          "Final Answer:\n\n= 11/15"
        ],
        4: [
          "Step 1: Set the fractions in vertical form\n\n2/5 + 3/10 =",
          "Step 2: Find the LCD\n\nMultiples of 5: 5, 10, 15, 20...\nMultiples of 10: 10, 20, 30...\n\n- both lists have 10 as the smallest number in common.\nTherefore, the LCD is 10",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 10.\n\nFor 2/5:\n5 × 2 = 10 → multiply both numerator and denominator by 2\n\n2/5 = (2 × 2)/(5 × 2) = 4/10\n\nFor 3/10: already has denominator 10\n3/10 = (3 × 1)/(10 × 1) = 3/10\n\n- So the renamed (similar) fractions are:\n4/10 + 3/10 =",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n4/10 + 3/10 = 7/10",
          "Step 5: Simplify the answer.\n\n- Divide the numerator and denominator by the same number (their Greatest Common Factor, or GCF).\n\n- Find the GCF of the numerator and denominator for 7/10\n\n• Factors of 7 → 1, 7\n• Factors of 10 → 1, 2, 5, 10\n\n- So, the Greatest Common Factor (GCF) is 1 (no bigger common factor).\n\n- Divide both numerator and denominator by the GCF.\n\n7 ÷ 1 = 7\n10 ÷ 1 = 10",
          "Final Answer:\n\n= 7/10"
        ],
        5: [
          "Step 1: Set the fractions in vertical form\n\n3/12 + 2/4 =",
          "Step 2: Find the LCD\n\nMultiples of 12: 12, 24, 36...\nMultiples of 4: 4, 8, 12, 16...\n\n- both lists have 12 as the smallest number in common.\nTherefore, the LCD is 12",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 12.\n\nFor 3/12: already has denominator 12\n3/12 = (3 × 1)/(12 × 1) = 3/12\n\nFor 2/4:\n4 × 3 = 12 → multiply both numerator and denominator by 3\n\n2/4 = (2 × 3)/(4 × 3) = 6/12\n\n- So the renamed (similar) fractions are:\n3/12 + 6/12 =",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n3/12 + 6/12 = 9/12",
          "Step 5: Simplify the answer.\n\n- Divide the numerator and denominator by the same number (their Greatest Common Factor, or GCF).\n\n- Find the GCF of the numerator and denominator for 9/12\n\n• Factors of 9 → 1, 3, 9\n• Factors of 12 → 1, 2, 3, 4, 6, 12\n\n- So, the Greatest Common Factor (GCF) is 3\n\n- Divide both numerator and denominator by the GCF.\n\n9 ÷ 3 = 3\n12 ÷ 3 = 4",
          "Final Answer:\n\n= 3/4"
        ]
      },
    },
    3: {
      1: {
        1: [
          "Step 1: Set the fractions in vertical form\n\n5/12 + 1/8 = n",
          "Step 2: Find the LCD\n\nMultiples of 12: 12, 24, 36, 48\nMultiples of 8: 8, 16, 24, 32\n\n- both lists have 24 as the smallest number in common.\nTherefore, the LCD is 24",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 24.\n\nFor 5/12:\n5 × 2 = 10\n12 × 2 = 24 → multiply both numerator and denominator by 2\n\n5/12 = (5 × 2)/(12 × 2) = 10/24\n\nFor 1/8:\n1 × 3 = 3\n8 × 3 = 24 → multiply both numerator and denominator by 3\n\n1/8 = (1 × 3)/(8 × 3) = 3/24\n\n- So the renamed (similar) fractions are:\n10/24 + 3/24 = n",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n10/24 + 3/24 = 13/24",
          "Step 5: Final Answer\n\nn = 13/24"
        ],
        2: [
          "Step 1: Set the fractions in vertical form\n\n7/16 + 1/8 = n",
          "Step 2: Find the LCD\n\nMultiples of 16: 16, 32, 48, 64\nMultiples of 8: 8, 16, 24, 32\n\n- both lists have 16 as the smallest number in common.\nTherefore, the LCD is 16",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 16.\n\nFor 7/16: already has denominator 16\n7/16 = (7 × 1)/(16 × 1) = 7/16\n\nFor 1/8:\n1 × 2 = 2\n8 × 2 = 16 → multiply both numerator and denominator by 2\n\n1/8 = (1 × 2)/(8 × 2) = 2/16\n\n- So the renamed (similar) fractions are:\n7/16 + 2/16 = n",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n7/16 + 2/16 = 9/16",
          "Step 5: Final Answer\n\nn = 9/16"
        ],
        3: [
          "Step 1: Set the fractions in vertical form\n\n3/10 + 2/15 = n",
          "Step 2: Find the LCD\n\nMultiples of 10: 10, 20, 30, 40\nMultiples of 15: 15, 20, 45, 60\n\n- Both lists have 30 as the smallest number in common.\nTherefore, the LCD is 30",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 30.\n\nFor 3/10:\n3 × 3 = 9\n10 × 3 = 30 → multiply both numerator and denominator by 3\n\n3/10 = (3 × 3)/(10 × 3) = 9/30\n\nFor 2/15:\n2 × 2 = 4\n15 × 2 = 30 → multiply both numerator and denominator by 2\n\n2/15 = (2 × 2)/(15 × 2) = 4/30\n\n- So the renamed (similar) fractions are:\n9/30 + 4/30 = n",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n9/30 + 4/30 = 13/30",
          "Step 5: Final Answer\n\nn = 13/30"
        ],
        4: [
          "Step 1: Set the fractions in vertical form\n\n5/18 + 1/6 = n",
          "Step 2: Find the LCD\n\nMultiples of 18: 18, 36, 54, 72\nMultiples of 6: 6, 12, 15, 18, 24\n\n- both lists have 18 as the smallest number in common.\nTherefore, the LCD is 18",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 18.\n\nFor 5/18: already has denominator 18\n5/18 = (5 × 1)/(18 × 1) = 5/18\n\nFor 1/6:\n1 × 3 = 3\n6 × 3 = 18 → multiply both numerator and denominator by 3\n\n1/6 = (1 × 3)/(6 × 3) = 3/18\n\n- So the renamed (similar) fractions are:\n5/18 + 3/18 = n",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n5/18 + 3/18 = 8/18",
          "Step 5: Simplify the answer.\n\n- Divide the numerator and denominator by the same number (their Greatest Common Factor, or GCF).\n\n- Find the GCF of the numerator and denominator for 8/18\n\n• Factors of 8 → 1, 2, 4, 8\n• Factors of 18 → 1, 2, 3, 6, 9, 18\n\n- So, the Greatest Common Factor (GCF) is 2\n\n- Divide both numerator and denominator by the GCF.\n\n8 ÷ 2 = 4\n18 ÷ 2 = 9",
          "Step 6: Final Answer\n\nn = 4/9"
        ],
        5: [
          "Step 1: Set the fractions in vertical form\n\n2/9 + 3/18 = n",
          "Step 2: Find the LCD\n\nMultiples of 9: 9, 18, 27, 36, 45\nMultiples of 18: 18, 36, 54, 72\n\n- Both lists have 18 as the smallest number in common.\nTherefore, the LCD is 18",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 18.\n\nFor 2/9:\n2 × 2 = 4\n9 × 2 = 18 → multiply both numerator and denominator by 2\n\n2/9 = (2 × 2)/(9 × 2) = 4/18\n\nFor 3/18: already has denominator 18\n3/18 = (3 × 1)/(18 × 1) = 3/18\n\nSo the renamed (similar) fractions are:\n4/18 + 3/18 = n",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n4/18 + 3/18 = 7/18",
          "Step 5: Final Answer\n\nn = 7/18"
        ]
      },
      2: {
        1: [
          "Step 1: Set the fractions in vertical form\n\n7/20 + 3/10 = n",
          "Step 2: Find the LCD\n\nMultiples of 20: 20, 40, 60, 80, 100\nMultiples of 10: 10, 20, 30, 40, 50\n\n- both lists have 20 as the smallest number in common.\nTherefore, the LCD is 20",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 20.\n\nFor 7/20: already has denominator 20\n7/20 = (7 × 1)/(20 × 1) = 7/20\n\nFor 3/10:\n3 × 2 = 6\n10 × 2 = 20 → multiply both numerator and denominator by 2\n\n3/10 = (3 × 2)/(10 × 2) = 6/20\n\n- So the renamed (similar) fractions are:\n7/20 + 6/20 = n",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n7/20 + 6/20 = 13/20",
          "Step 5: Final Answer\n\nn = 13/20"
        ],
        2: [
          "Step 1: Set the fractions in vertical form\n\n5/16 + 3/8 = n",
          "Step 2: Find the LCD\n\nMultiples of 16: 16, 32, 48, 64\nMultiples of 8: 8, 16, 24, 32, 40\n\n- both lists have 16 as the smallest number in common.\nTherefore, the LCD is 16",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 16.\n\nFor 5/16: already has denominator 16\n5/16 = (5 × 1)/(16 × 1) = 5/16\n\nFor 3/8:\n3 × 2 = 6\n8 × 2 = 16 → multiply both numerator and denominator by 2\n\n3/8 = (3 × 2)/(8 × 2) = 6/16\n\n- So the renamed (similar) fractions are:\n5/16 + 6/16 = n",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n5/16 + 6/16 = 11/16",
          "Step 5: Final Answer\n\nn = 11/16"
        ],
        3: [
          "Step 1: Set the fractions in vertical form\n\n4/15 + 1/10 = n",
          "Step 2: Find the LCD\n\nMultiples of 15: 15, 30, 45, 60\nMultiples of 10: 10, 20, 30, 40\n\n- both lists have 30 as the smallest number in common.\nTherefore, the LCD is 30",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 30.\n\nFor 4/15:\n4 × 2 = 8\n15 × 2 = 30 → multiply both numerator and denominator by 2\n\n4/15 = (4 × 2)/(15 × 2) = 8/30\n\nFor 1/10:\n1 × 3 = 3\n10 × 3 = 30 → multiply both numerator and denominator by 3\n\n1/10 = (1 × 3)/(10 × 3) = 3/30\n\n- So the renamed (similar) fractions are:\n8/30 + 3/30 = n",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n8/30 + 3/30 = 11/30",
          "Step 5: Final Answer\n\nn = 11/30"
        ],
        4: [
          "Step 1: Set the fractions in vertical form\n\n7/12 + 1/6 = n",
          "Step 2: Find the LCD\n\nMultiples of 12: 12, 24, 36, 48\nMultiples of 6: 6, 12, 18, 24, 30\n\n- both lists have 12 as the smallest number in common.\nTherefore, the LCD is 12",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 12.\n\nFor 7/12: already has denominator 12\n7/12 = (7 × 1)/(12 × 1) = 7/12\n\nFor 1/6:\n1 × 2 = 2\n6 × 2 = 12 → multiply both numerator and denominator by 2\n\n1/6 = (1 × 2)/(6 × 2) = 2/12\n\n- So the renamed (similar) fractions are:\n7/12 + 2/12 = n",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n7/12 + 2/12 = 9/12",
          "Step 5: Simplify the answer.\n\n- Divide the numerator and denominator by the same number (their Greatest Common Factor, or GCF).\n\n- Find the GCF of the numerator and denominator for 9/12\n\n• Factors of 9 → 1, 3, 9\n• Factors of 12 → 1, 2, 3, 4, 6, 12\n\n- So, the Greatest Common Factor (GCF) is 3\n\n- Divide both numerator and denominator by the GCF.\n\n9 ÷ 3 = 3\n12 ÷ 3 = 4",
          "Step 6: Final Answer\n\nn = 3/4"
        ],
        5: [
          "Step 1: Set the fractions in vertical form\n\n9/20 + 1/10 = n",
          "Step 2: Find the LCD\n\nMultiples of 20: 20, 40, 60, 80, 100\nMultiples of 10: 10, 20, 30, 40, 50\n\n- both lists have 20 as the smallest number in common.\nTherefore, the LCD is 20",
          "Step 3: Rename as similar fractions\n\n- Find what number to multiply each denominator by to make 20.\n\nFor 9/20: already has denominator 20\n9/20 = (9 × 1)/(20 × 1) = 9/20\n\nFor 1/10:\n1 × 2 = 2\n10 × 2 = 20 → multiply both numerator and denominator by 2\n\n1/10 = (1 × 2)/(10 × 2) = 2/20\n\n- So the renamed (similar) fractions are:\n9/20 + 2/20 = n",
          "Step 4: Add the numerators. Write the sum over the common denominator.\n\n9/20 + 2/20 = 11/20",
          "Step 5: Final Answer\n\nn = 3/4"
        ]
      },
    }
  };

  const currentHelpSteps = helpSteps[levelGroup]?.[stage]?.[quizIndex] || helpSteps[1][1][1];

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
          ) : (
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
            </View>
          )}
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
  quizCard: {
    marginTop: Platform.OS === "ios" ? verticalScale(195) : verticalScale(185),
    alignSelf: "center",
    width: scale(320),
    maxWidth: "88%",
    backgroundColor: "#fff",
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    alignItems: "center",
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: moderateScale(3),
    borderColor: "#FFA85C",
  },
  cardHeader: {
    width: "100%",
    marginBottom: verticalScale(12),
    paddingBottom: verticalScale(10),
    borderBottomWidth: moderateScale(2),
    borderBottomColor: "#f0f0f0",
  },
  questionLabel: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(14),
    color: "#666",
    textAlign: "center",
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: verticalScale(8),
  },
  quizImage: {
    width: scale(260),
    height: verticalScale(160),
    borderRadius: moderateScale(14),
    marginBottom: verticalScale(12),
  },
  fractionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: scale(6),
  },
  fractionCol: {
    alignItems: "center",
  },
  fractionImg: {
    width: moderateScale(50),
    height: moderateScale(50),
    marginBottom: verticalScale(6),
    resizeMode: "contain",
  },
  fractionBox: {
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(10),
    minWidth: moderateScale(45),
  },
  fractionNumerator: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(18),
    color: "#222",
  },
  fractionLine: {
    width: "100%",
    height: moderateScale(2),
    backgroundColor: "#222",
    marginVertical: verticalScale(3),
  },
  fractionDenominator: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(18),
    color: "#222",
  },
  operatorBox: {
    backgroundColor: "#FFA85C",
    borderRadius: moderateScale(14),
    width: moderateScale(42),
    height: moderateScale(42),
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  operation: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(24),
    color: "#fff",
  },
  equalsBox: {
    backgroundColor: "#4CAF50",
    borderRadius: moderateScale(14),
    width: moderateScale(42),
    height: moderateScale(42),
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  equals: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(24),
    color: "#fff",
  },
  questionBox: {
    backgroundColor: "#FF6B6B",
    borderRadius: moderateScale(14),
    width: moderateScale(42),
    height: moderateScale(42),
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  questionMark: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(28),
    color: "#fff",
  },
  answersContainer: {
    position: "absolute",
    bottom: verticalScale(120),
    width: "100%",
    paddingHorizontal: scale(20),
  },
  answersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: scale(10),
  },
  answerBtnWrapper: {
    width: "45%",
    maxWidth: scale(150),
  },
  answerBtn: {
    backgroundColor: "#FFA85C",
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    borderWidth: moderateScale(2),
    borderColor: "#fff",
    minHeight: verticalScale(52),
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
    position: "absolute",
    bottom: verticalScale(16),
    left: scale(20),
    right: scale(20),
    zIndex: 100,
  },
  feedbackCard: {
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
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
    fontSize: moderateScale(40),
    marginBottom: verticalScale(6),
  },
  feedbackTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(20),
    color: "#222",
    marginBottom: verticalScale(4),
  },
  feedbackSubtext: {
    fontFamily: "Poppins-Regular",
    fontSize: moderateScale(12),
    color: "#666",
    marginBottom: verticalScale(12),
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
    width: scale(300),
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
  helpBtn: {
    position: "absolute",
    right: 0,
    top: 0,
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: "#FFA85C",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  helpBtnText: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(16),
    color: "#fff",
  },
});
