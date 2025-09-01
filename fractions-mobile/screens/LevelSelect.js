import React from 'react';
import { ImageBackground, StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';

export default function LevelSelect({ navigation }) {
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
            source={require('../assets/profile.png')} // Replace with your profile image
            style={styles.profilePic}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>Justine Nabunturan</Text>
            <Text style={styles.profileGrade}>Grade 4 Rizal</Text>
          </View>
          <View style={styles.gridIconBox}>
            <Image
              source={require('../assets/radix-icons_dashboard.png')} // Replace with your grid icon
              style={styles.gridIcon}
            />
          </View>
        </View>

        {/* Level Cards */}
        <View style={styles.levelBox}>
          {/* Level 1 */}
          <TouchableOpacity style={styles.levelCard1} onPress={() => navigation.navigate('CharacterSelect')}>
            <Image source={require('../assets/level1.png')} style={styles.levelIcon} />
            <Text style={styles.levelText}>LEVEL 1</Text>
            <Image source={require('../assets/check.png')} style={styles.levelStatusIcon} />
          </TouchableOpacity>
          {/* Level 2 */}
          <TouchableOpacity style={styles.levelCard2} onPress={() => navigation.navigate('CharacterSelect')}>
            <Image source={require('../assets/level2.png')} style={styles.levelIcon} />
            <Text style={styles.levelText2}>LEVEL 2</Text>
          </TouchableOpacity>
          {/* Level 3 */}
          <View style={styles.levelCard3}>
            <Image source={require('../assets/level3.png')} style={styles.levelIcon} />
            <Text style={styles.levelText3}>LEVEL 3</Text>
            <Image source={require('../assets/lock.png')} style={styles.levelStatusIcon} />
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginTop: 30,
    marginBottom: 24,
    width: 320,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  profileName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: '#222',
  },
  profileGrade: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#888',
  },
  gridIconBox: {
    backgroundColor: '#FFA85C',
    borderRadius: 8,
    padding: 6,
    marginLeft: 10,
  },
  gridIcon: {
    width: 22,
    height: 22,
    tintColor: '#fff',
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
  levelCard2: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFA85C',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 16,
    width: 280,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
  },
  levelCard3: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#888',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 18,
    width: 280,
    backgroundColor: '#e0e0e0',
    justifyContent: 'flex-start',
  },
  levelIcon: {
    width: 32,
    height: 32,
    marginRight: 18,
  },
  levelText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#111',
    flex: 1,
  },
  levelText2: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#FFA85C',
    flex: 1,
  },
  levelText3: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#222',
    opacity: 0.5,
    flex: 1,
  },
  levelStatusIcon: {
    width: 28,
    height: 28,
    marginLeft: 10,
  },
});