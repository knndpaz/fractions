import React, { useState, useEffect, useRef } from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
  Modal,
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

// Stages per level configuration (from original LevelSelect.js)
const stagesPerLevel = {
  1: 2,
  2: 2,
  3: 2,
};

// Burger Menu Component (converted to React Native)
const BurgerMenu = ({ visible, onClose, onLogout, onReset, onLeaderboards }) => {
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

// Animated Level Card Component
const AnimatedLevelCard = ({
  level,
  isUnlocked,
  isCompleted,
  completedStages,
  onPress,
  delay = 0,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        delay,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow animation for completed levels
    if (isCompleted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isCompleted]);

  const handlePress = () => {
    if (!isUnlocked) return;

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => onPress(), 100);
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  // Use dynamic require for images to prevent bundler issues
  const getLevelImage = (levelNum) => {
    try {
      switch (levelNum) {
        case 1:
          return require("../assets/level1.png");
        case 2:
          return require("../assets/level2.png");
        case 3:
          return require("../assets/level3.png");
        default:
          return null;
      }
    } catch (e) {
      return null;
    }
  };

  const levelInfo = {
    1: {
      name: "THE FOOD FOREST",
      color: "#4CAF50",
      shadowColor: "#2E7D32",
      icon: "🌳",
    },
    2: {
      name: "THE POTION RIVER",
      color: "#2196F3",
      shadowColor: "#1565C0",
      icon: "🧪",
    },
    3: {
      name: "BROKEN COMMUNITY HOUSES",
      color: "#FF5722",
      shadowColor: "#D84315",
      icon: "🏘️",
    },
  };

  const currentLevel = levelInfo[level];
  const levelImage = getLevelImage(level);
  const lockImage = (() => {
    try {
      return require("../assets/lock.png");
    } catch (e) {
      return null;
    }
  })();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={!isUnlocked}
    >
      <Animated.View
        style={[
          styles.levelCard,
          {
            borderColor: isUnlocked ? currentLevel.color : "#999",
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          },
          !isUnlocked && styles.levelCardLocked,
        ]}
      >
        {/* Lock Overlay */}
        {!isUnlocked && (
          <View style={styles.lockOverlayCard}>
            {lockImage && (
              <Image source={lockImage} style={styles.lockIconLarge} />
            )}
            <Text style={styles.lockText}>Complete Level {level - 1}</Text>
          </View>
        )}

        {/* Glow effect for completed */}
        {isCompleted && (
          <Animated.View
            style={[
              styles.completedGlow,
              {
                opacity: glowOpacity,
                backgroundColor: currentLevel.color,
              },
            ]}
          />
        )}

        {/* Top Section */}
        <View style={styles.levelCardTop}>
          <View style={[styles.levelBadge, { backgroundColor: "#ffa75c" }]}>
            <Text style={styles.levelBadgeText}>LEVEL {level}</Text>
          </View>
          {isCompleted && (
            <View style={styles.starContainer}>
              <Text style={styles.starIcon}>⭐</Text>
            </View>
          )}
        </View>

        {/* Middle Section - Level Icon */}
        <View style={styles.levelIconSection}>
          <View
            style={[
              styles.levelIconCircle,
              {
                borderColor: isUnlocked ? currentLevel.color : "#ddd",
                shadowColor: isUnlocked ? currentLevel.shadowColor : "#000",
              },
            ]}
          >
            {levelImage && (
              <Image source={levelImage} style={styles.levelIconImage} />
            )}
          </View>
        </View>

        {/* Bottom Section */}
        <View style={styles.levelCardBottom}>
          {isUnlocked ? (
            <>
              <Text style={styles.levelIconEmoji}>{currentLevel.icon}</Text>
              <Text style={styles.levelNameText}>{currentLevel.name}</Text>

              {/* Progress dots */}
              <View style={styles.progressDots}>
                {[1, 2].map((stage) => (
                  <View
                    key={stage}
                    style={[
                      styles.progressDot,
                      {
                        backgroundColor:
                          stage <= completedStages
                            ? currentLevel.color
                            : "#e0e0e0",
                        borderColor:
                          stage <= completedStages
                            ? currentLevel.shadowColor
                            : "#bdbdbd",
                      },
                    ]}
                  />
                ))}
              </View>

              <Text style={styles.stagesCompletedText}>
                {completedStages}/{stagesPerLevel[level]} Stages Completed
              </Text>
            </>
          ) : (
            <Text style={styles.lockedPlaceholder}>???</Text>
          )}
        </View>

        {/* Action Button */}
        {isUnlocked && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: currentLevel.color },
            ]}
            onPress={handlePress}
          >
            <Text style={styles.actionButtonText}>
              {isCompleted ? "✓ REPLAY" : "▶ PLAY"}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function LevelSelect({ navigation, route }) {
  const { selectedCharacter: routeSelectedCharacter } = route?.params || {};
  const [menuOpen, setMenuOpen] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [userData, setUserData] = useState(null);
  const [characterIndex, setCharacterIndex] = useState(
    routeSelectedCharacter || 2
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
    wrongAnswers: 0 
  });
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [completedLevels, setCompletedLevels] = useState({
    1: false,
    2: false,
    3: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Get character images dynamically
  const getCharacterImage = (index) => {
    try {
      const images = [
        require("../assets/chara1.png"),
        require("../assets/chara2.png"),
        require("../assets/chara3.png"),
        require("../assets/chara4.png"),
        require("../assets/chara5.png"),
        require("../assets/chara6.png"),
      ];
      return images[index] || images[0];
    } catch (e) {
      return null;
    }
  };

  const headerSlide = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUserData();
    loadProgress();
    animateEntrance();

    if (navigation) {
      const unsubscribe = navigation.addListener("focus", () => {
        loadProgress();
      });
      return unsubscribe;
    }
  }, [navigation]);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(headerSlide, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(contentFade, {
        toValue: 1,
        delay: 200,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

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
              setCharacterIndex(studentData?.character_index || 2);
            } catch (e) {
              console.log("Could not fetch character from supabase");
              setCharacterIndex(2);
            }
          } else {
            setCharacterIndex(2);
          }
        } else {
          setCharacterIndex(2);
        }
      } else {
        // Set default user data for demo
        setUserData({
          fullName: "Adventurer",
          username: "player123",
        });
        setCharacterIndex(2);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setUserData({
        fullName: "Adventurer",
        username: "player123",
      });
      setCharacterIndex(2);
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
              window.location.reload();
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
        Alert.alert(
          "Level " + levelGroup,
          levelDialogues[levelGroup].dialogueText
        );
      }
    } else {
      const previousLevel = levelGroup - 1;
      Alert.alert(
        `Level ${levelGroup} Locked`,
        `Complete all stages of Level ${previousLevel} first to unlock Level ${levelGroup}!`,
        [{ text: "OK" }]
      );
    }
  };

  const isLevelGroupUnlocked = (levelGroup) => {
    if (levelGroup === 1) return true;
    return isLevelGroupCompleted(levelGroup - 1);
  };

  const isLevelGroupCompleted = (levelGroup) => {
    const levelProgress = allProgress[`level${levelGroup}`] || [];
    // A level group is completed when stage 3 is unlocked (meaning both stages 1 and 2 are done)
    // stagesPerLevel[levelGroup] is 2, but we need to check for stage 3 being unlocked
    return levelProgress.includes(stagesPerLevel[levelGroup] + 1);
  };

  const getCompletedStagesCount = (levelGroup) => {
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
  };

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
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Adventure...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <ImageBackground
        source={bgImage}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Overlay */}
        <View style={styles.overlay} />

        <View style={styles.mainWrapper}>
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: headerSlide }]}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setMenuOpen(true)}
              >
                <Text style={styles.menuIcon}>☰</Text>
              </TouchableOpacity>
              {faviconImage && (
                <Image source={faviconImage} style={styles.logo} />
              )}
            </View>

            <TouchableOpacity
              style={[styles.musicButton, !musicOn && styles.musicButtonOff]}
              onPress={() => setMusicOn(!musicOn)}
            >
              <Text style={styles.musicIcon}>♪</Text>
              {!musicOn && <View style={styles.musicSlash} />}
            </TouchableOpacity>
          </Animated.View>

          <BurgerMenu
            visible={menuOpen}
            onClose={() => setMenuOpen(false)}
            onLogout={handleLogout}
            onReset={handleReset}
            onLeaderboards={handleLeaderboards}
          />

          {/* Main Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            nestedScrollEnabled={true}
          >
            <Animated.View style={{ opacity: contentFade }}>
              {/* Character Hero Section */}
              <View style={styles.characterSection}>
                <View style={styles.characterGlow} />
                <View style={styles.characterContainer}>
                  {getCharacterImage(characterIndex) && (
                    <Image
                      source={getCharacterImage(characterIndex)}
                      style={styles.characterImage}
                    />
                  )}
                </View>
                <View style={styles.userInfoCard}>
                  <Text style={styles.userName}>
                    {userData?.fullName || "Adventurer"}
                  </Text>
                  <Text style={styles.userHandle}>
                    @{userData?.username || "player"}
                  </Text>
                </View>
              </View>

              {/* Journey Header */}
              <View style={styles.journeyHeader}>
                <Text style={styles.journeyTitle}>⚔️ YOUR JOURNEY ⚔️</Text>
                <Text style={styles.journeySubtitle}>
                  Choose your next adventure
                </Text>
              </View>

              {/* Level Cards */}
              <View style={styles.levelsContainer}>
                <AnimatedLevelCard
                  level={1}
                  isUnlocked={true}
                  isCompleted={isLevelGroupCompleted(1)}
                  completedStages={getCompletedStagesCount(1)}
                  onPress={() => handleLevelPress(1)}
                  delay={100}
                />
                <AnimatedLevelCard
                  level={2}
                  isUnlocked={isLevelGroupUnlocked(2)}
                  isCompleted={isLevelGroupCompleted(2)}
                  completedStages={getCompletedStagesCount(2)}
                  onPress={() => handleLevelPress(2)}
                  delay={200}
                />
                <AnimatedLevelCard
                  level={3}
                  isUnlocked={isLevelGroupUnlocked(3)}
                  isCompleted={isLevelGroupCompleted(3)}
                  completedStages={getCompletedStagesCount(3)}
                  onPress={() => handleLevelPress(3)}
                  delay={300}
                />
              </View>

              {/* Stats Panel */}
              <View style={styles.statsPanel}>
                <Text style={styles.statsTitle}>📊 ADVENTURE STATS</Text>

                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>
                      {completionPercentage}%
                    </Text>
                    <Text style={styles.statLabel}>Complete</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{userStats.accuracy}%</Text>
                    <Text style={styles.statLabel}>Accuracy</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>
                      {userStats.totalAttempts}
                    </Text>
                    <Text style={styles.statLabel}>Attempts</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressSection}>
                  <Text style={styles.progressLabel}>Quest Progress</Text>
                  <View style={styles.progressBarOuter}>
                    <View
                      style={[
                        styles.progressBarInner,
                        { width: `${completionPercentage}%` },
                      ]}
                    />
                    <Text style={styles.progressText}>
                      {completionPercentage}%
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </View>
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
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(75, 0, 130, 0.3)",
  },
  mainWrapper: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4B0082",
  },
  loadingText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === "web"
        ? 12
        : StatusBar.currentHeight
        ? StatusBar.currentHeight + 12
        : 50,
    paddingBottom: 12,
    backgroundColor: "#ffa75c",
    zIndex: 100,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuIcon: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  musicButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  musicButtonOff: {
    opacity: 0.5,
  },
  musicIcon: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
  musicSlash: {
    position: "absolute",
    width: 32,
    height: 2,
    backgroundColor: "#fff",
    transform: [{ rotate: "45deg" }],
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
    paddingBottom: 40,
  },
  characterSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  characterGlow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#FFD700",
    opacity: 0.5,
    top: 24,
  },
  characterContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 12,
    borderWidth: 4,
    borderColor: "#ffa75c",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  characterImage: {
    width: 128,
    height: 176,
    resizeMode: "contain",
  },
  userInfoCard: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 3,
    borderColor: "#ffa75c",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  userHandle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    textAlign: "center",
  },
  journeyHeader: {
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  journeyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  journeySubtitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    opacity: 0.95,
  },
  levelsContainer: {
    paddingHorizontal: 16,
  },
  levelCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 4,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: "relative",
    overflow: "hidden",
  },
  levelCardLocked: {
    backgroundColor: "rgba(180, 180, 180, 0.85)",
    opacity: 0.6,
  },
  lockOverlayCard: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderRadius: 24,
  },
  lockIconLarge: {
    width: 60,
    height: 60,
    marginBottom: 12,
    tintColor: "#fff",
  },
  lockText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  completedGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  levelCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  levelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  levelBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1.5,
  },
  starContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFD700",
    borderWidth: 3,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  starIcon: {
    fontSize: 20,
  },
  levelIconSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  levelIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  levelIconImage: {
    width: 64,
    height: 64,
    resizeMode: "contain",
  },
  levelCardBottom: {
    alignItems: "center",
    minHeight: 80,
    justifyContent: "center",
  },
  levelIconEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  levelNameText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  progressDots: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  progressDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  stagesCompletedText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
  },
  lockedPlaceholder: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#bbb",
    letterSpacing: 8,
  },
  actionButton: {
    width: "100%",
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1.5,
  },
  statsPanel: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    borderWidth: 4,
    borderColor: "#ffa75c",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 1.5,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  statBox: {
    backgroundColor: "#f8f8f8",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#e0e0e0",
    minWidth: width * 0.25,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffa75c",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressSection: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
  },
  progressBarOuter: {
    height: 24,
    backgroundColor: "#e0e0e0",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  progressBarInner: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    backgroundColor: "#ffa75c",
    borderRadius: 12,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    zIndex: 10,
  },
});