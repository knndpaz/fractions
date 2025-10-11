import React, { useState, useEffect } from 'react';
import { ImageBackground, StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { LevelProgress } from '../utils/levelProgress';

export default function Quiz({ navigation, route }) {
  const [timer, setTimer] = useState(16);
  const stage = route?.params?.stage || route?.params?.level || 1;
  const levelGroup = route?.params?.levelGroup || 1;

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else {
      // Time's up, record as incorrect
      handleTimeUp();
    }
  }, [timer, navigation, stage, levelGroup]);

  const handleTimeUp = async () => {
    console.log('⏰ Time up! Recording as incorrect...');
    await LevelProgress.completeLevel(stage, levelGroup, false, 0);
    
    navigation.replace('FinishScreen', { 
      selectedCharacter: 0, 
      timeUp: true,
      stage: stage,
      levelGroup: levelGroup,
      isCorrect: false
    });
  };

  // Different questions for each level group and stage
  const questions = {
    1: { // Level Group 1
      1: {
        title: "Level 1 - Stage 1",
        fraction1: { numerator: 1, denominator: 2 },
        fraction2: { numerator: 1, denominator: 4 },
        operation: '+',
        answers: ['3/4', '2/6', '1/3', '2/4'],
        correctAnswer: 0
      },
      2: {
        title: "Level 1 - Stage 2",
        fraction1: { numerator: 2, denominator: 3 },
        fraction2: { numerator: 1, denominator: 6 },
        operation: '+',
        answers: ['5/6', '3/9', '2/6', '4/6'],
        correctAnswer: 0
      },
      3: {
        title: "Level 1 - Stage 3",
        fraction1: { numerator: 3, denominator: 4 },
        fraction2: { numerator: 1, denominator: 4 },
        operation: '-',
        answers: ['1/2', '2/4', '1/4', '3/8'],
        correctAnswer: 1
      },
      4: {
        title: "Level 1 - Stage 4",
        fraction1: { numerator: 5, denominator: 6 },
        fraction2: { numerator: 1, denominator: 3 },
        operation: '+',
        answers: ['7/6', '6/9', '5/9', '1 1/6'],
        correctAnswer: 3
      }
    },
    2: { // Level Group 2 - More advanced questions
      1: {
        title: "Level 2 - Stage 1",
        fraction1: { numerator: 3, denominator: 5 },
        fraction2: { numerator: 2, denominator: 10 },
        operation: '+',
        answers: ['4/5', '5/15', '8/10', '1/2'],
        correctAnswer: 2
      },
      2: {
        title: "Level 2 - Stage 2",
        fraction1: { numerator: 5, denominator: 8 },
        fraction2: { numerator: 1, denominator: 4 },
        operation: '+',
        answers: ['7/8', '6/12', '6/8', '5/12'],
        correctAnswer: 0
      },
      3: {
        title: "Level 2 - Stage 3",
        fraction1: { numerator: 7, denominator: 10 },
        fraction2: { numerator: 3, denominator: 10 },
        operation: '-',
        answers: ['2/5', '4/10', '10/20', '1/2'],
        correctAnswer: 1
      },
      4: {
        title: "Level 2 - Stage 4",
        fraction1: { numerator: 2, denominator: 3 },
        fraction2: { numerator: 5, denominator: 12 },
        operation: '+',
        answers: ['13/12', '7/15', '1 1/12', '1/4'],
        correctAnswer: 2
      }
    },
    3: { // Level Group 3 - Most advanced questions
      1: {
        title: "Level 3 - Stage 1",
        fraction1: { numerator: 7, denominator: 8 },
        fraction2: { numerator: 1, denominator: 16 },
        operation: '+',
        answers: ['15/16', '8/24', '9/16', '1'],
        correctAnswer: 0
      },
      2: {
        title: "Level 3 - Stage 2",
        fraction1: { numerator: 3, denominator: 4 },
        fraction2: { numerator: 5, denominator: 6 },
        operation: '+',
        answers: ['8/10', '17/12', '1 5/12', '2/3'],
        correctAnswer: 2
      },
      3: {
        title: "Level 3 - Stage 3",
        fraction1: { numerator: 9, denominator: 10 },
        fraction2: { numerator: 2, denominator: 5 },
        operation: '-',
        answers: ['1/2', '7/10', '1/10', '3/5'],
        correctAnswer: 1
      },
      4: {
        title: "Level 3 - Stage 4",
        fraction1: { numerator: 4, denominator: 5 },
        fraction2: { numerator: 7, denominator: 15 },
        operation: '+',
        answers: ['11/20', '19/15', '1 4/15', '2/3'],
        correctAnswer: 2
      }
    }
  };

  const currentQuestion = questions[levelGroup]?.[stage] || questions[1][1];

  const handleAnswerPress = async (answerIndex) => {
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    
    console.log('🎯 Answer selected:', answerIndex, 'Correct:', isCorrect);
    console.log('🎯 Stage:', stage, 'Level Group:', levelGroup, 'Time Remaining:', timer);
    
    // Record the attempt in Supabase (both correct and incorrect)
    try {
      console.log('✅ Recording attempt in database...');
      const result = await LevelProgress.completeLevel(stage, levelGroup, isCorrect, timer);
      console.log('✅ Progress update result:', result);
    } catch (error) {
      console.error('❌ Error updating progress:', error);
    }
    
    navigation.replace('FinishScreen', { 
      selectedCharacter: 0, 
      isCorrect: isCorrect,
      stage: stage,
      levelGroup: levelGroup,
      timeRemaining: timer
    });
  };

  return (
    <ImageBackground
      source={require('../assets/map 1.png')}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backBtn} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backBtnText}>←</Text>
      </TouchableOpacity>

      {/* Timer at top right */}
      <View style={styles.timerContainer}>
        <Image source={require('../assets/clock.png')} style={styles.timerIcon} />
        <Text style={styles.timerText}>{timer}s</Text>
      </View>

      {/* Progress indicator */}
      <View style={styles.levelIndicator}>
        <Text style={styles.levelText}>{currentQuestion.title}</Text>
      </View>

      {/* Main quiz card */}
      <View style={styles.quizCard}>
        <View style={styles.fractionRow}>
          <View style={styles.fractionCol}>
            <Image source={require('../assets/fractionsample 1.png')} style={styles.fractionImg} />
            <Text style={styles.fractionLabel}>
              {currentQuestion.fraction1.numerator}{'\n'}{currentQuestion.fraction1.denominator}
            </Text>
          </View>
          <Text style={styles.operation}>{currentQuestion.operation}</Text>
          <View style={styles.fractionCol}>
            <Image source={require('../assets/fractionsample 2.png')} style={styles.fractionImg} />
            <Text style={styles.fractionLabel}>
              {currentQuestion.fraction2.numerator}{'\n'}{currentQuestion.fraction2.denominator}
            </Text>
          </View>
          <Text style={styles.equals}>=</Text>
          <Text style={styles.questionMark}>?</Text>
        </View>
      </View>

      {/* Answer buttons */}
      <View style={styles.answersRow}>
        {currentQuestion.answers.map((answer, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.answerBtn}
            onPress={() => handleAnswerPress(idx)}
          >
            <Text style={styles.answerText}>{answer}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  backBtn: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 4,
  },
  backBtnText: {
    fontSize: 24,
    color: '#FFA85C',
    fontWeight: 'bold',
  },
  timerContainer: {
    position: 'absolute',
    top: 36,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 4,
    zIndex: 10,
    elevation: 4,
  },
  timerIcon: {
    width: 22,
    height: 22,
    marginRight: 6,
    resizeMode: 'contain',
  },
  timerText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFA85C',
  },
  levelIndicator: {
    position: 'absolute',
    top: 90,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 4,
  },
  levelText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#222',
    textAlign: 'center',
  },
  quizCard: {
    marginTop: 150,
    alignSelf: 'center',
    width: 350,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  fractionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fractionCol: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  fractionImg: {
    width: 60,
    height: 60,
    marginBottom: 6,
    resizeMode: 'contain',
  },
  fractionLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
    lineHeight: 18,
  },
  operation: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#FFA85C',
    marginHorizontal: 12,
    marginTop: 12,
  },
  equals: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#4CAF50',
    marginHorizontal: 12,
    marginTop: 12,
  },
  questionMark: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: '#FF6B6B',
    marginHorizontal: 8,
    marginTop: 12,
  },
  answersRow: {
    position: 'absolute',
    bottom: 120,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  answerBtn: {
    backgroundColor: '#FFA85C',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    margin: 6,
    minWidth: 80,
    alignItems: 'center',
    elevation: 4,
  },
  answerText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    fontWeight: 'bold',
  },
});