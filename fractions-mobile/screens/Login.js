import React, { useState } from 'react';
import { ImageBackground, StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native';

export default function Login({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <ImageBackground
      source={require('../assets/bg 1.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.centered}>
        <View style={styles.loginBox}>
          <Text style={styles.loginTitle}>LOGIN</Text>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#bdbdbd"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#bdbdbd"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('LevelSelect')}
          >
            <Text style={styles.loginButtonText}>LOGIN</Text>
          </TouchableOpacity>
        </View>
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
  loginBox: {
    width: 260,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 32,
    paddingHorizontal: 18,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  loginTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    marginBottom: 18,
    color: '#222',
    letterSpacing: 1,
  },
  input: {
    width: '100%',
    height: 38,
    backgroundColor: '#f3f3f3',
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 14,
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#222',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#FFA85C',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  loginButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    letterSpacing: 1,
  },
});