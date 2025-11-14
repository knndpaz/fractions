import React, { useState, useEffect, useRef } from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LevelProgress } from "../utils/levelProgress";
import { supabase } from "../supabase";

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

  useEffect(() => {
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
  }, []);

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

  const levelImages = {
    1: require("../assets/level1.png"),
    2: require("../assets/level2.png"),
    3: require("../assets/level3.png"),
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
      icon: "🏚️",
    },
  };

  const currentLevel = levelInfo[level];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={!isUnlocked}
    >
      <Animated.View
        style={[
          styles.adventureLevelCard,
          {
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          },
          !isUnlocked && styles.lockedCard,
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

        <View style={styles.cardBottomSection}>
          {isUnlocked && (
            <>
              <Text style={styles.levelNameText}>
                {currentLevel.icon} {currentLevel.name}
              </Text>
              <View style={styles.stagesRow}>
                {[1, 2, 3, 4].map((stage) => (
                  <View
                    key={stage}
                    style={[
                      styles.stageDot,
                      stage <= completedStages && {
                        backgroundColor: currentLevel.color,
                        borderColor: currentLevel.shadowColor,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.stageCountText}>
                {completedStages}/4 Stages Completed
              </Text>
            </>
          )}
          {!isUnlocked && <Text style={styles.lockedText}>???</Text>}
        </View>

        {/* Play/Complete Button */}
        {isUnlocked && (
          <View
            style={[
              styles.actionButton,
              isCompleted
                ? { backgroundColor: currentLevel.color }
                : { backgroundColor: currentLevel.color },
            ]}
          >
            <Text style={styles.actionButtonText}>
              {isCompleted ? "✓ REPLAY" : "▶ PLAY"}
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function LevelSelect({ navigation, route }) {
  const { selectedCharacter: routeSelectedCharacter } = route.params || {};
  const [userData, setUserData] = useState(null);
  const [allProgress, setAllProgress] = useState({
    level1: [1],
    level2: [],
    level3: [],
  });
  const [userStats, setUserStats] = useState({ accuracy: 0, totalAttempts: 0 });
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  const headerFade = useRef(new Animated.Value(0)).current;
  const characterSlide = useRef(new Animated.Value(-50)).current;
  const statsSlide = useRef(new Animated.Value(50)).current;

  const characters = [
    require("../assets/chara1.png"),
    require("../assets/chara2.png"),
    require("../assets/chara3.png"),
    require("../assets/chara4.png"),
    require("../assets/chara5.png"),
    require("../assets/chara6.png"),
  ];

  useEffect(() => {
    loadUserData();
    loadProgress();
    animateEntrance();

    const unsubscribe = navigation.addListener("focus", () => {
      loadProgress();
    });

    return unsubscribe;
  }, [navigation]);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(characterSlide, {
        toValue: 0,
        delay: 200,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(statsSlide, {
        toValue: 0,
        delay: 400,
        tension: 50,
        friction: 8,
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

        // Fetch character index from database
        const userId = parsedUserData.id || parsedUserData.user_id;
        if (userId) {
          const { data: studentData } = await supabase
            .from("students")
            .select("character_index")
            .eq("user_id", userId)
            .single();
          setCharacterIndex(studentData?.character_index || 0);
        } else {
          setCharacterIndex(0);
        }
      }

      // Load selected character
      const storedCharacter = await AsyncStorage.getItem("selectedCharacter");
      if (storedCharacter) {
        setSelectedCharacter(parseInt(storedCharacter));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setCharacterIndex(0);
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

      setAllProgress(progress);
      setUserStats(stats.overall);
      setCompletionPercentage(completion);
      setCompletedLevels({
        1: progress.level1.includes(stagesPerLevel[1]),
        2: progress.level2.includes(stagesPerLevel[2]),
        3: progress.level3.includes(stagesPerLevel[3]),
      });

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
    setMenuVisible(false);
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

  const handleLeaderboard = () => {
    setMenuVisible(false);
    Alert.alert("Leaderboards", "Coming soon!", [{ text: "OK" }]);
  };

  const handleLevelPress = (levelGroup) => {
    if (isLevelGroupUnlocked(levelGroup)) {
      console.log("Level group unlocked, navigating...");
      navigation.navigate("MapLevels", { levelGroup });
    } else {
      const previousLevel = levelGroup - 1;
      Alert.alert(
        `Level ${levelGroup} Locked`,
        `Complete all stages of Level ${previousLevel} first!`,
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
    return levelProgress.includes(stagesPerLevel[levelGroup]);
  };

  const getCompletedStagesCount = (levelGroup) => {
    const levelProgress = allProgress[`level${levelGroup}`] || [];
    if (levelProgress.length === 0) return 0;
    const maxUnlockedStage = Math.max(...levelProgress);
    return Math.max(0, maxUnlockedStage - 1);
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
        <BurgerMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          onLogout={handleLogout}
          onLeaderboard={handleLeaderboard}
        />

        {/* Header with Logo and Burger */}
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <Image
            source={require("../assets/favicon.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.burgerButton}
            onPress={() => setMenuVisible(true)}
          >
            <View style={styles.burgerLine} />
            <View style={styles.burgerLine} />
            <View style={styles.burgerLine} />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          alwaysBounceVertical={true}
          nestedScrollEnabled={true}
        >
          {/* Character Hero Section */}
          <Animated.View
            style={[
              styles.heroSection,
              { transform: [{ translateY: characterSlide }] },
            ]}
          >
            <View style={styles.characterFrame}>
              <Image
                source={characters[selectedCharacter]}
                style={styles.characterImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.nameTag}>
              <Text style={styles.playerName}>
                {userData?.fullName || "Adventurer"}
              </Text>
              <Text style={styles.playerUsername}>
                @{userData?.username || "user"}
              </Text>
            </View>
          </Animated.View>

          {/* Journey Title */}
          <View style={styles.journeyHeader}>
            <Text style={styles.journeyTitle}>⚔️ YOUR JOURNEY ⚔️</Text>
            <Text style={styles.journeySubtitle}>
              Choose your next adventure
            </Text>
          </View>

          {/* Level Cards */}
          <View style={styles.levelsGrid}>
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
          <Animated.View
            style={[
              styles.statsPanel,
              { transform: [{ translateY: statsSlide }] },
            ]}
          >
            <Text style={styles.statsPanelTitle}>📊 ADVENTURE STATS</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{completionPercentage}%</Text>
                <Text style={styles.statLabel}>Complete</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{userStats.accuracy}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{userStats.totalAttempts}</Text>
                <Text style={styles.statLabel}>Attempts</Text>
              </View>
            </View>

            {/* Progress Quest Bar */}
            <View style={styles.questProgress}>
              <Text style={styles.questTitle}>Quest Progress</Text>
              <View style={styles.questBarContainer}>
                <View
                  style={[
                    styles.questBarFill,
                    { width: `${completionPercentage}%` },
                  ]}
                />
                <Text style={styles.questPercentage}>
                  {completionPercentage}%
                </Text>
              </View>
            </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 15 : 55,
    paddingHorizontal: 20,
    paddingBottom: 15,
    zIndex: 100,
  },
  logoImage: {
    width: Math.min(width * 0.18, 80),
    height: Math.min(width * 0.18, 80),
    borderWidth: 4,
    borderColor: "#fff",
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 8,
  },
  burgerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    borderWidth: 3,
    borderColor: "#FFA85C",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  burgerLine: {
    width: 24,
    height: 3,
    backgroundColor: "#333",
    borderRadius: 2,
  },
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    zIndex: 998,
  },
  burgerMenuContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: "#fff",
    zIndex: 999,
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 5, height: 0 },
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#f0f0f0",
  },
  menuTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 24,
    color: "#333",
    letterSpacing: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
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
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  menuItemIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  menuItemText: {
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Increased padding for better scrolling
    paddingTop: 20, // Added top padding
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  characterFrame: {
    width: Math.min(width * 0.4, 160),
    height: Math.min(width * 0.55, 220),
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 30,
    borderWidth: 5,
    borderColor: "#FFA85C",
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
  },
  characterImage: {
    width: "90%",
    height: "90%",
  },
  nameTag: {
    marginTop: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#FFA85C",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  playerName: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.055, 22),
    color: "#222",
    letterSpacing: 0.5,
  },
  playerUsername: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.035, 14),
    color: "#666",
    marginTop: 2,
  },
  journeyHeader: {
    alignItems: "center",
    marginVertical: 20,
  },
  journeyTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.065, 26),
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 1,
  },
  journeySubtitle: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.038, 15),
    color: "rgba(255, 255, 255, 0.95)",
    marginTop: 4,
  },
  levelsGrid: {
    marginBottom: 20,
    // Replaced gap with marginBottom for each card for better compatibility
  },
  adventureLevelCard: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 24,
    padding: 20,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 4,
    borderColor: "#FFA85C",
    position: "relative",
    overflow: "visible",
    marginBottom: 20, // Added marginBottom instead of using gap
  },
  lockedCard: {
    backgroundColor: "rgba(180, 180, 180, 0.85)",
    borderColor: "#999",
  },
  cardPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.03,
  },
  lockOverlayFull: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderRadius: 20,
  },
  bigLockIcon: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  lockText: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cardTopSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  levelBadge: {
    backgroundColor: "#FFA85C",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
    elevation: 4,
  },
  levelBadgeText: {
    fontFamily: "Poppins-Bold",
    fontSize: 14,
    color: "#fff",
    letterSpacing: 1,
  },
  completedStar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 4,
  },
  starText: {
    fontSize: 20,
  },
  cardMiddleSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  levelIconBox: {
    width: Math.min(width * 0.25, 100),
    height: Math.min(width * 0.25, 100),
    borderRadius: 50,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#ddd",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  levelIconLarge: {
    width: "70%",
    height: "70%",
  },
  cardBottomSection: {
    alignItems: "center",
    minHeight: 80,
    justifyContent: "center",
  },
  levelNameText: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.042, 16),
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  stagesRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  stageDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#e0e0e0",
    borderWidth: 2,
    borderColor: "#bdbdbd",
  },
  stageCountText: {
    fontFamily: "Poppins-Bold",
    fontSize: 13,
    color: "#666",
  },
  lockedText: {
    fontFamily: "Poppins-Bold",
    fontSize: 36,
    color: "#999",
    letterSpacing: 4,
  },
  actionButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  actionButtonText: {
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    color: "#fff",
    letterSpacing: 1.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statsPanel: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 4,
    borderColor: "#FFA85C",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    marginBottom: 20,
  },
  statsPanelTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.055, 22),
    color: "#222",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#e0e0e0",
    elevation: 4,
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
  questProgress: {
    marginTop: 8,
  },
  questTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.042, 16),
    color: "#666",
    marginBottom: 12,
    textAlign: "center",
  },
  questBarContainer: {
    height: 24,
    backgroundColor: "#e0e0e0",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "visible",
  },
  questBarFill: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    backgroundColor: "#FFA85C",
    borderRadius: 12,
  },
  questPercentage: {
    fontFamily: "Poppins-Bold",
    fontSize: 12,
    color: "#333",
    zIndex: 1,
  },
});
