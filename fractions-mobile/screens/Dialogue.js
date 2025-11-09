import React, { useState, useEffect, useRef } from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

export default function Dialogue({ route, navigation }) {
  const { selectedCharacter = 0 } = route.params || {};
  const [currentDialogue, setCurrentDialogue] = useState(0);
  const [userName, setUserName] = useState("Adventurer");

  const dialogueOpacity = useRef(new Animated.Value(0)).current;
  const dialogueScale = useRef(new Animated.Value(0.9)).current;
  const characterSlide = useRef(new Animated.Value(100)).current;
  const characterBounce = useRef(new Animated.Value(0)).current;
  const continueTextOpacity = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  const characters = [
    require("../assets/chara1.png"),
    require("../assets/chara2.png"),
    require("../assets/chara3.png"),
    require("../assets/chara4.png"),
    require("../assets/chara5.png"),
    require("../assets/chara6.png"),
  ];

  const dialogues = [
    {
      text: `Welcome, brave ${userName}! 🎮`,
      subtext: "Your epic journey begins here...",
    },
    {
      text: "The realm needs a hero like you! ⚔️",
      subtext: "Prepare yourself for amazing challenges ahead.",
    },
    {
      text: "Master your skills, conquer the levels! 🏆",
      subtext: "Every challenge will make you stronger!",
    },
    {
      text: "Are you ready to begin your adventure? 🌟",
      subtext: "The journey of a thousand miles starts now!",
    },
  ];

  useEffect(() => {
    loadUserName();
    animateDialogueIn();
    startCharacterBounce();
    startSparkleAnimation();
  }, []);

  useEffect(() => {
    if (currentDialogue > 0) {
      animateDialogueIn();
    }
  }, [currentDialogue]);

  const loadUserName = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        const parsed = JSON.parse(userData);
        setUserName(parsed.fullName || parsed.username || "Adventurer");
      }
    } catch (error) {
      console.log("Error loading user name:", error);
    }
  };

  const animateDialogueIn = () => {
    dialogueOpacity.setValue(0);
    dialogueScale.setValue(0.9);
    continueTextOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(dialogueOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(dialogueScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Slide character in on first dialogue
    if (currentDialogue === 0) {
      Animated.spring(characterSlide, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }

    // Show continue text after delay
    setTimeout(() => {
      Animated.timing(continueTextOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 800);
  };

  const startCharacterBounce = () => {
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

  const handleContinue = () => {
    if (currentDialogue < dialogues.length - 1) {
      // Fade out before changing dialogue
      Animated.parallel([
        Animated.timing(dialogueOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(continueTextOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentDialogue(currentDialogue + 1);
      });
    } else {
      // Final dialogue - navigate to LevelSelect
      Animated.parallel([
        Animated.timing(dialogueOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(characterSlide, {
          toValue: 200,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        navigation.replace("LevelSelect");
      });
    }
  };

  const CHARACTER_WIDTH = Math.min(width * 0.28, 130);
  const CHARACTER_HEIGHT = Math.min(height * 0.25, 200);
  const WHITE_BAR_HEIGHT = CHARACTER_HEIGHT / 2.5;

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  const sparkleScale = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.2, 0.8],
  });

  return (
    <TouchableOpacity
      style={{ flex: 1 }}
      activeOpacity={1}
      onPress={handleContinue}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <ImageBackground
        source={require("../assets/map 1.png")}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Sparkle effects */}
        <Animated.View
          style={[
            styles.sparkle,
            {
              top: height * 0.2,
              left: width * 0.15,
              opacity: sparkleOpacity,
              transform: [{ scale: sparkleScale }],
            },
          ]}
        >
          <Text style={styles.sparkleText}>✨</Text>
        </Animated.View>
        <Animated.View
          style={[
            styles.sparkle,
            {
              top: height * 0.3,
              right: width * 0.1,
              opacity: sparkleOpacity,
              transform: [{ scale: sparkleScale }],
            },
          ]}
        >
          <Text style={styles.sparkleText}>⭐</Text>
        </Animated.View>

        <View
          style={[
            styles.centeredContainer,
            { marginBottom: WHITE_BAR_HEIGHT + 30 },
          ]}
        >
          <Animated.View
            style={[
              styles.dialogueBox,
              {
                opacity: dialogueOpacity,
                transform: [{ scale: dialogueScale }],
              },
            ]}
          >
            {/* Progress dots */}
            <View style={styles.progressContainer}>
              {dialogues.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index === currentDialogue && styles.progressDotActive,
                    index < currentDialogue && styles.progressDotCompleted,
                  ]}
                />
              ))}
            </View>

            <View style={styles.dialogueContent}>
              <Text style={styles.dialogueText}>
                {dialogues[currentDialogue].text}
              </Text>
              <Text style={styles.dialogueSubtext}>
                {dialogues[currentDialogue].subtext}
              </Text>
            </View>

            {/* Dialogue tail pointing to character */}
            <View style={styles.dialogueTail} />
          </Animated.View>
        </View>

        {/* White bar at the bottom */}
        <View style={[styles.whiteBar, { height: WHITE_BAR_HEIGHT }]}>
          <Animated.View
            style={[
              styles.characterContainer,
              {
                transform: [
                  { translateX: characterSlide },
                  { translateY: characterBounce },
                ],
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

        {/* Continue prompt */}
        <Animated.View
          style={[
            styles.continueContainer,
            {
              height: WHITE_BAR_HEIGHT,
              opacity: continueTextOpacity,
            },
          ]}
        >
          <View style={styles.continueBox}>
            <Text style={styles.continueText}>
              {currentDialogue < dialogues.length - 1
                ? "👆 Tap anywhere to continue"
                : "🎮 Tap to start your adventure"}
            </Text>
            <View style={styles.continueIndicator}>
              <Text style={styles.pageIndicator}>
                {currentDialogue + 1} / {dialogues.length}
              </Text>
            </View>
          </View>
        </Animated.View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  dialogueBox: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: Math.min(width * 0.06, 24),
    width: "100%",
    maxWidth: 400,
    minWidth: 280,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    marginTop: Math.min(height * 0.05, 40),
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFA85C",
    position: "relative",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#e0e0e0",
    borderWidth: 2,
    borderColor: "#bdbdbd",
  },
  progressDotActive: {
    backgroundColor: "#FFA85C",
    borderColor: "#ff8c00",
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  progressDotCompleted: {
    backgroundColor: "#1DB954",
    borderColor: "#15803d",
  },
  dialogueContent: {
    width: "100%",
    alignItems: "center",
  },
  dialogueText: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.05, 20),
    color: "#222",
    lineHeight: Math.min(width * 0.07, 28),
    textAlign: "center",
    marginBottom: 8,
  },
  dialogueSubtext: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.035, 14),
    color: "#666",
    lineHeight: Math.min(width * 0.05, 20),
    textAlign: "center",
    fontStyle: "italic",
  },
  dialogueTail: {
    position: "absolute",
    bottom: -15,
    left: Math.min(width * 0.08, 40),
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 15,
    borderStyle: "solid",
    backgroundColor: "transparent",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFA85C",
  },
  whiteBar: {
    width: "100%",
    backgroundColor: "#fff",
    position: "absolute",
    bottom: Math.min(height * 0.12, 100),
    left: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    zIndex: 2,
    paddingLeft: Math.min(width * 0.06, 24),
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },
  characterContainer: {
    width: Math.min(width * 0.3, 140),
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
    bottom: Math.min(height * 0.12, 100),
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
    paddingHorizontal: 20,
  },
  continueBox: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  continueText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.035, 14),
    textAlign: "center",
    letterSpacing: 0.5,
  },
  continueIndicator: {
    marginTop: 4,
  },
  pageIndicator: {
    color: "#FFA85C",
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.03, 11),
    letterSpacing: 1,
  },
  sparkle: {
    position: "absolute",
    zIndex: 1,
  },
  sparkleText: {
    fontSize: Math.min(width * 0.08, 32),
  },
});
