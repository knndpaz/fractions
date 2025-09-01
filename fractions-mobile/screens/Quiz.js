import React, { useState, useEffect } from 'react';
import { ImageBackground, StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';

export default function Quiz({ navigation }) {
  const [timer, setTimer] = useState(16);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Example answer options
  const answers = ['5/4', '2/4', '4/6', '2/6'];

  return (
    <ImageBackground
      source={require('../assets/map 1.png')}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Timer at top right */}
      <View style={styles.timerContainer}>
        <Image source={require('../assets/clock.png')} style={styles.timerIcon} />
        <Text style={styles.timerText}>{timer}s</Text>
      </View>

      {/* Main quiz card */}
      <View style={styles.quizCard}>
        <View style={styles.fractionRow}>
          <View style={styles.fractionCol}>
            <Image source={require('../assets/fractionsample 1.png')} style={styles.fractionImg} />
            <Text style={styles.fractionLabel}>1{'\n'}2</Text>
          </View>
          <Text style={styles.plus}>+</Text>
          <View style={styles.fractionCol}>
            <Image source={require('../assets/fractionsample 2.png')} style={styles.fractionImg} />
            <Text style={styles.fractionLabel}>3{'\n'}4</Text>
          </View>
        </View>
      </View>

      {/* Answer buttons */}
      <View style={styles.answersRow}>
        {answers.map((ans, idx) => (
          <TouchableOpacity
            key={ans}
            style={styles.answerBtn}
            onPress={() => navigation.replace('FinishScreen', { selectedCharacter: 0 })}
          >
            <Text style={styles.answerText}>{ans}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
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
  quizCard: {
    marginTop: 110,
    alignSelf: 'center',
    width: 320,
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
    marginHorizontal: 12,
  },
  fractionImg: {
    width: 80,
    height: 80,
    marginBottom: 6,
    resizeMode: 'contain',
  },
  fractionLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#222',
    textAlign: 'center',
    lineHeight: 20,
  },
  plus: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: '#FFA85C',
    marginHorizontal: 8,
    marginTop: 18,
  },
  answersRow: {
    position: 'absolute',
    bottom: 120,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 18,
  },
  answerBtn: {
    backgroundColor: '#FFA85C',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 38,
    margin: 8,
    minWidth: 110,
    alignItems: 'center',
    elevation: 4,
  },
  answerText: {
    color: '#222',
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    fontWeight: 'bold',
  },
});