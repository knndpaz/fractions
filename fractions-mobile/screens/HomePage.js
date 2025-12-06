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
  Platform,
} from "react-native";

// Get initial dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Responsive scaling functions
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// Device type detection
const isSmallDevice = SCREEN_HEIGHT < 700;
const isTablet = SCREEN_WIDTH >= 768;

// Dynamic dimensions hook
const useDimensions = () => {
  const [dimensions, setDimensions] = React.useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });
    return () => subscription?.remove();
  }, []);

  return dimensions;
};

export default function HomePage({ navigation }) {
  const dimensions = useDimensions();
  const { width, height } = dimensions;

  const logoBounce = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  const cloud1Pos = useRef(new Animated.Value(-100)).current;
  const cloud2Pos = useRef(new Animated.Value(-150)).current;
  const cloud3Pos = useRef(new Animated.Value(-200)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const playButtonScale = useRef(new Animated.Value(1)).current;

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
            { top: height * 0.12, transform: [{ translateX: cloud1Pos }] },
          ]}
          pointerEvents="none"
        >
          <View
            style={[styles.cloudShape, { width: scale(80), height: scale(40) }]}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.cloud,
            { top: height * 0.22, transform: [{ translateX: cloud2Pos }] },
          ]}
          pointerEvents="none"
        >
          <View
            style={[
              styles.cloudShape,
              { width: scale(100), height: scale(50) },
            ]}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.cloud,
            { top: height * 0.08, transform: [{ translateX: cloud3Pos }] },
          ]}
          pointerEvents="none"
        >
          <View
            style={[styles.cloudShape, { width: scale(70), height: scale(35) }]}
          />
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
            <Text
              style={[
                styles.sparkle,
                { top: verticalScale(-30), left: scale(-40) },
              ]}
            >
              ✨
            </Text>
            <Text
              style={[
                styles.sparkle,
                { top: verticalScale(-30), right: scale(-40) },
              ]}
            >
              ✨
            </Text>
            <Text
              style={[
                styles.sparkle,
                { bottom: verticalScale(-30), left: scale(-30) },
              ]}
            >
              ⭐
            </Text>
            <Text
              style={[
                styles.sparkle,
                { bottom: verticalScale(-30), right: scale(-30) },
              ]}
            >
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
    paddingHorizontal: scale(20),
  },
  logoContainer: {
    marginBottom: verticalScale(isSmallDevice ? 30 : 50),
    borderWidth: moderateScale(5),
    borderColor: "#fff",
    borderRadius: moderateScale(24),
    padding: moderateScale(isSmallDevice ? 14 : 18),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  logo: {
    width: isTablet ? scale(100) : moderateScale(isSmallDevice ? 100 : 120),
    height: isTablet ? scale(100) : moderateScale(isSmallDevice ? 100 : 120),
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFA85C",
    paddingVertical: verticalScale(isSmallDevice ? 14 : 18),
    paddingHorizontal: scale(isSmallDevice ? 28 : 36),
    borderRadius: moderateScale(18),
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: moderateScale(3.5),
    borderColor: "#fff",
    minWidth: scale(isSmallDevice ? 160 : 180),
    justifyContent: "center",
  },
  playIcon: {
    width: moderateScale(isSmallDevice ? 36 : 44),
    height: moderateScale(isSmallDevice ? 36 : 44),
    marginRight: scale(10),
  },
  playText: {
    color: "#fff",
    fontSize: moderateScale(isSmallDevice ? 22 : 26),
    fontWeight: "bold",
    letterSpacing: 2,
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
    borderRadius: scale(50),
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
    fontSize: moderateScale(isSmallDevice ? 20 : 24),
    opacity: 0.8,
  },
});
