import React, { useEffect, useRef } from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { LevelProgress } from "../utils/levelProgress";

const { width, height } = Dimensions.get("window");

// Responsive scaling functions
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export default function FinishScreen({ route, navigation }) {
  const {
    selectedCharacter = 0,
    isCorrect = false,
    timeUp = false,
    stage = 1,
    levelGroup = 1,
    timeRemaining = 0,
  } = route.params || {};

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const characterBounce = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    [...Array(8)].map(() => new Animated.Value(0))
  ).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const characters = [
    require("../assets/chara1.png"),
    require("../assets/chara2.png"),
    require("../assets/chara3.png"),
    require("../assets/chara4.png"),
    require("../assets/chara5.png"),
    require("../assets/chara6.png"),
  ];

  const CHARACTER_WIDTH = moderateScale(120);
  const CHARACTER_HEIGHT = moderateScale(180);
  const WHITE_BAR_HEIGHT = verticalScale(80);

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Character bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(characterBounce, {
          toValue: -10,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(characterBounce, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Sparkle animation
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

    // Button pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Confetti animation (only for success)
    if (isCorrect) {
      confettiAnims.forEach((anim, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 2000 + index * 200,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }
  }, []);

  const isAllStagesCompleted = () => {
    return isCorrect && stage === 2;
  };

  const getDialogueContent = () => {
    if (timeUp) {
      return {
        text: "Time's Up! Don't worry, you can try again!",
        emoji: "⏰",
        buttonText: "Retry Stage 🔄",
        backgroundColor: "#FF6B6B",
        accentColor: "#ff4444",
      };
    } else if (isCorrect) {
      if (stage === 2) {
        if (levelGroup === 3) {
          return {
            text: "Amazing! You've completed all levels! You're a Fraction Master!",
            emoji: "🏆",
            buttonText: "Back to Levels 🎯",
            backgroundColor: "#4CAF50",
            accentColor: "#2e7d32",
          };
        } else {
          return {
            text:
              levelGroup === 1
                ? "Wow, you fixed the food forests! Let's head to the Potion River"
                : `Great job! You've completed Level ${levelGroup}! Level ${
                    levelGroup + 1
                  } is now unlocked!`,
            emoji: "🎉",
            buttonText: "Next Level →",
            backgroundColor: "#4CAF50",
            accentColor: "#2e7d32",
          };
        }
      } else {
        return {
          text: `Excellent work! Stage ${stage + 1} is now unlocked!`,
          emoji: "⭐",
          buttonText: "Continue →",
          backgroundColor: "#4CAF50",
          accentColor: "#2e7d32",
        };
      }
    } else {
      return {
        text: "Oops! Not quite right. Let's try again and get it!",
        emoji: "💪",
        buttonText: "Try Again 🔄",
        backgroundColor: "#FF6B6B",
        accentColor: "#ff4444",
      };
    }
  };

  const handleContinue = async () => {
    await LevelProgress.completeLevel(
      levelGroup,
      stage,
      isCorrect,
      timeRemaining
    );

    if (isCorrect && stage === 2) {
      const dialogueText =
        levelGroup === 3
          ? "🎉 Amazing! You've completed all levels! Congratulations!"
          : levelGroup === 1
          ? "Wow, you fixed the food forests! Let's head to the Potion River"
          : `🎉 Great job! You've completed Level ${levelGroup}! Level ${
              levelGroup + 1
            } is now unlocked!`;
      navigation.navigate("Dialogue", {
        selectedCharacter,
        dialogueText,
        subtext: "",
        nextScreen: "LevelSelect",
        nextScreenParams: { selectedCharacter },
      });
    } else if (isCorrect) {
      navigation.replace("MapLevels", { levelGroup, selectedCharacter });
    } else {
      navigation.replace("Quiz", { stage, levelGroup, selectedCharacter });
    }
  };

  const dialogueContent = getDialogueContent();

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  const sparkleRotate = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const confettiColors = ["🎊", "🎉", "⭐", "✨", "💫", "🌟", "💖", "🎈"];

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={handleContinue}
    >
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

        {/* Confetti for success */}
        {isCorrect &&
          confettiAnims.map((anim, index) => {
            const translateY = anim.interpolate({
              inputRange: [0, 1],
              outputRange: [-100, height + 100],
            });
            const rotate = anim.interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", "360deg"],
            });
            const opacity = anim.interpolate({
              inputRange: [0, 0.8, 1],
              outputRange: [1, 1, 0],
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.confetti,
                  {
                    left: scale(index * 45 + 20),
                    opacity,
                    transform: [{ translateY }, { rotate }],
                  },
                ]}
              >
                <Text style={styles.confettiText}>
                  {confettiColors[index % confettiColors.length]}
                </Text>
              </Animated.View>
            );
          })}

        <View
          style={[
            styles.centeredContainer,
            { marginBottom: WHITE_BAR_HEIGHT + verticalScale(30) },
          ]}
        >
          <Animated.View
            style={[
              styles.dialogueBox,
              {
                borderColor: dialogueContent.backgroundColor,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Result icon */}
            <View
              style={[
                styles.emojiContainer,
                { backgroundColor: dialogueContent.backgroundColor },
              ]}
            >
              <Text style={styles.resultEmoji}>{dialogueContent.emoji}</Text>
            </View>

            {/* Main message */}
            <Text style={styles.dialogueText}>{dialogueContent.text}</Text>

            {/* Stats section */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Level</Text>
                <Text style={styles.statValue}>{levelGroup}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Stage</Text>
                <Text style={styles.statValue}>{stage}</Text>
              </View>
              {isCorrect && timeRemaining > 0 && (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Time</Text>
                    <Text style={[styles.statValue, styles.bonusValue]}>
                      +{timeRemaining}s
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Status badge */}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: dialogueContent.backgroundColor },
              ]}
            >
              <Text style={styles.statusText}>
                {isAllStagesCompleted()
                  ? "🎯 LEVEL COMPLETE!"
                  : isCorrect
                  ? "✓ CORRECT"
                  : timeUp
                  ? "⏰ TIME UP"
                  : "✗ INCORRECT"}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* White bar at the bottom */}
        <View style={[styles.whiteBar, { height: WHITE_BAR_HEIGHT }]}>
          <Animated.View
            style={[
              styles.characterContainer,
              {
                transform: [{ translateY: characterBounce }],
              },
            ]}
          >
            <Image
              source={characters[selectedCharacter]}
              style={[
                styles.characterImg,
                {
                  width: CHARACTER_WIDTH,
                  height: CHARACTER_HEIGHT,
                  top: -CHARACTER_HEIGHT / 2.1,
                },
              ]}
            />
          </Animated.View>
        </View>

        {/* Action button */}
        <View style={styles.continueContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: dialogueContent.backgroundColor },
              ]}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>
                {dialogueContent.buttonText}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.tapHintContainer}>
            <Text style={styles.tapHintText}>👆 Tap anywhere to continue</Text>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
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
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(20),
  },
  dialogueBox: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(28),
    padding: moderateScale(28),
    width: scale(340),
    maxWidth: "95%",
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    marginTop: verticalScale(40),
    alignItems: "center",
    borderWidth: moderateScale(5),
  },
  emojiContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(20),
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: moderateScale(4),
    borderColor: "#fff",
  },
  resultEmoji: {
    fontSize: moderateScale(48),
  },
  dialogueText: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(18),
    color: "#222",
    lineHeight: moderateScale(28),
    textAlign: "center",
    marginBottom: verticalScale(20),
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: verticalScale(16),
    width: "100%",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: moderateScale(12),
    color: "#888",
    marginBottom: verticalScale(4),
  },
  statValue: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(24),
    color: "#222",
  },
  bonusValue: {
    color: "#4CAF50",
  },
  statDivider: {
    width: moderateScale(2),
    height: moderateScale(40),
    backgroundColor: "#e0e0e0",
    marginHorizontal: scale(8),
  },
  statusBadge: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(20),
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  statusText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(14),
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  whiteBar: {
    width: "100%",
    backgroundColor: "#fff",
    position: "absolute",
    bottom: verticalScale(90),
    left: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    zIndex: 2,
    paddingLeft: scale(24),
    elevation: 15,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  characterContainer: {
    width: moderateScale(140),
    height: "100%",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    position: "relative",
    overflow: "visible",
  },
  characterImg: {
    position: "absolute",
    left: 0,
    resizeMode: "contain",
  },
  continueContainer: {
    position: "absolute",
    bottom: verticalScale(90),
    left: 0,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
    paddingHorizontal: scale(20),
  },
  actionButton: {
    paddingHorizontal: scale(32),
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(30),
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: moderateScale(4),
    borderColor: "#fff",
    minWidth: scale(200),
  },
  actionButtonText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(18),
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  tapHintContainer: {
    marginTop: verticalScale(12),
    backgroundColor: "rgba(255, 168, 92, 0.95)",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    elevation: 6,
    shadowColor: "#FFA85C",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    borderWidth: moderateScale(2),
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  tapHintText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(12),
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sparkle: {
    position: "absolute",
    zIndex: 1,
  },
  sparkleText: {
    fontSize: moderateScale(32),
  },
  confetti: {
    position: "absolute",
    top: -100,
    zIndex: 10,
  },
  confettiText: {
    fontSize: moderateScale(24),
  },
});
