import React from 'react';
import { ImageBackground, StyleSheet, View, TouchableOpacity, Text, Image } from 'react-native';

export default function MapLevels({ navigation }) {
  // Example positions for the level buttons (absolute positioning)
  // You can adjust left/top for each button as needed
  const levelButtons = [
    { number: 1, color: '#1DB954', left: 140, top: 620, onPress: () => navigation.navigate('Quiz') },
    { number: 2, color: '#FFA85C', left: 330, top: 600, onPress: () => {/* navigation logic for level 2 */} },
    { number: 3, color: '#888', left: 170, top: 400, onPress: () => {/* navigation logic for level 3 */} },
    { number: 4, color: '#888', left: 130, top: 300, onPress: () => {/* navigation logic for level 4 */} },
  ];

  return (
    <ImageBackground
      source={require('../assets/map 1.png')}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Menu Button */}
      <TouchableOpacity style={styles.menuBtn} onPress={() => {/* navigation logic for menu */}}>
        <Image source={require('../assets/menu.png')} style={styles.menuIcon} />
      </TouchableOpacity>
      {/* Level Buttons */}
      {levelButtons.map((btn, idx) => (
        <TouchableOpacity
          key={btn.number}
          style={[
            styles.levelBtn,
            {
              backgroundColor: btn.color,
              left: btn.left,
              top: btn.top,
            },
          ]}
          onPress={btn.onPress}
        >
          <Text style={styles.levelBtnText}>{btn.number}</Text>
        </TouchableOpacity>
      ))}
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
    backgroundColor: '#FFA85C', // Add background color
    borderRadius: 12,           // Rounded corners for the background
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
  levelBtn: {
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
  levelBtnText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    fontWeight: 'bold',
  },
});