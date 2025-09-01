import React from 'react';
import { ImageBackground, StyleSheet, View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';

export default function Dialogue({ route, navigation }) {
  const { selectedCharacter = 0 } = route.params || {};

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

  return (
    <TouchableOpacity
      style={{ flex: 1 }}
      activeOpacity={1}
      onPress={() => navigation.replace('MapLevels')}
    >
      <ImageBackground
        source={require('../assets/map 1.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={[styles.centeredContainer, { marginBottom: WHITE_BAR_HEIGHT + 30 }]}>
          <View style={styles.dialogueBox}>
            <Text style={styles.dialogueText}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, 
              ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, 
              per inceptos himenaeos. Curabitur tempus urna at turpis condimentum lobortis. 
              Ut commodo efficitur neque. Ut diam quam, semper iaculis condimentum ac, vestibulum eu nisl.
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
                  top: -CHARACTER_HEIGHT / 2.1, // head pops out, feet on white bar
                },
              ]}
            />
          </View>
        </View>
        {/* "Click anywhere to continue" text, centered on the white bar */}
        <View style={[styles.continueContainer, { height: WHITE_BAR_HEIGHT }]}>
          <Text style={styles.continueText}>Click anywhere to continue</Text>
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
    width: 270,
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
    fontSize: 13,
    color: '#222',
    lineHeight: 18,
    textAlign: 'left',
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
    left: 30,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    // height set inline
  },
  continueText: {
    color: '#bdbdbd',
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    textAlign: 'center',
  },
});