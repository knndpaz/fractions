import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Image,
  Alert,
  Dimensions,
  Animated,
  Platform,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useMusic } from "../App";
import { LevelProgress } from "../utils/levelProgress";

const { width, height } = Dimensions.get("window");

// Responsive scaling functions
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

const BurgerMenu = ({ visible, onClose, onNavigateToLevelSelect }) => {
  const slideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
    >
      {/* Overlay */}
      <TouchableOpacity
        style={styles.menuOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.menuContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>MENU</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={onNavigateToLevelSelect}
          >
            <Text style={styles.menuItemIcon}>🏠</Text>
            <Text style={styles.menuItemText}>Go Back to Level Select</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

export default function MapLevels({ navigation, route }) {
  const { switchToBackgroundMusic } = useMusic();
  const levelGroup = Number(route?.params?.levelGroup || 1);
  const selectedCharacter = route?.params?.selectedCharacter || 0;
  const [unlockedLevels, setUnlockedLevels] = useState([1]);
  const [menuOpen, setMenuOpen] = useState(false);

  // Animation refs
  const bounceAnims = useRef([1, 2].map(() => new Animated.Value(0))).current;
  const pulseAnims = useRef([1, 2].map(() => new Animated.Value(1))).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadUnlocked = useCallback(async () => {
    const list = await LevelProgress.getCompletedLevels(levelGroup);
    setUnlockedLevels(list);
  }, [levelGroup]);

  useEffect(() => {
    loadUnlocked();
    startAnimations();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [loadUnlocked]);

  useFocusEffect(
    useCallback(() => {
      loadUnlocked();
      switchToBackgroundMusic();
    }, [loadUnlocked, switchToBackgroundMusic])
  );

  const startAnimations = () => {
    // Bounce animations for unlocked stages
    bounceAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: -8,
            duration: 1200 + index * 200,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 1200 + index * 200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Pulse animations for unlocked stages
    pulseAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1.1,
            duration: 1000 + index * 150,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1000 + index * 150,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

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
  };

  const resetProgress = useCallback(async () => {
    Alert.alert(
      "Reset Progress",
      "Are you sure you want to reset all progress for this level? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              const ok = await LevelProgress.resetProgress(levelGroup);
              if (ok) {
                await loadUnlocked();
                Alert.alert(
                  "Success",
                  "Progress has been reset. Only stage 1 is unlocked."
                );
              } else {
                Alert.alert("Failed", "Could not reset progress. Check logs.");
              }
            } catch (e) {
              console.error("Reset error:", e);
              Alert.alert("Error", e?.message || "Unexpected error");
            }
          },
        },
      ]
    );
  }, [levelGroup, loadUnlocked]);

  const handleLevelPress = (stage) => {
    if (isStageUnlocked(stage)) {
      // Add a small scale animation on press
      Animated.sequence([
        Animated.timing(pulseAnims[stage - 1], {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnims[stage - 1], {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      navigation.navigate("Quiz", {
        stage: stage,
        levelGroup: levelGroup,
        selectedCharacter: selectedCharacter,
      });
    } else {
      Alert.alert(
        "🔒 Stage Locked",
        `Complete stage ${stage - 1} first to unlock this stage!`,
        [{ text: "OK" }]
      );
    }
  };

  const isStageUnlocked = (stage) => {
    if (stage === 1) return true;
    return LevelProgress.isLevelUnlocked(stage, unlockedLevels);
  };

  const testUnlockStage2 = async () => {
    try {
      const result = await LevelProgress.completeLevel(levelGroup, 1, true);
      await loadUnlocked();
      Alert.alert("✅ Test Complete", "Stage 2 should now be unlocked");
    } catch (error) {
      console.error("Test error:", error);
      Alert.alert("❌ Test Failed", error?.message || "Unknown error");
    }
  };

  // Responsive stage positions
  const allStages = [
    {
      number: 1,
      left: scale(140),
      top: verticalScale(520),
      icon: "🎯",
    },
    {
      number: 2,
      left: scale(210),
      top: verticalScale(340),
      icon: "⭐",
    },
  ];

  const getStageColor = (stage) => {
    if (isStageUnlocked(stage)) {
      return stage === 1 ? "#1DB954" : "#FFA85C";
    }
    return "#888";
  };

  const getStageGradient = (stage) => {
    if (isStageUnlocked(stage)) {
      return stage === 1 ? "#15803d" : "#ff8c00";
    }
    return "#666";
  };

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  const sparkleRotate = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleNavigateToLevelSelect = () => {
    setMenuOpen(false);
    navigation.navigate("LevelSelect", {
      selectedCharacter: selectedCharacter,
    });
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../assets/map 1.png")}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Gradient overlay for better contrast */}
        <View style={styles.gradientOverlay} />

        {/* Animated sparkles */}
        <Animated.View
          style={[
            styles.sparkle,
            {
              top: verticalScale(150),
              left: scale(50),
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
              top: verticalScale(300),
              right: scale(40),
              opacity: sparkleOpacity,
              transform: [{ rotate: sparkleRotate }],
            },
          ]}
        >
          <Text style={styles.sparkleText}>💫</Text>
        </Animated.View>

        {/* Back/Menu Button */}
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setMenuOpen(true)}
          activeOpacity={0.8}
        >
          <Image
            source={require("../assets/menu.png")}
            style={styles.menuIcon}
          />
        </TouchableOpacity>

        {/* Burger Menu */}
        <BurgerMenu
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigateToLevelSelect={handleNavigateToLevelSelect}
        />

        {/* Reset Button (for testing) */}
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={resetProgress}
          activeOpacity={0.8}
        >
          <Text style={styles.resetBtnText}>🔄 Reset</Text>
        </TouchableOpacity>

        {/* Test Button to unlock stage 2 */}
        <TouchableOpacity
          style={[styles.testBtn]}
          onPress={testUnlockStage2}
          activeOpacity={0.8}
        >
          <Text style={styles.resetBtnText}>🧪 Test</Text>
        </TouchableOpacity>

        {/* Enhanced Progress Card */}
        <Animated.View style={[styles.progressCard, { opacity: fadeAnim }]}>
          <View style={styles.progressHeader}>
            <Text style={styles.levelTitle}>Level {levelGroup}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unlockedLevels.length}/{allStages.length}
              </Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${(unlockedLevels.length / allStages.length) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressSubtext}>
            {unlockedLevels.length === allStages.length
              ? "🎉 All stages completed!"
              : `Complete stage ${unlockedLevels.length} to unlock more!`}
          </Text>
        </Animated.View>

        {/* Stage Buttons with Path */}
        {allStages.map((stageData, index) => {
          const isUnlocked = isStageUnlocked(stageData.number);
          const prevStage = index > 0 ? allStages[index - 1] : null;

          return (
            <React.Fragment key={stageData.number}>
              {/* Path line to previous stage */}
              {prevStage && (
                <View
                  style={[
                    styles.pathLine,
                    {
                      left: prevStage.left + moderateScale(24),
                      top: prevStage.top + moderateScale(24),
                      width: Math.sqrt(
                        Math.pow(stageData.left - prevStage.left, 2) +
                          Math.pow(stageData.top - prevStage.top, 2)
                      ),
                      transform: [
                        {
                          rotate: `${Math.atan2(
                            stageData.top - prevStage.top,
                            stageData.left - prevStage.left
                          )}rad`,
                        },
                      ],
                      backgroundColor: isUnlocked ? "#1DB954" : "#ccc",
                    },
                  ]}
                />
              )}

              {/* Stage Button */}
              <Animated.View
                style={[
                  styles.stageBtnContainer,
                  {
                    left: stageData.left,
                    top: stageData.top,
                    transform: [
                      { translateY: isUnlocked ? bounceAnims[index] : 0 },
                      { scale: isUnlocked ? pulseAnims[index] : 1 },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.stageBtn,
                    {
                      backgroundColor: getStageColor(stageData.number),
                      opacity: isUnlocked ? 1 : 0.6,
                    },
                  ]}
                  onPress={() => handleLevelPress(stageData.number)}
                  disabled={!isUnlocked}
                  activeOpacity={0.8}
                >
                  {/* Inner shadow for depth */}
                  <View
                    style={[
                      styles.stageBtnInner,
                      { backgroundColor: getStageGradient(stageData.number) },
                    ]}
                  />

                  <View style={styles.stageContent}>
                    <Text style={styles.stageIcon}>{stageData.icon}</Text>
                    <Text style={styles.stageBtnText}>{stageData.number}</Text>
                  </View>

                  {!isUnlocked && (
                    <View style={styles.lockOverlay}>
                      <Text style={styles.lockIcon}>🔒</Text>
                    </View>
                  )}

                  {isUnlocked && <View style={styles.glowEffect} />}
                </TouchableOpacity>

                {/* Stage label */}
                <View style={styles.stageLabel}>
                  <Text style={styles.stageLabelText}>
                    Stage {stageData.number}
                  </Text>
                </View>
              </Animated.View>
            </React.Fragment>
          );
        })}
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
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  menuBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? verticalScale(50) : verticalScale(40),
    left: scale(20),
    zIndex: 10,
    width: moderateScale(56),
    height: moderateScale(56),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFA85C",
    borderRadius: moderateScale(16),
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: moderateScale(3),
    borderColor: "#fff",
  },
  menuIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    resizeMode: "contain",
  },
  resetBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? verticalScale(50) : verticalScale(40),
    right: scale(20),
    zIndex: 10,
    backgroundColor: "#FF6B6B",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(12),
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    borderWidth: moderateScale(2),
    borderColor: "#fff",
  },
  testBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? verticalScale(50) : verticalScale(40),
    right: scale(100),
    zIndex: 10,
    backgroundColor: "#6B5FFF",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(12),
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    borderWidth: moderateScale(2),
    borderColor: "#fff",
  },
  resetBtnText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(12),
  },
  progressCard: {
    position: "absolute",
    top: Platform.OS === "ios" ? verticalScale(120) : verticalScale(110),
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(20),
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(16),
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    minWidth: scale(280),
    borderWidth: moderateScale(3),
    borderColor: "#FFA85C",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  levelTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(20),
    color: "#222",
  },
  badge: {
    backgroundColor: "#FFA85C",
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    elevation: 4,
  },
  badgeText: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(14),
    color: "#fff",
  },
  progressBar: {
    width: "100%",
    height: verticalScale(10),
    backgroundColor: "#e0e0e0",
    borderRadius: moderateScale(5),
    overflow: "hidden",
    marginBottom: verticalScale(8),
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#1DB954",
    borderRadius: moderateScale(5),
  },
  progressSubtext: {
    fontFamily: "Poppins-Regular",
    fontSize: moderateScale(12),
    color: "#666",
    textAlign: "center",
  },
  pathLine: {
    position: "absolute",
    height: moderateScale(4),
    backgroundColor: "#ccc",
    zIndex: 1,
    borderRadius: moderateScale(2),
  },
  stageBtnContainer: {
    position: "absolute",
    zIndex: 5,
    alignItems: "center",
  },
  stageBtn: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: moderateScale(4),
    borderColor: "#fff",
    overflow: "hidden",
  },
  stageBtnInner: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "30%",
    opacity: 0.5,
  },
  stageContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  stageIcon: {
    fontSize: moderateScale(20),
    marginBottom: verticalScale(2),
  },
  stageBtnText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(18),
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  lockOverlay: {
    position: "absolute",
    top: moderateScale(-8),
    right: moderateScale(-8),
    backgroundColor: "#fff",
    borderRadius: moderateScale(16),
    width: moderateScale(28),
    height: moderateScale(28),
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: moderateScale(2),
    borderColor: "#888",
  },
  lockIcon: {
    fontSize: moderateScale(14),
  },
  glowEffect: {
    position: "absolute",
    width: "120%",
    height: "120%",
    borderRadius: moderateScale(40),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  stageLabel: {
    marginTop: verticalScale(8),
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  stageLabelText: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(11),
    color: "#222",
    textAlign: "center",
  },
  sparkle: {
    position: "absolute",
    zIndex: 1,
  },
  sparkleText: {
    fontSize: moderateScale(32),
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  menuContainer: {
    width: 280,
    height: "100%",
    backgroundColor: "#fff",
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#f0f0f0",
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    letterSpacing: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 24,
    color: "#666",
    fontWeight: "bold",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
});
