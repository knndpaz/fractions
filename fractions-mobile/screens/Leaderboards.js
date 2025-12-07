import React, { useState, useEffect, useRef } from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Animated,
  Platform,
  Modal,
} from "react-native";
import { supabase, DatabaseService } from "../supabase";

// Get initial dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Responsive scaling functions with better base calculations
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// Dynamic dimensions hook for orientation changes
const useDimensions = () => {
  const [dimensions, setDimensions] = React.useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });
    return () => subscription?.remove();
  }, []);

  return dimensions;
};

// Check if device is small screen
const isSmallDevice = SCREEN_HEIGHT < 700;

export default function Leaderboard({ navigation }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const dimensions = useDimensions();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(50)).current;

  const characters = [
    require("../assets/chara1.png"),
    require("../assets/chara2.png"),
    require("../assets/chara3.png"),
    require("../assets/chara4.png"),
    require("../assets/chara5.png"),
    require("../assets/chara6.png"),
  ];

  useEffect(() => {
    loadLeaderboard();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

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

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      // First, get ALL students (no teacher filtering)
      const { data: studentsData, error: studentsError } = await supabase.from(
        "students"
      ).select(`
          id,
          user_id,
          name,
          username,
          email,
          character_index,
          sections(name)
        `);

      if (studentsError) throw studentsError;

      // Then, get ALL quiz attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("quiz_attempts")
        .select("*");

      if (attemptsError) throw attemptsError;

      // Calculate stats for each student
      const formattedStudents = studentsData.map((student) => {
        // Filter attempts for this student
        const studentAttempts = attemptsData.filter(
          (attempt) => attempt.user_id === student.user_id
        );

        // Calculate statistics
        const totalAttempts = studentAttempts.length;
        const correctAttempts = studentAttempts.filter(
          (a) => a.is_correct
        ).length;
        const totalScore = studentAttempts.reduce((sum, attempt) => {
          // Award points: correct = 100, wrong = 0, bonus for time
          if (attempt.is_correct) {
            const timeBonus = Math.floor((attempt.time_remaining || 0) / 10);
            return sum + 100 + timeBonus;
          }
          return sum;
        }, 0);

        // Calculate levels completed
        const completedLevels = new Set();
        const completedStages = new Set();
        studentAttempts.forEach((attempt) => {
          if (attempt.is_correct) {
            completedLevels.add(attempt.level_group);
            completedStages.add(`${attempt.level_group}-${attempt.stage}`);
          }
        });

        // Determine current level (highest unlocked level)
        const maxLevel =
          completedLevels.size > 0 ? Math.max(...completedLevels) : 1;
        const currentLevel = maxLevel < 3 ? maxLevel + 1 : 3;

        // Calculate progress percentage
        const totalPossibleStages = 3 * 2; // 3 levels × 2 stages
        const progress = Math.round(
          (completedStages.size / totalPossibleStages) * 100
        );

        return {
          id: student.id,
          user_id: student.user_id,
          full_name: student.name,
          username: student.username,
          email: student.email,
          selected_character: student.character_index || 0,
          section_name: student.sections?.name || "No Section",
          total_score: totalScore,
          total_attempts: totalAttempts,
          correct_attempts: correctAttempts,
          current_level: currentLevel,
          completed_levels: completedLevels.size,
          totalStages: completedStages.size,
          progress,
          level_1: {
            unlocked: true,
            completed_stages: studentAttempts.filter(
              (a) => a.level_group === 1 && a.is_correct
            ).length,
          },
          level_2: {
            unlocked: completedStages.size >= 2,
            completed_stages: studentAttempts.filter(
              (a) => a.level_group === 2 && a.is_correct
            ).length,
          },
          level_3: {
            unlocked: completedStages.size >= 4,
            completed_stages: studentAttempts.filter(
              (a) => a.level_group === 3 && a.is_correct
            ).length,
          },
        };
      });

      // Sort by total_score (descending), then by totalStages, then by correct_attempts
      formattedStudents.sort((a, b) => {
        if (b.total_score !== a.total_score) {
          return b.total_score - a.total_score;
        }
        if (b.totalStages !== a.totalStages) {
          return b.totalStages - a.totalStages;
        }
        return b.correct_attempts - a.correct_attempts;
      });

      // Assign ranks
      const rankedStudents = formattedStudents.map((student, index) => ({
        ...student,
        rank: index + 1,
      }));

      setStudents(rankedStudents);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
      alert(`Failed to load leaderboard: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentPress = (student) => {
    setSelectedStudent(student);
    setModalVisible(true);

    // Reset animation values
    modalScale.setValue(0.8);
    modalOpacity.setValue(0);
    modalTranslateY.setValue(50);

    // Animate modal entrance with slide up effect
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(modalTranslateY, {
        toValue: 0,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(modalTranslateY, {
        toValue: 30,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      setSelectedStudent(null);
    });
  };

  const getRankColor = (rank) => {
    if (rank === 1) return "#FFD700"; // Gold
    if (rank === 2) return "#C0C0C0"; // Silver
    if (rank === 3) return "#CD7F32"; // Bronze
    return "#FFA85C"; // Default orange
  };

  const getRankEmoji = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "🏅";
  };

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  const sparkleRotate = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const renderStudentCard = ({ item, index }) => {
    const isTop = index < 5;

    return (
      <StudentCard
        student={item}
        index={index}
        isTop={isTop}
        onPress={() => handleStudentPress(item)}
        getRankColor={getRankColor}
        getRankEmoji={getRankEmoji}
        characters={characters}
      />
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.subtitle && (
        <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
      )}
    </View>
  );

  const renderListHeader = () => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>🌟 Top 5 Champions</Text>
    </View>
  );

  const renderAllStudentsHeader = () => {
    const otherStudentsCount = students.length - 5;
    if (otherStudentsCount <= 0) return null;

    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📚 All Students</Text>
        <Text style={styles.sectionSubtitle}>
          {otherStudentsCount} more student{otherStudentsCount !== 1 ? "s" : ""}
        </Text>
      </View>
    );
  };

  const renderListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No students yet! 🎓</Text>
      <Text style={styles.emptySubtext}>Be the first to complete a stage!</Text>
    </View>
  );

  const getItemLayout = (data, index) => ({
    length: isSmallDevice ? verticalScale(100) : verticalScale(110),
    offset: (isSmallDevice ? verticalScale(100) : verticalScale(110)) * index,
    index,
  });

  // Memoized key extractor
  const keyExtractor = React.useCallback(
    (item) => item.user_id || item.id?.toString(),
    []
  );

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

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🏆 Leaderboard</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading leaderboard... 📊</Text>
            </View>
          ) : (
            <FlatList
              data={students}
              keyExtractor={keyExtractor}
              renderItem={renderStudentCard}
              ListHeaderComponent={renderListHeader}
              ListEmptyComponent={renderListEmpty}
              contentContainerStyle={styles.flatListContent}
              showsVerticalScrollIndicator={false}
              initialNumToRender={8}
              maxToRenderPerBatch={8}
              windowSize={5}
              removeClippedSubviews={Platform.OS === "android"}
              getItemLayout={getItemLayout}
              updateCellsBatchingPeriod={50}
            />
          )}
        </Animated.View>

        {/* Student detail modal - Compact version */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="none"
          onRequestClose={closeModal}
          statusBarTranslucent
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={closeModal}
          >
            <Animated.View
              style={[
                styles.modalContent,
                {
                  opacity: modalOpacity,
                  transform: [
                    { scale: modalScale },
                    { translateY: modalTranslateY },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                {selectedStudent && (
                  <View style={styles.modalInner}>
                    {/* Close button */}
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={closeModal}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>

                    {/* Compact header with character and rank */}
                    <View style={styles.modalHeader}>
                      <View style={styles.modalCharacterContainer}>
                        <Image
                          source={
                            characters[selectedStudent.selected_character || 0]
                          }
                          style={styles.modalCharacterImage}
                        />
                        <View
                          style={[
                            styles.modalRankBadgeSmall,
                            {
                              backgroundColor: getRankColor(
                                selectedStudent.rank
                              ),
                            },
                          ]}
                        >
                          <Text style={styles.modalRankEmojiSmall}>
                            {getRankEmoji(selectedStudent.rank)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.modalHeaderInfo}>
                        <Text style={styles.modalStudentName} numberOfLines={1}>
                          {selectedStudent.full_name ||
                            selectedStudent.username ||
                            "Student"}
                        </Text>
                        <Text style={styles.modalRankLabel}>
                          Rank #{selectedStudent.rank}
                        </Text>
                      </View>
                    </View>

                    {/* Compact stats row */}
                    <View style={styles.modalStatsRow}>
                      <View style={styles.modalStatItem}>
                        <Text style={styles.modalStatIcon}>🎯</Text>
                        <Text style={styles.modalStatValue}>
                          {selectedStudent.current_level || 1}
                        </Text>
                        <Text style={styles.modalStatLabel}>Level</Text>
                      </View>
                      <View style={styles.modalStatDivider} />
                      <View style={styles.modalStatItem}>
                        <Text style={styles.modalStatIcon}>⭐</Text>
                        <Text style={styles.modalStatValue}>
                          {selectedStudent.totalStages}
                        </Text>
                        <Text style={styles.modalStatLabel}>Stages</Text>
                      </View>
                      <View style={styles.modalStatDivider} />
                      <View style={styles.modalStatItem}>
                        <Text style={styles.modalStatIcon}>🏆</Text>
                        <Text style={styles.modalStatValue}>
                          {selectedStudent.total_score || 0}
                        </Text>
                        <Text style={styles.modalStatLabel}>Score</Text>
                      </View>
                      <View style={styles.modalStatDivider} />
                      <View style={styles.modalStatItem}>
                        <Text style={styles.modalStatIcon}>🔄</Text>
                        <Text style={styles.modalStatValue}>
                          {selectedStudent.total_attempts || 0}
                        </Text>
                        <Text style={styles.modalStatLabel}>Tries</Text>
                      </View>
                    </View>

                    {/* Compact progress section */}
                    <View style={styles.modalProgressSection}>
                      <View style={styles.modalProgressHeader}>
                        <Text style={styles.modalProgressTitle}>Progress</Text>
                        <Text style={styles.modalProgressPercent}>
                          {selectedStudent.progress}%
                        </Text>
                      </View>
                      <View style={styles.modalProgressBar}>
                        <View
                          style={[
                            styles.modalProgressBarFill,
                            { width: `${selectedStudent.progress}%` },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Compact level indicators */}
                    <View style={styles.levelIndicatorsRow}>
                      {[1, 2, 3].map((level) => {
                        const levelData = selectedStudent[`level_${level}`];
                        const isUnlocked = levelData && levelData.unlocked;
                        const completedStages =
                          levelData?.completed_stages || 0;

                        return (
                          <View
                            key={level}
                            style={[
                              styles.levelIndicator,
                              isUnlocked
                                ? styles.levelIndicatorUnlocked
                                : styles.levelIndicatorLocked,
                            ]}
                          >
                            <Text style={styles.levelIndicatorText}>
                              L{level}
                            </Text>
                            <Text style={styles.levelIndicatorStages}>
                              {completedStages}/2
                            </Text>
                            {!isUnlocked && (
                              <Text style={styles.levelLockIcon}>🔒</Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      </ImageBackground>
    </View>
  );
}

// Separate component for student card with animation
function StudentCard({
  student,
  index,
  isTop,
  onPress,
  getRankColor,
  getRankEmoji,
  characters,
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onPress();
    });
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.studentCard,
          isTop && styles.topStudentCard,
          student.rank <= 3 && styles.podiumCard,
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {/* Rank badge */}
        <View
          style={[
            styles.rankBadge,
            { backgroundColor: getRankColor(student.rank) },
          ]}
        >
          <Text style={styles.rankEmoji}>{getRankEmoji(student.rank)}</Text>
          <Text style={styles.rankText}>{student.rank}</Text>
        </View>

        {/* Character image */}
        <View style={styles.characterWrapper}>
          <Image
            source={characters[student.selected_character || 0]}
            style={styles.characterImage}
          />
        </View>

        {/* Student info */}
        <View style={styles.studentInfo}>
          <Text style={styles.studentName} numberOfLines={1}>
            {student.full_name || student.username || "Student"}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Level</Text>
              <Text style={styles.statValue}>{student.current_level || 1}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Stages</Text>
              <Text style={styles.statValue}>{student.totalStages}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Score</Text>
              <Text style={styles.statValue}>{student.total_score || 0}</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${student.progress}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{student.progress}%</Text>
          </View>
        </View>

        {/* Arrow indicator */}
        <Text style={styles.arrowIcon}>→</Text>
      </TouchableOpacity>
    </Animated.View>
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
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? verticalScale(50) : verticalScale(35),
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(12),
  },
  backButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    borderWidth: moderateScale(2.5),
    borderColor: "#FFA85C",
  },
  backButtonText: {
    fontSize: moderateScale(22),
    color: "#FFA85C",
    fontWeight: "bold",
  },
  headerTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(isSmallDevice ? 20 : 24),
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  placeholder: {
    width: moderateScale(44),
  },
  content: {
    flex: 1,
  },
  flatListContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(30),
  },
  sectionHeader: {
    marginBottom: verticalScale(12),
    marginTop: verticalScale(6),
  },
  sectionTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(isSmallDevice ? 16 : 18),
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sectionSubtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: moderateScale(12),
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: verticalScale(2),
  },
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(16),
    padding: moderateScale(isSmallDevice ? 10 : 12),
    marginBottom: verticalScale(10),
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: moderateScale(2),
    borderColor: "#e0e0e0",
  },
  topStudentCard: {
    elevation: 8,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    borderWidth: moderateScale(2.5),
  },
  podiumCard: {
    borderColor: "#FFD700",
  },
  rankBadge: {
    width: moderateScale(isSmallDevice ? 42 : 48),
    height: moderateScale(isSmallDevice ? 42 : 48),
    borderRadius: moderateScale(isSmallDevice ? 21 : 24),
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(10),
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: moderateScale(2.5),
    borderColor: "#fff",
  },
  rankEmoji: {
    fontSize: moderateScale(14),
  },
  rankText: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(12),
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  characterWrapper: {
    width: moderateScale(isSmallDevice ? 48 : 54),
    height: moderateScale(isSmallDevice ? 48 : 54),
    marginRight: scale(10),
    backgroundColor: "#f8f8f8",
    borderRadius: moderateScale(isSmallDevice ? 24 : 27),
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: moderateScale(2),
    borderColor: "#e0e0e0",
  },
  characterImage: {
    width: moderateScale(isSmallDevice ? 40 : 46),
    height: moderateScale(isSmallDevice ? 40 : 46),
    resizeMode: "contain",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(isSmallDevice ? 14 : 15),
    color: "#222",
    marginBottom: verticalScale(3),
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(6),
  },
  statItem: {
    alignItems: "center",
    minWidth: scale(40),
  },
  statLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: moderateScale(9),
    color: "#888",
  },
  statValue: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(12),
    color: "#222",
  },
  statDivider: {
    width: 1,
    height: moderateScale(20),
    backgroundColor: "#e0e0e0",
    marginHorizontal: scale(6),
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  progressBar: {
    flex: 1,
    height: verticalScale(6),
    backgroundColor: "#e0e0e0",
    borderRadius: moderateScale(3),
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: moderateScale(3),
  },
  progressText: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(11),
    color: "#4CAF50",
    minWidth: scale(32),
    textAlign: "right",
  },
  arrowIcon: {
    fontSize: moderateScale(18),
    color: "#FFA85C",
    marginLeft: scale(6),
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(40),
  },
  loadingText: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(14),
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(50),
  },
  emptyText: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(18),
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: verticalScale(6),
  },
  emptySubtext: {
    fontFamily: "Poppins-Regular",
    fontSize: moderateScale(13),
    color: "rgba(255, 255, 255, 0.8)",
  },
  sparkle: {
    position: "absolute",
    zIndex: 1,
  },
  sparkleText: {
    fontSize: moderateScale(28),
  },

  // Modal styles - Compact version
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(16),
  },
  modalContent: {
    width: "100%",
    maxWidth: scale(340),
  },
  modalInner: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    elevation: 15,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    borderWidth: moderateScale(3),
    borderColor: "#FFA85C",
  },
  closeButton: {
    position: "absolute",
    top: moderateScale(10),
    right: moderateScale(10),
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: moderateScale(16),
    color: "#666",
    fontWeight: "bold",
  },
  // Compact modal header
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(14),
    paddingRight: scale(30),
  },
  modalCharacterContainer: {
    width: moderateScale(70),
    height: moderateScale(70),
    backgroundColor: "#f8f8f8",
    borderRadius: moderateScale(35),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: moderateScale(3),
    borderColor: "#e0e0e0",
    position: "relative",
  },
  modalCharacterImage: {
    width: moderateScale(56),
    height: moderateScale(56),
    resizeMode: "contain",
  },
  modalRankBadgeSmall: {
    position: "absolute",
    bottom: -moderateScale(4),
    right: -moderateScale(4),
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: moderateScale(2),
    borderColor: "#fff",
  },
  modalRankEmojiSmall: {
    fontSize: moderateScale(14),
  },
  modalHeaderInfo: {
    flex: 1,
    marginLeft: scale(14),
  },
  modalStudentName: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(18),
    color: "#222",
    marginBottom: verticalScale(2),
  },
  modalRankLabel: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(13),
    color: "#FFA85C",
  },
  // Compact stats row
  modalStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f8f8",
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginBottom: verticalScale(12),
  },
  modalStatItem: {
    alignItems: "center",
    flex: 1,
  },
  modalStatIcon: {
    fontSize: moderateScale(20),
    marginBottom: verticalScale(2),
  },
  modalStatValue: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(16),
    color: "#222",
  },
  modalStatLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: moderateScale(10),
    color: "#888",
  },
  modalStatDivider: {
    width: 1,
    height: moderateScale(36),
    backgroundColor: "#e0e0e0",
  },
  // Compact progress section
  modalProgressSection: {
    marginBottom: verticalScale(12),
  },
  modalProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(6),
  },
  modalProgressTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(13),
    color: "#222",
  },
  modalProgressPercent: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(13),
    color: "#4CAF50",
  },
  modalProgressBar: {
    height: verticalScale(10),
    backgroundColor: "#e0e0e0",
    borderRadius: moderateScale(5),
    overflow: "hidden",
  },
  modalProgressBarFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: moderateScale(5),
  },
  // Compact level indicators
  levelIndicatorsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: scale(8),
  },
  levelIndicator: {
    flex: 1,
    alignItems: "center",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(2),
    position: "relative",
  },
  levelIndicatorUnlocked: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  levelIndicatorLocked: {
    backgroundColor: "#f5f5f5",
    borderColor: "#ccc",
  },
  levelIndicatorText: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(14),
    color: "#222",
  },
  levelIndicatorStages: {
    fontFamily: "Poppins-Regular",
    fontSize: moderateScale(11),
    color: "#666",
    marginTop: verticalScale(2),
  },
  levelLockIcon: {
    position: "absolute",
    top: moderateScale(4),
    right: moderateScale(4),
    fontSize: moderateScale(10),
  },
});
