import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  Alert,
  Modal,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LevelProgress } from "../utils/levelProgress";

// Conditional import for supabase (only if available)
let supabase;
try {
  const supabaseModule = require("../supabase");
  supabase = supabaseModule.supabase;
} catch (e) {
  console.log("Supabase not available");
  supabase = null;
}

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width * 0.75;
const CARD_SPACING = 15;

// Stages per level configuration
const stagesPerLevel = {
  1: 2,
  2: 2,
  3: 2,
};

// Burger Menu Component (converted to React Native)
const BurgerMenu = ({
  visible,
  onClose,
  onLogout,
  onReset,
  onLeaderboards,
}) => {
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

          <TouchableOpacity style={styles.menuItem} onPress={onLeaderboards}>
            <Text style={styles.menuItemIcon}>🏆</Text>
            <Text style={styles.menuItemText}>Leaderboards</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onReset}>
            <Text style={styles.menuItemIcon}>🔄</Text>
            <Text style={styles.menuItemText}>Reset Progress</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
            <Text style={styles.menuItemIcon}>⚡</Text>
            <Text style={styles.menuItemText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

export default function AdventureGame({ navigation, route }) {
  const { selectedCharacter: routeSelectedCharacter } = route?.params || {};
  const [menuOpen, setMenuOpen] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [userData, setUserData] = useState(null);
  const [characterIndex, setCharacterIndex] = useState(
    routeSelectedCharacter || 0
  );
  const [allProgress, setAllProgress] = useState({
    level1: [1],
    level2: [],
    level3: [],
  });
  const [userStats, setUserStats] = useState({
    accuracy: 0,
    totalAttempts: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
  });
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [completedLevels, setCompletedLevels] = useState({
    1: false,
    2: false,
    3: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const scrollViewRef = useRef(null);

  // Get character images dynamically
  const getCharacterImage = (index) => {
    try {
      const images = [
        require("../assets/player1.png"),
        require("../assets/player2.png"),
        require("../assets/player3.png"),
        require("../assets/player4.png"),
      ];
      return images[index] || images[0];
    } catch (e) {
      return null;
    }
  };

  // Get level background images
  const getLevelBackgroundImage = (levelNum) => {
    try {
      switch (levelNum) {
        case 1:
          return require("../assets/foodforest.jpg");
        case 2:
          return require("../assets/potionriver.jpg");
        case 3:
          return require("../assets/brokenhouses.jpg");
        default:
          return null;
      }
    } catch (e) {
      return null;
    }
  };

  const levels = [
    {
      id: 1,
      difficulty: "Easy",
      title: "The Food Forest",
      levelGroup: 1,
      isUnlocked: true,
      isCompleted: completedLevels[1],
      completedStages: getCompletedStagesCount(1),
      backgroundImage: getLevelBackgroundImage(1),
      dialogueText:
        "These food trees dropped their slices! Let's put them together to make whole pizzas again!",
    },
    {
      id: 2,
      difficulty: "Medium",
      title: "The Potion River",
      levelGroup: 2,
      isUnlocked: isLevelGroupUnlocked(2),
      isCompleted: completedLevels[2],
      completedStages: getCompletedStagesCount(2),
      backgroundImage: getLevelBackgroundImage(2),
      dialogueText:
        "Oh, no! this river is filled with potions! Let's clean it, by pouring substances. Let's add the right fractions to create a perfect cleaning substance!",
    },
    {
      id: 3,
      difficulty: "Difficult",
      title: "Broken Community Houses",
      levelGroup: 3,
      isUnlocked: isLevelGroupUnlocked(3),
      isCompleted: completedLevels[3],
      completedStages: getCompletedStagesCount(3),
      backgroundImage: getLevelBackgroundImage(3),
      dialogueText:
        "Uh-oh…. The houses are still broken. To make the neighborhood whole again, we need to add dissimilar fractions.",
    },
  ];

  useEffect(() => {
    loadUserData();
    loadProgress();

    if (navigation) {
      const unsubscribe = navigation.addListener("focus", () => {
        loadProgress();
      });
      return unsubscribe;
    }
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const storedUserData = await AsyncStorage.getItem("userData");
      if (storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        setUserData(parsedUserData);

        // Fetch character index from database if supabase is available
        if (supabase) {
          const userId = parsedUserData.id || parsedUserData.user_id;
          if (userId) {
            try {
              const { data: studentData } = await supabase
                .from("students")
                .select("character_index")
                .eq("user_id", userId)
                .single();
              setCharacterIndex(studentData?.character_index || 0);
            } catch (e) {
              console.log("Could not fetch character from supabase");
              setCharacterIndex(routeSelectedCharacter || 0);
            }
          } else {
            setCharacterIndex(routeSelectedCharacter || 0);
          }
        } else {
          setCharacterIndex(routeSelectedCharacter || 0);
        }
      } else {
        // Set default user data for demo
        setUserData({
          fullName: "Super Hero",
          username: "player123",
        });
        setCharacterIndex(routeSelectedCharacter || 0);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setUserData({
        fullName: "Super Hero",
        username: "player123",
      });
      setCharacterIndex(routeSelectedCharacter || 0);
    }
  };

  const loadProgress = async () => {
    try {
      const progress = {
        level1: await LevelProgress.getCompletedLevels(1),
        level2: await LevelProgress.getCompletedLevels(2),
        level3: await LevelProgress.getCompletedLevels(3),
      };
      const stats = await LevelProgress.getUserStats();
      const completion = await LevelProgress.getCompletionPercentage();

      // Debug logging
      console.log("Loaded progress:", progress);
      console.log("Level 1 progress:", progress.level1);
      console.log("Level 2 progress:", progress.level2);
      console.log("Level 3 progress:", progress.level3);
      console.log("User stats:", stats.overall);
      console.log("Completion percentage:", completion);

      setAllProgress(progress);
      setUserStats(stats.overall);
      setCompletionPercentage(completion);
      setCompletedLevels({
        1: progress.level1.includes(3), // Changed to check for stage 3
        2: progress.level2.includes(3), // Changed to check for stage 3
        3: progress.level3.includes(3), // Changed to check for stage 3
      });
      setIsLoading(false);

      if (
        userData &&
        typeof LevelProgress.syncProgressToBackend === "function"
      ) {
        await LevelProgress.syncProgressToBackend(userData);
      }
    } catch (error) {
      console.error("Error loading progress:", error);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setMenuOpen(false);
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("userData");
            if (navigation) {
              navigation.replace("Login");
            } else {
              // For web fallback
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }
          } catch (error) {
            console.error("Error logging out:", error);
          }
        },
      },
    ]);
  };

  const handleReset = async () => {
    setMenuOpen(false);
    Alert.alert(
      "Reset All Levels",
      "This will lock Levels 2 and 3 and set Level 1 back to Stage 1. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("[Reset] Performing reset");
              await LevelProgress.resetProgress();
              await Promise.all(
                [1, 2, 3].map((g) => LevelProgress.getCompletedLevels(g))
              );
              await loadProgress();
              console.log("[Reset] Done");
              Alert.alert("Success", "Progress reset successfully!");
            } catch (error) {
              console.warn("[Reset] Failed:", error?.message || error);
              Alert.alert("Reset Failed", "Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleLeaderboards = () => {
    setMenuOpen(false);
    if (navigation) {
      navigation.navigate("Leaderboard");
    }
  };

  const handleLevelPress = (levelGroup) => {
    console.log("Attempting to navigate to level group:", levelGroup);
    if (isLevelGroupUnlocked(levelGroup)) {
      console.log("Level group unlocked, navigating...");

      // Check if the level is already completed
      const isCompleted = isLevelGroupCompleted(levelGroup);

      const levelDialogues = {
        1: {
          dialogueText:
            "These food trees dropped their slices! Let's put them together to make whole pizzas again!",
          subtext: "",
        },
        2: {
          dialogueText:
            "Oh, no! this river is filled with potions! Let's clean it, by pouring substances. Let's add the right fractions to create a perfect cleaning substance!",
          subtext: "",
        },
        3: {
          dialogueText:
            "Uh-oh…. The houses are still broken. To make the neighborhood whole again, we need to add dissimilar fractions.",
          subtext: "",
        },
      };

      if (navigation) {
        // If level is completed, skip dialogue and go directly to MapLevels
        if (isCompleted) {
          navigation.navigate("MapLevels", {
            levelGroup,
            selectedCharacter: characterIndex,
          });
        } else {
          // If level is not completed, show dialogue first
          navigation.navigate("Dialogue", {
            selectedCharacter: characterIndex,
            ...levelDialogues[levelGroup],
            nextScreen: "MapLevels",
            nextScreenParams: { levelGroup, selectedCharacter: characterIndex },
          });
        }
      } else {
        Alert.alert(`Level ${level.levelGroup}`, level.dialogueText);
      }
    } else {
      const previousLevel = level.levelGroup - 1;
      Alert.alert(
        `Level ${level.levelGroup} Locked`,
        `Complete all stages of Level ${previousLevel} first to unlock Level ${level.levelGroup}!`,
        [{ text: "OK" }]
      );
    }
  };

  function isLevelGroupUnlocked(levelGroup) {
    if (levelGroup === 1) return true;
    return isLevelGroupCompleted(levelGroup - 1);
  }

  function isLevelGroupCompleted(levelGroup) {
    const levelProgress = allProgress[`level${levelGroup}`] || [];
    // A level group is completed when stage 3 is unlocked (meaning both stages 1 and 2 are done)
    // stagesPerLevel[levelGroup] is 2, but we need to check for stage 3 being unlocked
    return levelProgress.includes(stagesPerLevel[levelGroup] + 1);
  }

  function getCompletedStagesCount(levelGroup) {
    const levelProgress = allProgress[`level${levelGroup}`] || [];
    const totalStages = stagesPerLevel[levelGroup]; // Always 2

    if (levelProgress.length === 0) return 0;

    // Logic: If stage N+1 is unlocked, it means stage N was completed
    // Stage 1 is always initially unlocked: [1]
    // After completing stage 1: [1, 2] -> 1 stage completed
    // After completing stage 2: [1, 2, 3] -> 2 stages completed

    let completedCount = 0;

    // Check if stage 2 is unlocked (means stage 1 completed)
    if (levelProgress.includes(2)) {
      completedCount = 1;
    }

    // Check if stage 3 is unlocked (means stage 2 completed)
    if (levelProgress.includes(3)) {
      completedCount = 2;
    }

    return completedCount;
  }

  const getUnlockedLevelsCount = () => {
    let count = 0;
    if (isLevelGroupUnlocked(1)) count++;
    if (isLevelGroupUnlocked(2)) count++;
    if (isLevelGroupUnlocked(3)) count++;
    return count;
  };

  // Get images safely
  const bgImage = (() => {
    try {
      return require("../assets/bg1.png");
    } catch (e) {
      return null;
    }
  })();

  const profileImage = (() => {
    try {
      return require("../assets/profile.png");
    } catch (e) {
      return null;
    }
  })();

  const faviconImage = (() => {
    try {
      return require("../assets/favicon.png");
    } catch (e) {
      return null;
    }
  })();

  if (isLoading) {
    return null; // Return nothing while loading
  }

  return (
    <View style={styles.container}>
      <View style={styles.gradientContainer}>
        {/* Background Image */}
        <Image
          source={require("../assets/bg 1.png")}
          style={styles.backgroundImage}
          resizeMode="cover"
        />

        {/* Animated background elements */}
        <View style={styles.backgroundElements}>
          <View style={[styles.bubble, styles.bubble1]} />
          <View style={[styles.bubble, styles.bubble2]} />
          <View style={[styles.bubble, styles.bubble3]} />
          <View style={[styles.bubble, styles.bubble4]} />

          {/* Clouds */}
          <Text style={[styles.cloud, styles.cloud1]}>☁️</Text>
          <Text style={[styles.cloud, styles.cloud2]}>☁️</Text>
          <Text style={[styles.cloud, styles.cloud3]}>☁️</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          {/* Logo */}
          <Image
            source={require("../assets/favicon.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />

          {/* Music and Burger Menu */}
          <View style={styles.headerButtons}>
            {/* Music Button */}
            <TouchableOpacity
              onPress={() => setMusicOn(!musicOn)}
              style={[
                styles.headerButton,
                { backgroundColor: musicOn ? "#ffa75b" : "#94a3b8" },
              ]}
            >
              <Text style={styles.headerButtonIcon}>
                {musicOn ? "🔊" : "🔇"}
              </Text>
            </TouchableOpacity>

            {/* Burger Menu */}
            <TouchableOpacity
              onPress={() => setMenuOpen(!menuOpen)}
              style={[styles.headerButton, { backgroundColor: "#ffa75b" }]}
            >
              <Text style={styles.headerButtonIcon}>
                {menuOpen ? "✕" : "☰"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <BurgerMenu
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          onLogout={handleLogout}
          onReset={handleReset}
          onLeaderboards={handleLeaderboards}
        />

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Character Section */}
          <View style={styles.characterSection}>
            <View style={styles.characterImageContainer}>
              {getCharacterImage(characterIndex) && (
                <Image
                  source={getCharacterImage(characterIndex)}
                  style={styles.characterImage}
                  resizeMode="contain"
                />
              )}
            </View>
            <Text style={styles.playerName}>
              {userData?.fullName || "Super Hero"}
            </Text>
          </View>

          {/* Section Title */}
          <Text style={styles.sectionTitle}>Pick Your Quest!</Text>

          {/* Carousel */}
          <View style={styles.carouselWrapper}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled={false}
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              snapToInterval={CARD_WIDTH + CARD_SPACING}
              decelerationRate="fast"
              contentContainerStyle={styles.scrollContent}
            >
              {levels.map((level, index) => {
                const isActive = index === activeIndex;
                const isSelected = selectedLevel === level.id;

                return (
                  <View
                    key={level.id}
                    style={[
                      styles.cardContainer,
                      {
                        marginLeft: index === 0 ? (width - CARD_WIDTH) / 2 : 0,
                      },
                      {
                        marginRight:
                          index === levels.length - 1
                            ? (width - CARD_WIDTH) / 2
                            : CARD_SPACING,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.levelCard,
                        isActive && styles.levelCardActive,
                        isSelected && styles.levelCardSelected,
                        !level.isUnlocked && styles.levelCardLocked,
                      ]}
                      onPress={() => handleCardPress(level, index)}
                      activeOpacity={level.isUnlocked ? 0.8 : 1}
                      disabled={!level.isUnlocked}
                    >
                      {/* Background Image */}
                      {level.backgroundImage && (
                        <Image
                          source={level.backgroundImage}
                          style={styles.cardBackgroundImage}
                          resizeMode="cover"
                        />
                      )}

                      {/* Lock Overlay */}
                      {!level.isUnlocked && (
                        <View style={styles.lockOverlay}>
                          <Text style={styles.lockIcon}>🔒</Text>
                          <Text style={styles.lockText}>Locked</Text>
                        </View>
                      )}

                      {/* Card Content */}
                      <View style={styles.cardContent}>
                        <View style={styles.difficultyBadge}>
                          <Text style={styles.difficultyText}>
                            {level.difficulty}
                          </Text>
                        </View>

                        <Text style={styles.cardTitle}>{level.title}</Text>

                        {level.isCompleted && (
                          <View style={styles.completedBadge}>
                            <Text style={styles.completedText}>
                              ✓ Completed
                            </Text>
                          </View>
                        )}

                        {/* Progress Indicator */}
                        {level.isUnlocked && !level.isCompleted && (
                          <View style={styles.progressIndicator}>
                            <Text style={styles.progressText}>
                              {level.completedStages}/
                              {stagesPerLevel[level.levelGroup]} Stages
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* Dots Indicator */}
          <View style={styles.dotsContainer}>
            {levels.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => scrollToIndex(index)}
                style={[styles.dot, index === activeIndex && styles.dotActive]}
              />
            ))}
          </View>

          {/* Stats Section - Single Row */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{completionPercentage}%</Text>
              <Text style={styles.statLabel}>Progress</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.accuracy}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{100 - userStats.accuracy}%</Text>
              <Text style={styles.statLabel}>Mistakes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userStats.totalAttempts}</Text>
              <Text style={styles.statLabel}>Attempts</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#87CEEB",
  },
  gradientContainer: {
    flex: 1,
    backgroundColor: "#c084fc",
    position: "relative",
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  backgroundElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 600,
    pointerEvents: "none",
  },
  bubble: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.6,
  },
  bubble1: {
    top: 20,
    left: 10,
    width: 60,
    height: 60,
    backgroundColor: "#fde047",
  },
  bubble2: {
    top: 100,
    right: 20,
    width: 50,
    height: 50,
    backgroundColor: "#f9a8d4",
  },
  bubble3: {
    top: 200,
    left: 30,
    width: 70,
    height: 70,
    backgroundColor: "#93c5fd",
  },
  bubble4: {
    top: 150,
    right: 15,
    width: 40,
    height: 40,
    backgroundColor: "#86efac",
  },
  cloud: {
    position: "absolute",
    fontSize: 36,
    opacity: 0.8,
  },
  cloud1: {
    top: 50,
    left: "20%",
  },
  cloud2: {
    top: 120,
    right: "20%",
    fontSize: 32,
  },
  cloud3: {
    top: 30,
    right: 30,
    fontSize: 28,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 20,
    zIndex: 50,
  },
  logoImage: {
    width: 50,
    height: 50,
    borderRadius: 14,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  headerButtonIcon: {
    fontSize: 22,
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
  mainContent: {
    flex: 1,
    paddingTop: 5,
    justifyContent: "space-between",
  },
  characterSection: {
    alignItems: "center",
    marginBottom: 8,
  },
  characterImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ffa75b",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    marginBottom: 10,
  },
  characterImage: {
    width: 110,
    height: 110,
  },
  playerName: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  carouselWrapper: {
    height: height * 0.28,
    marginBottom: 10,
  },
  scrollContent: {
    alignItems: "center",
    paddingVertical: 10,
  },
  cardContainer: {
    width: CARD_WIDTH,
  },
  levelCard: {
    width: CARD_WIDTH,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    opacity: 1,
    overflow: "hidden",
  },
  levelCardActive: {
    borderColor: "#ffa75b",
  },
  levelCardSelected: {
    borderColor: "#ffa75b",
    borderWidth: 4,
  },
  levelCardLocked: {
    backgroundColor: "rgba(150, 150, 150, 0.5)",
  },
  cardBackgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.3,
  },
  lockOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  lockIcon: {
    fontSize: 50,
    marginBottom: 8,
  },
  lockText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  difficultyBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#ffa75b",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
  },
  difficultyText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#333",
    textAlign: "center",
  },
  completedBadge: {
    alignSelf: "center",
    backgroundColor: "#4ade80",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
  },
  completedText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  progressIndicator: {
    alignSelf: "center",
    backgroundColor: "#64b5f6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotActive: {
    width: 24,
    backgroundColor: "#ffffff",
  },
  statsSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    width: 2,
    height: 30,
    backgroundColor: "#e0e0e0",
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "900",
    color: "#ffa75b",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#666",
  },
});
