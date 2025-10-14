import React, { useState, useEffect } from 'react';
import { ImageBackground, StyleSheet, View, Text, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LevelProgress } from '../utils/levelProgress';

export default function LevelSelect({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [allProgress, setAllProgress] = useState({ level1: [1], level2: [], level3: [] });
  const [userStats, setUserStats] = useState({ accuracy: 0, totalAttempts: 0 });
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    loadUserData();
    loadProgress();
    
    const unsubscribe = navigation.addListener('focus', () => {
      loadProgress();
    });

    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
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

      // Guard optional method to prevent crashes
      if (userData && typeof LevelProgress.syncProgressToBackend === 'function') {
        await LevelProgress.syncProgressToBackend(userData);
      }
    } catch (e) {
      console.warn('loadProgress failed:', e?.message || e);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userData');
              navigation.replace('Login');
            } catch (error) {
              console.error('Error logging out:', error);
            }
          }
        }
      ]
    );
  };

  const handleLevelPress = (levelGroup) => {
    console.log('Attempting to navigate to level group:', levelGroup);
    if (isLevelGroupUnlocked(levelGroup)) {
      console.log('Level group unlocked, navigating...');
      navigation.navigate('MapLevels', { levelGroup });
    } else {
      const previousLevel = levelGroup - 1;
      Alert.alert(
        `Level ${levelGroup} Locked`, 
        `Complete all stages of Level ${previousLevel} first to unlock Level ${levelGroup}!`,
        [{ text: 'OK' }]
      );
    }
  };

  const isLevelGroupUnlocked = (levelGroup) => {
    if (levelGroup === 1) return true;
    return allProgress[`level${levelGroup}`] && allProgress[`level${levelGroup}`].length > 0;
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

  // Centralized reset runner
  const performReset = async (group) => {
    try {
      console.log('[Reset] Performing reset, group:', group ?? 'ALL');
      await LevelProgress.resetProgress(group);
      // Normalize storage unlocks after reset (respects reset short-circuit logic)
      await Promise.all([1, 2, 3].map((g) => LevelProgress.getCompletedLevels(g)));
      // Reload UI from storage/DB
      await loadProgress();
      console.log('[Reset] Done');
    } catch (e) {
      console.warn('[Reset] Failed:', e?.message || e);
      Alert.alert('Reset Failed', 'Please try again.');
    }
  };

  // Top reset: cross-platform confirmation + reset
  const handleTopReset = () => {
    if (Platform.OS === 'web') {
      const ok = window.confirm('This will lock Levels 2 and 3 and set Level 1 back to Stage 1. Continue?');
      if (ok) {
        performReset(); // all groups
      }
      return;
    }
    Alert.alert(
      'Reset All Levels',
      'This will lock Levels 2 and 3 and set Level 1 back to Stage 1. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => performReset() },
      ]
    );
  };

  // Bottom test reset: cross-platform confirmation + reset
  const resetProgress = () => {
    if (Platform.OS === 'web') {
      const ok = window.confirm('Are you sure you want to reset all progress?');
      if (ok) {
        performReset(); // all groups
      }
      return;
    }
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all progress?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => performReset() },
      ]
    );
  };

  return (
    <ImageBackground
      source={require('../assets/bg 1.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={require('../assets/profile.png')}
            style={styles.profilePic}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>
              {userData?.fullName || 'Loading...'}
            </Text>
            <Text style={styles.profileGrade}>
              @{userData?.username || 'user'} • {userData?.section || 'No Section'}
            </Text>
          </View>
          <TouchableOpacity style={styles.gridIconBox} onPress={handleLogout}>
            <Image
              source={require('../assets/radix-icons_dashboard.png')}
              style={styles.gridIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Top actions (Reset Levels) */}
        <View style={styles.topActions}>
          <TouchableOpacity style={styles.topResetButton} onPress={handleTopReset}>
            <Text style={styles.topResetText}>Reset Levels</Text>
          </TouchableOpacity>
        </View>

        {/* Level Cards */}
        <View style={styles.levelBox}>
          {/* Level 1 - Always unlocked and clickable */}
          <TouchableOpacity 
            style={styles.levelCard1} 
            onPress={() => handleLevelPress(1)}
          >
            <Image source={require('../assets/level1.png')} style={styles.levelIcon} />
            <View style={styles.levelTextContainer}>
              <Text style={styles.levelText}>LEVEL 1</Text>
              <Text style={styles.progressText}>
                Progress: {getCompletedStagesCount(1)}/4 stages completed
              </Text>
            </View>
            {isLevelGroupCompleted(1) ? (
              <Image source={require('../assets/check.png')} style={styles.levelStatusIcon} />
            ) : (
              <Text style={styles.playButton}>▶</Text>
            )}
          </TouchableOpacity>

          {/* Level 2 - Unlocked after completing Level 1 */}
          <TouchableOpacity 
            style={isLevelGroupUnlocked(2) ? styles.levelCard1 : styles.levelCard3}
            onPress={() => handleLevelPress(2)}
            disabled={!isLevelGroupUnlocked(2)}
          >
            <Image source={require('../assets/level2.png')} style={styles.levelIcon} />
            <View style={styles.levelTextContainer}>
              <Text style={isLevelGroupUnlocked(2) ? styles.levelText : styles.levelText3}>
                LEVEL 2
              </Text>
              <Text style={styles.progressText}>
                {isLevelGroupUnlocked(2) 
                  ? `Progress: ${getCompletedStagesCount(2)}/4 stages completed`
                  : 'Complete Level 1 to unlock'
                }
              </Text>
            </View>
            {isLevelGroupUnlocked(2) ? (
              isLevelGroupCompleted(2) ? (
                <Image source={require('../assets/check.png')} style={styles.levelStatusIcon} />
              ) : (
                <Text style={styles.playButton}>▶</Text>
              )
            ) : (
              <Image source={require('../assets/lock.png')} style={styles.levelStatusIcon} />
            )}
          </TouchableOpacity>

          {/* Level 3 - Unlocked after completing Level 2 */}
          <TouchableOpacity 
            style={isLevelGroupUnlocked(3) ? styles.levelCard1 : styles.levelCard3}
            onPress={() => handleLevelPress(3)}
            disabled={!isLevelGroupUnlocked(3)}
          >
            <Image source={require('../assets/level3.png')} style={styles.levelIcon} />
            <View style={styles.levelTextContainer}>
              <Text style={isLevelGroupUnlocked(3) ? styles.levelText : styles.levelText3}>
                LEVEL 3
              </Text>
              <Text style={styles.progressText}>
                {isLevelGroupUnlocked(3) 
                  ? `Progress: ${getCompletedStagesCount(3)}/4 stages completed`
                  : 'Complete Level 2 to unlock'
                }
              </Text>
            </View>
            {isLevelGroupUnlocked(3) ? (
              isLevelGroupCompleted(3) ? (
                <Image source={require('../assets/check.png')} style={styles.levelStatusIcon} />
              ) : (
                <Text style={styles.playButton}>▶</Text>
              )
            ) : (
              <Image source={require('../assets/lock.png')} style={styles.levelStatusIcon} />
            )}
          </TouchableOpacity>
        </View>

        {/* Progress Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Your Progress</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              Overall Progress: {completionPercentage}%
            </Text>
            <Text style={styles.summaryText}>
              Accuracy: {userStats.accuracy}%
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              Levels Unlocked: {getUnlockedLevelsCount()}/3
            </Text>
            <Text style={styles.summaryText}>
              Total Attempts: {userStats.totalAttempts}
            </Text>
          </View>
          
          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>{completionPercentage}% Complete</Text>
          
          {/* Debug info */}
          <Text style={styles.debugText}>
            L1: [{(allProgress.level1 || []).join(', ')}] L2: [{(allProgress.level2 || []).join(', ')}] L3: [{(allProgress.level3 || []).join(', ')}]
          </Text>
          
          {/* Reset button for testing */}
          <TouchableOpacity style={styles.resetButton} onPress={resetProgress}>
            <Text style={styles.resetButtonText}>Reset Progress (Testing)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12, // reduced to make room for top actions
    width: 320,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  // New: Top actions styles
  topActions: {
    width: 320,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  topResetButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  topResetText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
  },
  levelBox: {
    width: 340,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 20,
  },
  levelCard1: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1DB954',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 16,
    width: 280,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  levelCard3: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#888',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 16,
    width: 280,
    backgroundColor: '#e0e0e0',
    justifyContent: 'flex-start',
    opacity: 0.6,
  },
  levelIcon: {
    width: 32,
    height: 32,
    marginRight: 18,
  },
  levelTextContainer: {
    flex: 1,
  },
  levelText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#111',
  },
  levelText3: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#222',
    opacity: 0.5,
  },
  progressText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  levelStatusIcon: {
    width: 28,
    height: 28,
    marginLeft: 10,
  },
  playButton: {
    fontSize: 24,
    color: '#1DB954',
    marginLeft: 10,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    width: 320,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
  },
  debugText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 9,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
  resetButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'center',
    marginTop: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginVertical: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 8,
  },
});