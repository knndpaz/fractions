import React from 'react';
import { ImageBackground, StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { LevelProgress } from '../utils/levelProgress';

export default function FinishScreen({ route, navigation }) {
  const { 
    selectedCharacter = 0, 
    isCorrect = false, 
    timeUp = false, 
    stage = 1,
    levelGroup = 1,
    timeRemaining = 0 
  } = route.params || {};

  const characters = [
    require('../assets/chara1.png'),
    require('../assets/chara2.png'),
    require('../assets/chara3.png'),
    require('../assets/chara4.png'),
    require('../assets/chara5.png'),
    require('../assets/chara6.png'),
  ];

  const CHARACTER_WIDTH = 110;
  const CHARACTER_HEIGHT = 180;
  const WHITE_BAR_HEIGHT = CHARACTER_HEIGHT / 2.8;

  // Check if all stages in current level group are completed
  const isAllStagesCompleted = () => {
    return isCorrect && stage === 2;
  };

  // Different messages based on the outcome
  const getDialogueContent = () => {
    if (timeUp) {
      return {
        text: "Time's Up! Try again to unlock the next stage!",
        buttonText: "Retry Stage",
        backgroundColor: '#FF6B6B'
      };
    } else if (isCorrect) {
      if (stage === 2) {
        if (levelGroup === 3) {
          return {
            text: "🎉 Amazing! You've completed all levels! Congratulations!",
            buttonText: "Back to Levels",
            backgroundColor: '#4CAF50'
          };
        } else {
          return {
            text: levelGroup === 1
              ? "Wow, you fixed the food forests! Let's head to the Potion River"
              : `🎉 Great job! You've completed Level ${levelGroup}! Level ${levelGroup + 1} is now unlocked!`,
            buttonText: "Continue to Next Level",
            backgroundColor: '#4CAF50'
          };
        }
      } else {
        return {
          text: `Great job! Stage ${stage + 1} is now unlocked!`,
          buttonText: "Continue",
          backgroundColor: '#4CAF50'
        };
      }
    } else {
      return {
        text: "Oops! Wrong answer. Try again to unlock the next stage!",
        buttonText: "Retry Stage",
        backgroundColor: '#FF6B6B'
      };
    }
  };

  const handleContinue = async () => {
    // Update progress for the completed stage
    await LevelProgress.completeLevel(levelGroup, stage, isCorrect, timeRemaining);

    if (isCorrect && stage === 2) {
      // If completed all stages of current level group, show dialogue then go back to LevelSelect
      const dialogueText = levelGroup === 3
        ? "🎉 Amazing! You've completed all levels! Congratulations!"
        : levelGroup === 1
        ? "Wow, you fixed the food forests! Let's head to the Potion River"
        : `🎉 Great job! You've completed Level ${levelGroup}! Level ${levelGroup + 1} is now unlocked!`;
      navigation.navigate('Dialogue', {
        selectedCharacter,
        dialogueText,
        subtext: "",
        nextScreen: 'LevelSelect',
        nextScreenParams: { selectedCharacter }
      });
    } else if (isCorrect) {
      // If correct but not final stage, go back to map to see unlocked stages
      navigation.replace('MapLevels', { levelGroup, selectedCharacter });
    } else {
      // If wrong or time up, retry the same stage
      navigation.replace('Quiz', { stage, levelGroup, selectedCharacter });
    }
  };

  const dialogueContent = getDialogueContent();

  return (
    <TouchableOpacity
      style={{ flex: 1 }}
      activeOpacity={1}
      onPress={handleContinue}
    >
      <ImageBackground
        source={require('../assets/map 1.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={[styles.centeredContainer, { marginBottom: WHITE_BAR_HEIGHT + 30 }]}>
          <View style={[styles.dialogueBox, { borderColor: dialogueContent.backgroundColor, borderWidth: 3 }]}>
            <Text style={styles.dialogueText}>
              {dialogueContent.text}
            </Text>
            
            {/* Show additional info for correct answers */}
            {isCorrect && timeRemaining > 0 && (
              <Text style={styles.bonusText}>
                Time bonus: {timeRemaining} seconds remaining!
              </Text>
            )}
            
            {/* Show level info */}
            <Text style={styles.levelInfo}>
              Level {levelGroup} - Stage {stage} {isAllStagesCompleted() ? 'COMPLETE!' : ''}
            </Text>
          </View>
        </View>

        {/* White bar at the bottom */}
        <View style={[styles.whiteBar, { height: WHITE_BAR_HEIGHT }]}>
          <View style={styles.characterContainer}>
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
          </View>
        </View>

        {/* Action button */}
        <View style={[styles.continueContainer, { height: WHITE_BAR_HEIGHT }]}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: dialogueContent.backgroundColor }]}
            onPress={handleContinue}
          >
            <Text style={styles.actionButtonText}>{dialogueContent.buttonText}</Text>
          </TouchableOpacity>
          
          <Text style={styles.continueText}>or tap anywhere to continue</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogueBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    width: 300,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    marginTop: 40,
    alignItems: 'center',
  },
  dialogueText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#222',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  bonusText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 8,
  },
  levelInfo: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  whiteBar: {
    width: '100%',
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 100,
    left: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    zIndex: 2,
    paddingLeft: 24,
  },
  characterContainer: {
    width: 120,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    position: 'relative',
    overflow: 'visible',
  },
  characterImg: {
    position: 'absolute',
    left: 0,
    resizeMode: 'contain',
  },
  continueContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    paddingHorizontal: 30,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  actionButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    textAlign: 'center',
  },
  continueText: {
    color: '#bdbdbd',
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    textAlign: 'center',
  },
});