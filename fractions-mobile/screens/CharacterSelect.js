import React, { useState, useRef, useEffect } from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase";

const { width, height } = Dimensions.get("window");

const characters = [
  require("../assets/chara1.png"),
  require("../assets/chara2.png"),
  require("../assets/chara3.png"),
  require("../assets/chara4.png"),
  require("../assets/chara5.png"),
  require("../assets/chara6.png"),
];

const CharacterCard = ({ img, idx, selected, onSelect }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selected) {
      // Pulse animation for selected character
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [selected]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
    onSelect();
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={styles.cardContainer}
    >
      <Animated.View
        style={[
          styles.charCell,
          selected && styles.selectedCell,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {selected && (
          <Animated.View
            style={[styles.glowEffect, { opacity: glowOpacity }]}
          />
        )}
        <View style={styles.charImgWrapper}>
          <Image source={img} style={styles.charImg} />
        </View>
        {selected && (
          <Animated.View
            style={[styles.checkIconContainer, { opacity: glowOpacity }]}
          >
            <View style={styles.checkCircle}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const getCurrentUserId = async () => {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id || null;
  } catch {
    return null;
  }
};

const saveCharacterForUser = async (characterIdx) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return;
    // Update students table
    await supabase
      .from("students")
      .update({ character_index: characterIdx })
      .eq("user_id", userId);
    // Save locally for fast access
    await AsyncStorage.setItem("character_index", String(characterIdx));
  } catch (e) {
    // handle error
  }
};

export default function CharacterSelect({ navigation }) {
  const [selected, setSelected] = useState(0);
  const titleScale = useRef(new Animated.Value(0)).current;
  const boxSlide = useRef(new Animated.Value(50)).current;
  const boxOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Cloud animations
  const cloud1Pos = useRef(new Animated.Value(-100)).current;
  const cloud2Pos = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    // Title entrance
    Animated.spring(titleScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Box slide in
    Animated.parallel([
      Animated.timing(boxSlide, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(boxOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Cloud animations
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

    animateCloud(cloud1Pos, 30000);
    animateCloud(cloud2Pos, 35000);
  }, []);

  const handleProceed = async () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    await saveCharacterForUser(selected);

    setTimeout(() => {
      navigation.navigate("Dialogue", { selectedCharacter: selected });
    }, 200);
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
            { top: height * 0.2, transform: [{ translateX: cloud1Pos }] },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.cloudShape, { width: 100, height: 50 }]} />
        </Animated.View>

        <Animated.View
          style={[
            styles.cloud,
            { top: height * 0.15, transform: [{ translateX: cloud2Pos }] },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.cloudShape, { width: 80, height: 40 }]} />
        </Animated.View>

        {/* Title */}
        <Animated.View
          style={[styles.topPrompt, { transform: [{ scale: titleScale }] }]}
        >
          <View style={styles.promptBadge}>
            <Text style={styles.promptText}>⚔️ Choose Your Fighter! ⚔️</Text>
            <View style={styles.promptUnderline} />
          </View>
        </Animated.View>

        {/* Main Content */}
        <View style={styles.centered}>
          <Animated.View
            style={[
              styles.selectBox,
              {
                transform: [{ translateY: boxSlide }],
                opacity: boxOpacity,
              },
            ]}
          >
            <Text style={styles.subtitle}>Select Your Character</Text>

            <View style={styles.grid}>
              {characters.map((img, idx) => (
                <CharacterCard
                  key={idx}
                  img={img}
                  idx={idx}
                  selected={selected === idx}
                  onSelect={() => setSelected(idx)}
                />
              ))}
            </View>

            <Animated.View
              style={[
                styles.proceedBtnWrapper,
                { transform: [{ scale: buttonScale }] },
              ]}
            >
              <TouchableOpacity
                style={styles.proceedBtn}
                onPress={handleProceed}
                activeOpacity={0.8}
              >
                <Text style={styles.proceedText}>PROCEED TO BATTLE</Text>
                <Text style={styles.proceedArrow}>→</Text>
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.helperText}>Tap a character to select</Text>
          </Animated.View>
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
  topPrompt: {
    marginTop: StatusBar.currentHeight ? StatusBar.currentHeight + 30 : 60,
    alignItems: "center",
    zIndex: 2,
    paddingHorizontal: 20,
  },
  promptBadge: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: Math.min(width * 0.06, 28),
    paddingVertical: Math.min(height * 0.02, 16),
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 4,
    borderColor: "#FFA85C",
    alignItems: "center",
  },
  promptText: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.055, 24),
    color: "#222",
    letterSpacing: 1,
  },
  promptUnderline: {
    width: "80%",
    height: 3,
    backgroundColor: "#FFA85C",
    marginTop: 6,
    borderRadius: 2,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  selectBox: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 24,
    paddingVertical: Math.min(height * 0.04, 36),
    paddingHorizontal: Math.min(width * 0.05, 24),
    alignItems: "center",
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 4,
    borderColor: "#fff",
  },
  subtitle: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.045, 18),
    color: "#666",
    marginBottom: Math.min(height * 0.025, 24),
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Math.min(height * 0.025, 24),
    width: "100%",
    gap: Math.min(width * 0.04, 20),
  },
  cardContainer: {
    width: Math.min(width * 0.25, 110),
    height: Math.min(height * 0.12, 90),
    marginVertical: Math.min(height * 0.015, 12),
  },
  charCell: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "rgba(255, 168, 92, 0.2)",
    justifyContent: "flex-end",
    alignItems: "center",
    position: "relative",
    overflow: "visible",
    borderWidth: 3,
    borderColor: "transparent",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  selectedCell: {
    backgroundColor: "rgba(255, 168, 92, 0.4)",
    borderColor: "#1DB954",
    borderWidth: 4,
    elevation: 8,
    shadowColor: "#1DB954",
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  glowEffect: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 24,
    backgroundColor: "#1DB954",
    opacity: 0.3,
    zIndex: -1,
  },
  charImgWrapper: {
    position: "absolute",
    top: -50,
    alignItems: "center",
    width: "100%",
    zIndex: 1,
  },
  charImg: {
    width: Math.min(width * 0.22, 95),
    height: Math.min(height * 0.18, 140),
    resizeMode: "contain",
  },
  checkIconContainer: {
    position: "absolute",
    bottom: 6,
    right: 6,
    zIndex: 2,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1DB954",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 3,
    borderColor: "#fff",
  },
  checkMark: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: -2,
  },
  proceedBtnWrapper: {
    width: "100%",
    marginTop: Math.min(height * 0.01, 8),
  },
  proceedBtn: {
    width: "100%",
    backgroundColor: "#FFA85C",
    borderRadius: 16,
    paddingVertical: Math.min(height * 0.02, 16),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 3,
    borderColor: "#fff",
  },
  proceedText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.045, 18),
    letterSpacing: 1.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  proceedArrow: {
    color: "#fff",
    fontSize: Math.min(width * 0.05, 22),
    marginLeft: 8,
    fontWeight: "bold",
  },
  helperText: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.032, 12),
    color: "#999",
    marginTop: Math.min(height * 0.015, 12),
    letterSpacing: 0.3,
  },
});
