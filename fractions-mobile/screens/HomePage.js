import React from 'react';
import { ImageBackground, StyleSheet, View, TouchableOpacity, Image, Text } from 'react-native';

export default function HomePage({ navigation }) {
  return (
    <ImageBackground
      source={require('../assets/bg 1.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.centered}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Image source={require('../assets/pixel_play-solid.png')} style={styles.playIcon} />
          <Text style={styles.playText}>PLAY</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFA85C',
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 3,
    borderColor: '#ffffffff',
  },
  playIcon: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  playText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
    fontFamily: 'Poppins-Bold', // Use Poppins font
  },
});