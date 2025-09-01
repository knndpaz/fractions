import React, { useState } from 'react';
import { ImageBackground, StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';

const characters = [
  require('../assets/chara1.png'),
  require('../assets/chara2.png'),
  require('../assets/chara3.png'),
  require('../assets/chara4.png'),
  require('../assets/chara5.png'),
  require('../assets/chara6.png'),
];

export default function CharacterSelect({ navigation }) {
  const [selected, setSelected] = useState(0);

  return (
    <ImageBackground
      source={require('../assets/bg 1.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.topPrompt}>
        <Text style={styles.promptText}>Choose your fighter!</Text>
      </View>
      <View style={styles.centered}>
        <View style={styles.selectBox}>
          <View style={styles.grid}>
            {characters.map((img, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.charCell,
                  selected === idx && styles.selectedCell,
                ]}
                onPress={() => setSelected(idx)}
                activeOpacity={0.8}
              >
                <View style={styles.charImgWrapper}>
                  <Image source={img} style={styles.charImg} />
                </View>
                {selected === idx && (
                  <Image
                    source={require('../assets/check.png')}
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.proceedBtn}
            onPress={() => navigation.navigate('Dialogue', { selectedCharacter: selected })}
          >
            <Text style={styles.proceedText}>PROCEED</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  topPrompt: {
    marginTop: 40,
    alignItems: 'center',
    zIndex: 2,
  },
  promptText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
    color: '#222',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectBox: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 18,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 18,
    rowGap: 32, // vertical space between rows
    columnGap: 32, // horizontal space between columns
    width: 320, // ensure grid width fits 3 cells
  },
  charCell: {
    width: 96,           // bigger selection
    height: 72,          // half the character height, bigger
    margin: 0,           // spacing handled by rowGap/columnGap
    borderRadius: 24,    // slightly larger radius
    backgroundColor: '#FFA85C33',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  selectedCell: {
    borderWidth: 3,
    borderColor: '#1DB954',
    backgroundColor: '#FFA85C',
  },
  charImgWrapper: {
    position: 'absolute',
    top: -60, // move image up so top part goes out of container
    left: 0,
    right: 0,
    alignItems: 'center',
    width: '100%',
    zIndex: 1,
  },
  charImg: {
    width: 88,    // bigger character
    height: 144,  // bigger character for overflow
    resizeMode: 'contain',
  },
  checkIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    zIndex: 2,
  },
  proceedBtn: {
    width: '90%',
    backgroundColor: '#FFA85C',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  proceedText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    letterSpacing: 1,
  },
});