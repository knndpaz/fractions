import React, { useState, useEffect, useRef } from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Text,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function HomePage({ navigation }) {
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const logoBounce = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  const cloud1Pos = useRef(new Animated.Value(-100)).current;
  const cloud2Pos = useRef(new Animated.Value(-150)).current;
  const cloud3Pos = useRef(new Animated.Value(-200)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const playButtonScale = useRef(new Animated.Value(1)).current;
  const musicButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.spring(logoScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Logo bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoBounce, {
          toValue: -20,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(logoBounce, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Logo pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Cloud animations - continuous movement
    const animateCloud = (cloudPos, duration) => {
      cloudPos.setValue(-100);
      Animated.loop(
        Animated.timing(cloudPos, {
          toValue: width + 100,
          duration: duration,
          useNativeDriver: true,
        })
      ).start();
    };

    animateCloud(cloud1Pos, 25000);
    animateCloud(cloud2Pos, 30000);
    animateCloud(cloud3Pos, 35000);
  }, []);

  const handlePlayPress = () => {
    Animated.sequence([
      Animated.timing(playButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(playButtonScale, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate("Login");
    });
  };

  const handleMusicPress = () => {
    Animated.sequence([
      Animated.timing(musicButtonScale, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(musicButtonScale, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    setIsMusicPlaying(!isMusicPlaying);
    // Here you would integrate with react-native-sound or expo-av
    // Example: if (isMusicPlaying) sound.pause(); else sound.play();
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <ImageBackground
        source={require("../assets/bg 1.png")}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Animated Clouds */}
        <Animated.View
          style={[
            styles.cloud,
            { top: height * 0.15, transform: [{ translateX: cloud1Pos }] },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.cloudShape, { width: 80, height: 40 }]} />
        </Animated.View>

        <Animated.View
          style={[
            styles.cloud,
            { top: height * 0.25, transform: [{ translateX: cloud2Pos }] },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.cloudShape, { width: 100, height: 50 }]} />
        </Animated.View>

        <Animated.View
          style={[
            styles.cloud,
            { top: height * 0.1, transform: [{ translateX: cloud3Pos }] },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.cloudShape, { width: 70, height: 35 }]} />
        </Animated.View>

        {/* Music Button */}
        <Animated.View
          style={[
            styles.musicButtonContainer,
            { transform: [{ scale: musicButtonScale }] },
          ]}
        >
          <TouchableOpacity
            style={styles.musicButton}
            onPress={handleMusicPress}
            activeOpacity={0.7}
          >
            <Text style={styles.musicIcon}>{isMusicPlaying ? "🔊" : "🔇"}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Logo - Centered above Play Button */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [
                  { scale: Animated.multiply(logoScale, logoPulse) },
                  { translateY: logoBounce },
                ],
              },
            ]}
          >
            <Image
              source={require("../assets/favicon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Play Button */}
          <Animated.View
            style={{
              transform: [{ scale: playButtonScale }],
            }}
          >
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayPress}
              activeOpacity={0.8}
            >
              <Image
                source={require("../assets/pixel_play-solid.png")}
                style={styles.playIcon}
              />
              <Text style={styles.playText}>PLAY</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Decorative sparkles */}
          <View style={styles.sparkleContainer} pointerEvents="none">
            <Text style={[styles.sparkle, { top: -30, left: -40 }]}>✨</Text>
            <Text style={[styles.sparkle, { top: -30, right: -40 }]}>✨</Text>
            <Text style={[styles.sparkle, { bottom: -30, left: -30 }]}>⭐</Text>
            <Text style={[styles.sparkle, { bottom: -30, right: -30 }]}>
              ⭐
            </Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  musicButtonContainer: {
    position: "absolute",
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 50,
    right: 20,
    zIndex: 1000,
  },
  musicButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 3,
    borderColor: "#FFA85C",
  },
  musicIcon: {
    fontSize: 28,
  },
  logoContainer: {
    marginBottom: 50,
    borderWidth: 6,
    borderColor: "#fff",
    borderRadius: 30,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  logo: {
    width: width * 0.35,
    height: width * 0.35,
    maxWidth: 160,
    maxHeight: 160,
    minWidth: 120,
    minHeight: 120,
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFA85C",
    paddingVertical: height * 0.025,
    paddingHorizontal: width * 0.1,
    borderRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 4,
    borderColor: "#fff",
    minWidth: width * 0.5,
    justifyContent: "center",
  },
  playIcon: {
    width: width * 0.12,
    height: width * 0.12,
    marginRight: 12,
    maxWidth: 56,
    maxHeight: 56,
    minWidth: 40,
    minHeight: 40,
  },
  playText: {
    color: "#fff",
    fontSize: width * 0.08,
    fontWeight: "bold",
    letterSpacing: 3,
    fontFamily: "Poppins-Bold",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  cloud: {
    position: "absolute",
    opacity: 0.7,
  },
  cloudShape: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 50,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  sparkleContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  sparkle: {
    position: "absolute",
    fontSize: 24,
    opacity: 0.8,
  },
});
