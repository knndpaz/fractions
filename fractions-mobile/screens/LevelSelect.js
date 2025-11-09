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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LevelProgress } from "../utils/levelProgress";

const { width, height } = Dimensions.get("window");

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

  const levelImages = {
    1: require("../assets/level1.png"),
    2: require("../assets/level2.png"),
    3: require("../assets/level3.png"),
  };

  const levelInfo = {
    1: {
      name: "THE FOOD FOREST",
      color: "#4CAF50", // Green for forest
      gradient: "rgba(76, 175, 80, 0.15)",
      icon: "🌳",
    },
    2: {
      name: "THE POTION RIVER",
      color: "#2196F3", // Blue for river
      gradient: "rgba(33, 150, 243, 0.15)",
      icon: "🧪",
    },
    3: {
      name: "BROKEN COMMUNITY HOUSES",
      color: "#FF5722", // Orange-red for broken/danger
      gradient: "rgba(255, 87, 34, 0.15)",
      icon: "🏚️",
    },
  };

  const currentLevel = levelInfo[level];
  const borderColor = isUnlocked ? currentLevel.color : "#bdbdbd";
  const backgroundColor = isUnlocked
    ? currentLevel.gradient
    : "rgba(224, 224, 224, 0.95)";

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
            borderColor: borderColor,
            backgroundColor: backgroundColor,
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          },
          !isUnlocked && styles.levelCardLocked,
        ]}
      >
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

        <View style={styles.levelCardContent}>
          <View
            style={[styles.levelIconContainer, { borderColor: borderColor }]}
          >
            <Image source={levelImages[level]} style={styles.levelIcon} />
            {!isUnlocked && (
              <View style={styles.lockOverlay}>
                <Image
                  source={require("../assets/lock.png")}
                  style={styles.lockIcon}
                />
              </View>
            )}
          </View>

          <View style={styles.levelInfo}>
            <View style={styles.levelTitleRow}>
              <Text style={styles.levelNumber}>LEVEL {level}</Text>
              {isUnlocked && (
                <Text style={styles.levelEmoji}>{currentLevel.icon}</Text>
              )}
            </View>
            {isUnlocked && (
              <Text style={styles.levelName}>{currentLevel.name}</Text>
            )}
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${(completedStages / 4) * 100}%`,
                    backgroundColor: currentLevel.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.stagesText}>
              {isUnlocked
                ? `${completedStages}/4 stages completed`
                : `Complete Level ${level - 1} to unlock`}
            </Text>
          </View>

          <View style={styles.levelStatus}>
            {isUnlocked ? (
              isCompleted ? (
                <View
                  style={[
                    styles.completedBadge,
                    { backgroundColor: currentLevel.color },
                  ]}
                >
                  <Text style={styles.completedText}>✓</Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.playButton,
                    { backgroundColor: currentLevel.color },
                  ]}
                >
                  <Text style={styles.playIcon}>▶</Text>
                </View>
              )
            ) : null}
          </View>
        </View>

        {isCompleted && (
          <View
            style={[
              styles.completedRibbon,
              { backgroundColor: currentLevel.color },
            ]}
          >
            <Text style={styles.ribbonText}>COMPLETED</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function LevelSelect({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [allProgress, setAllProgress] = useState({
    level1: [1],
    level2: [],
    level3: [],
  });
  const [userStats, setUserStats] = useState({ accuracy: 0, totalAttempts: 0 });
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  const headerSlide = useRef(new Animated.Value(-100)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const summarySlide = useRef(new Animated.Value(50)).current;
  const summaryOpacity = useRef(new Animated.Value(0)).current;
  const cloud1Pos = useRef(new Animated.Value(-100)).current;
  const cloud2Pos = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    loadUserData();
    loadProgress();
    animateEntrance();

    const unsubscribe = navigation.addListener("focus", () => {
      loadProgress();
    });

    // Cloud animations
    const animateCloud = (cloudPos, duration) => {
      cloudPos.setValue(-100);
      Animated.loop(
        Animated.timing(cloudPos, {
          toValue: width + 100,
          duration: duration,
          useNativeDriver: true,
        })
      ).start();
    };

    animateCloud(cloud1Pos, 30000);
    animateCloud(cloud2Pos, 35000);

    return unsubscribe;
  }, [navigation]);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(summarySlide, {
        toValue: 0,
        delay: 300,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(summaryOpacity, {
        toValue: 1,
        delay: 300,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadUserData = async () => {
    try {
      const storedUserData = await AsyncStorage.getItem("userData");
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadProgress = async () => {
    try {
      const progress = await LevelProgress.getAllProgress();
      const stats = await LevelProgress.getUserStats();
      const completion = await LevelProgress.getCompletionPercentage();

      setAllProgress(progress);
      setUserStats(stats);
      setCompletionPercentage(completion);

      if (
        userData &&
        typeof LevelProgress.syncProgressToBackend === "function"
      ) {
        await LevelProgress.syncProgressToBackend(userData);
      }
    } catch (e) {
      console.warn("loadProgress failed:", e?.message || e);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("userData");
            navigation.replace("Login");
          } catch (error) {
            console.error("Error logging out:", error);
          }
        },
      },
    ]);
  };

  const handleLevelPress = (levelGroup) => {
    console.log("Attempting to navigate to level group:", levelGroup);
    if (isLevelGroupUnlocked(levelGroup)) {
      console.log("Level group unlocked, navigating...");
      navigation.navigate("MapLevels", { levelGroup });
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
    return (
      allProgress[`level${levelGroup}`] &&
      allProgress[`level${levelGroup}`].length > 0
    );
  };

  const isLevelGroupCompleted = (levelGroup) => {
    const levelProgress = allProgress[`level${levelGroup}`] || [];
    return levelProgress.length >= 4 && levelProgress.includes(4);
  };

  const getCompletedStagesCount = (levelGroup) => {
    const levelProgress = allProgress[`level${levelGroup}`] || [];
    if (levelProgress.length === 0) return 0;
    const maxUnlockedStage = Math.max(...levelProgress);
    return Math.max(0, maxUnlockedStage - 1);
  };

  const getUnlockedLevelsCount = () => {
    let count = 0;
    if (isLevelGroupUnlocked(1)) count++;
    if (isLevelGroupUnlocked(2)) count++;
    if (isLevelGroupUnlocked(3)) count++;
    return count;
  };

  const performReset = async (group) => {
    try {
      console.log("[Reset] Performing reset, group:", group ?? "ALL");
      await LevelProgress.resetProgress(group);
      await Promise.all(
        [1, 2, 3].map((g) => LevelProgress.getCompletedLevels(g))
      );
      await loadProgress();
      console.log("[Reset] Done");
    } catch (e) {
      console.warn("[Reset] Failed:", e?.message || e);
      Alert.alert("Reset Failed", "Please try again.");
    }
  };

  const handleTopReset = () => {
    if (Platform.OS === "web") {
      const ok = window.confirm(
        "This will lock Levels 2 and 3 and set Level 1 back to Stage 1. Continue?"
      );
      if (ok) {
        performReset();
      }
      return;
    }
    Alert.alert(
      "Reset All Levels",
      "This will lock Levels 2 and 3 and set Level 1 back to Stage 1. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: () => performReset() },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <ImageBackground
        source={require("../assets/bg 1.png")}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Animated Clouds */}
        <Animated.View
          style={[
            styles.cloud,
            { top: height * 0.15, transform: [{ translateX: cloud1Pos }] },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.cloudShape, { width: 100, height: 50 }]} />
        </Animated.View>

        <Animated.View
          style={[
            styles.cloud,
            { top: height * 0.25, transform: [{ translateX: cloud2Pos }] },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.cloudShape, { width: 80, height: 40 }]} />
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <Animated.View
            style={[
              styles.profileCard,
              {
                transform: [{ translateY: headerSlide }],
                opacity: headerOpacity,
              },
            ]}
          >
            <View style={styles.profileLeft}>
              <View style={styles.avatarContainer}>
                <Image
                  source={require("../assets/profile.png")}
                  style={styles.profilePic}
                />
                <View style={styles.onlineIndicator} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {userData?.fullName || "Loading..."}
                </Text>
                <Text style={styles.profileUsername}>
                  @{userData?.username || "user"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowMenu(!showMenu)}
            >
              <Text style={styles.menuIcon}>⋮</Text>
            </TouchableOpacity>

            {showMenu && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleTopReset}
                >
                  <Text style={styles.menuItemText}>🔄 Reset Progress</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleLogout}
                >
                  <Text style={styles.menuItemText}>🚪 Logout</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {/* Welcome Message */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>🎮 Select Your Level</Text>
            <Text style={styles.welcomeSubtitle}>
              Continue your learning journey
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

          {/* Stats Summary */}
          <Animated.View
            style={[
              styles.summaryCard,
              {
                transform: [{ translateY: summarySlide }],
                opacity: summaryOpacity,
              },
            ]}
          >
            <Text style={styles.summaryTitle}>📊 Your Statistics</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{completionPercentage}%</Text>
                <Text style={styles.statLabel}>Progress</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{userStats.accuracy}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {getUnlockedLevelsCount()}/3
                </Text>
                <Text style={styles.statLabel}>Unlocked</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{userStats.totalAttempts}</Text>
                <Text style={styles.statLabel}>Attempts</Text>
              </View>
            </View>

            {/* Overall Progress Bar */}
            <View style={styles.overallProgressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Overall Progress</Text>
                <Text style={styles.progressPercentage}>
                  {completionPercentage}%
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFillMain,
                    { width: `${completionPercentage}%` },
                  ]}
                />
              </View>
            </View>

            {/* Achievement Message */}
            {completionPercentage === 100 && (
              <View style={styles.achievementBanner}>
                <Text style={styles.achievementText}>
                  🏆 All Levels Completed! 🏆
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
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
  cloud: {
    position: "absolute",
    opacity: 0.7,
  },
  cloudShape: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 50,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    minHeight: height + 200, // Ensure content is taller than screen to enable scrolling
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 20,
    padding: Math.min(width * 0.04, 16),
    marginBottom: Math.min(height * 0.025, 20),
    width: "100%",
    maxWidth: 500,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 3,
    borderColor: "#FFA85C",
    position: "relative",
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  profilePic: {
    width: Math.min(width * 0.15, 60),
    height: Math.min(width * 0.15, 60),
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "#FFA85C",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#1DB954",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.045, 18),
    color: "#222",
    letterSpacing: 0.3,
  },
  profileUsername: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.032, 13),
    color: "#666",
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  menuIcon: {
    fontSize: 24,
    color: "#666",
    fontWeight: "bold",
  },
  dropdownMenu: {
    position: "absolute",
    top: 70,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 2,
    borderColor: "#e0e0e0",
    zIndex: 1000,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuItemText: {
    fontFamily: "Poppins-Bold",
    fontSize: 14,
    color: "#333",
  },
  welcomeSection: {
    width: "100%",
    maxWidth: 500,
    alignItems: "center",
    marginBottom: Math.min(height * 0.03, 24),
  },
  welcomeTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.06, 26),
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  welcomeSubtitle: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.038, 15),
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginTop: 4,
  },
  levelsContainer: {
    width: "100%",
    maxWidth: 500,
    marginBottom: Math.min(height * 0.025, 20),
    gap: Math.min(height * 0.02, 16),
  },
  levelCard: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 20,
    padding: Math.min(width * 0.04, 16),
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 3,
    position: "relative",
    overflow: "hidden",
  },
  levelCardLocked: {
    backgroundColor: "rgba(224, 224, 224, 0.95)",
    opacity: 0.7,
  },
  completedGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  levelCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  levelIconContainer: {
    width: Math.min(width * 0.15, 60),
    height: Math.min(width * 0.15, 60),
    borderRadius: 30,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    position: "relative",
    borderWidth: 3,
    borderColor: "#FFA85C",
  },
  levelIcon: {
    width: Math.min(width * 0.1, 40),
    height: Math.min(width * 0.1, 40),
  },
  lockOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  lockIcon: {
    width: Math.min(width * 0.08, 32),
    height: Math.min(width * 0.08, 32),
  },
  levelInfo: {
    flex: 1,
  },
  levelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  levelNumber: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.04, 16),
    color: "#222",
    letterSpacing: 0.5,
    marginRight: 6,
  },
  levelEmoji: {
    fontSize: Math.min(width * 0.045, 18),
  },
  levelName: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.035, 14),
    color: "#666",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  levelTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.05, 20),
    color: "#222",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  levelTitleLocked: {
    color: "#999",
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  stagesText: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.032, 12),
    color: "#666",
  },
  levelStatus: {
    marginLeft: 12,
  },
  completedBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  completedText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  playIcon: {
    color: "#fff",
    fontSize: 18,
    marginLeft: 2,
  },
  completedRibbon: {
    position: "absolute",
    top: 12,
    right: -30,
    paddingVertical: 4,
    paddingHorizontal: 40,
    transform: [{ rotate: "45deg" }],
    elevation: 4,
  },
  ribbonText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: 10,
    letterSpacing: 1,
  },
  summaryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 20,
    padding: Math.min(width * 0.05, 20),
    width: "100%",
    maxWidth: 500,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 3,
    borderColor: "#FFA85C",
  },
  summaryTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.048, 19),
    color: "#222",
    textAlign: "center",
    marginBottom: Math.min(height * 0.02, 16),
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: Math.min(height * 0.025, 20),
    gap: 12,
  },
  statBox: {
    width: "47%",
    backgroundColor: "#f8f8f8",
    borderRadius: 16,
    padding: Math.min(width * 0.04, 16),
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  statValue: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.08, 32),
    color: "#FFA85C",
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.032, 13),
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  overallProgressSection: {
    marginTop: Math.min(height * 0.015, 12),
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.038, 15),
    color: "#666",
  },
  progressPercentage: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.038, 15),
    color: "#1DB954",
  },
  progressBarContainer: {
    width: "100%",
    height: 12,
    backgroundColor: "#e0e0e0",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#d0d0d0",
  },
  progressBarFillMain: {
    height: "100%",
    backgroundColor: "#1DB954",
    borderRadius: 4,
  },
  achievementBanner: {
    backgroundColor: "#FFD700",
    borderRadius: 12,
    padding: Math.min(width * 0.04, 16),
    marginTop: Math.min(height * 0.02, 16),
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFA500",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  achievementText: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.042, 16),
    color: "#8B4513",
    letterSpacing: 0.5,
  },
});
