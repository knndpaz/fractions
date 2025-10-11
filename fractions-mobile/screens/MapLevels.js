import React, { useState, useEffect } from 'react';
import { ImageBackground, StyleSheet, View, TouchableOpacity, Text, Image, Alert } from 'react-native';
import { LevelProgress } from '../utils/levelProgress';

export default function MapLevels({ navigation, route }) {
  const [unlockedLevels, setUnlockedLevels] = useState([1]);
  const levelGroup = route?.params?.levelGroup || 1; // Get which level group (1, 2, or 3)

  useEffect(() => {
    loadProgress();
    
    // Listen for navigation events to refresh progress when coming back from quiz
    const unsubscribe = navigation.addListener('focus', () => {
      loadProgress();
    });

    return unsubscribe;
  }, [navigation, levelGroup]);

  const loadProgress = async () => {
    console.log('Loading progress for level group:', levelGroup); // Debug log
    const progress = await LevelProgress.getCompletedLevels(levelGroup);
    console.log('Raw progress loaded:', progress); // Debug log
    
    // Ensure stage 1 is always unlocked
    const progressWithStage1 = progress.includes(1) ? progress : [1, ...progress];
    console.log('Final progress with stage 1:', progressWithStage1); // Debug log
    
    setUnlockedLevels(progressWithStage1);
  };

  const handleLevelPress = (stage) => {
    console.log('Clicking stage:', stage, 'in level group:', levelGroup); // Debug log
    console.log('Unlocked levels:', unlockedLevels); // Debug log
    console.log('Is stage unlocked?', isStageUnlocked(stage)); // Debug log
    
    if (isStageUnlocked(stage)) {
      console.log('Navigating to Quiz with stage:', stage, 'levelGroup:', levelGroup); // Debug log
      navigation.navigate('Quiz', { 
        stage: stage, 
        levelGroup: levelGroup 
      });
    } else {
      Alert.alert(
        'Stage Locked', 
        `Complete stage ${stage - 1} first to unlock this stage!`,
        [{ text: 'OK' }]
      );
    }
  };

  // Check if a stage is unlocked (stage 1 is always unlocked)
  const isStageUnlocked = (stage) => {
    if (stage === 1) return true; // Stage 1 is always unlocked
    return LevelProgress.isLevelUnlocked(stage, unlockedLevels);
  };

  // Reset progress function for testing
  const resetProgress = async () => {
    await LevelProgress.resetProgress();
    await loadProgress(); // Reload progress after reset
    Alert.alert('Progress Reset', 'All progress has been reset. Only stage 1 is unlocked.');
  };

  // Test function to unlock stage 2
  const testUnlockStage2 = async () => {
    console.log('🧪 Testing unlock stage 2...');
    try {
      const result = await LevelProgress.completeLevel(1, levelGroup);
      console.log('🧪 Test result:', result);
      await loadProgress();
      Alert.alert('Test Complete', 'Check console logs and stage 2 should be unlocked');
    } catch (error) {
      console.error('🧪 Test error:', error);
    }
  };

  // Define 4 stages with their positions
  const allStages = [
    { number: 1, left: 140, top: 620 },
    { number: 2, left: 330, top: 600 },
    { number: 3, left: 170, top: 400 },
    { number: 4, left: 130, top: 300 },
  ];

  const getStageColor = (stage) => {
    if (isStageUnlocked(stage)) {
      return stage === 1 ? '#1DB954' : '#FFA85C'; // Green for stage 1, orange for unlocked
    }
    return '#888'; // Gray for locked stages
  };

  const getStageOpacity = (stage) => {
    return isStageUnlocked(stage) ? 1 : 0.5;
  };

  return (
    <ImageBackground
      source={require('../assets/map 1.png')}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Back Button */}
      <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.goBack()}>
        <Image source={require('../assets/menu.png')} style={styles.menuIcon} />
      </TouchableOpacity>

      {/* Reset Button (for testing - remove in production) */}
      <TouchableOpacity style={styles.resetBtn} onPress={resetProgress}>
        <Text style={styles.resetBtnText}>Reset</Text>
      </TouchableOpacity>

      {/* Test Button to unlock stage 2 */}
      <TouchableOpacity style={[styles.resetBtn, { right: 80 }]} onPress={testUnlockStage2}>
        <Text style={styles.resetBtnText}>Test S2</Text>
      </TouchableOpacity>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Level {levelGroup} - Stages: {unlockedLevels.length} / {allStages.length}
        </Text>
        {/* Debug info */}
        <Text style={styles.debugText}>
          Unlocked: [{unlockedLevels.join(', ')}]
        </Text>
        <Text style={styles.debugText}>
          Stage 1: {isStageUnlocked(1) ? 'Yes' : 'No'} | Stage 2: {isStageUnlocked(2) ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.debugText}>
          Stage 3: {isStageUnlocked(3) ? 'Yes' : 'No'} | Stage 4: {isStageUnlocked(4) ? 'Yes' : 'No'}
        </Text>
      </View>

      {/* Stage Buttons */}
      {allStages.map((stageData) => {
        const isUnlocked = isStageUnlocked(stageData.number);
        
        return (
          <TouchableOpacity
            key={stageData.number}
            style={[
              styles.stageBtn,
              {
                backgroundColor: getStageColor(stageData.number),
                left: stageData.left,
                top: stageData.top,
                opacity: getStageOpacity(stageData.number),
              },
            ]}
            onPress={() => handleLevelPress(stageData.number)}
            disabled={!isUnlocked}
          >
            <Text style={styles.stageBtnText}>{stageData.number}</Text>
            {!isUnlocked && (
              <View style={styles.lockOverlay}>
                <Text style={styles.lockIcon}>🔒</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  menuBtn: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFA85C',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 2,
    borderColor: '#fff',
  },
  menuIcon: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  resetBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetBtnText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
  },
  progressContainer: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 4,
  },
  progressText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#222',
    textAlign: 'center',
  },
  debugText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  stageBtn: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  stageBtnText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    fontWeight: 'bold',
  },
  lockOverlay: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  lockIcon: {
    fontSize: 12,
  },
});