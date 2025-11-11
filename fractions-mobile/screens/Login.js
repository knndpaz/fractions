import React, { useState, useEffect, useRef } from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase";
import { useMusic } from "../App";

const { width, height } = Dimensions.get("window");

// Custom Toast Notification Component
const ToastNotification = ({ message, type, visible, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => onHide());
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const bgColor =
    type === "error" ? "#ff4444" : type === "warning" ? "#ff9800" : "#4CAF50";
  const icon = type === "error" ? "❌" : type === "warning" ? "⚠️" : "✅";

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          backgroundColor: bgColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.toastIcon}>{icon}</Text>
      <Text style={styles.toastMessage}>{message}</Text>
    </Animated.View>
  );
};

export default function Login({ navigation }) {
  const { startBackgroundMusic } = useMusic();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "error",
  });

  const cloud1Pos = useRef(new Animated.Value(-100)).current;
  const cloud2Pos = useRef(new Animated.Value(-150)).current;
  const cloud3Pos = useRef(new Animated.Value(-200)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(50)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const loginButtonScale = useRef(new Animated.Value(1)).current;
  const musicButtonScale = useRef(new Animated.Value(1)).current;

  const showToast = (message, type = "error") => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ visible: false, message: "", type: "error" });
  };

  useEffect(() => {
    // Logo entrance animation
    Animated.spring(logoScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Form slide in animation
    Animated.parallel([
      Animated.timing(formSlide, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
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

    animateCloud(cloud1Pos, 25000);
    animateCloud(cloud2Pos, 30000);
    animateCloud(cloud3Pos, 35000);
  }, []);

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
  };

  const handleLoginPress = () => {
    Animated.sequence([
      Animated.timing(loginButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(loginButtonScale, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    handleLogin();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showToast("Please fill in both email and password fields.", "warning");
      return;
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters long.", "warning");
      return;
    }

    setLoading(true);

    try {
      console.log("Attempting login for:", email);

      const response = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password,
      });

      console.log("Login response:", response);

      const { data, error } = response;

      if (error) {
        console.log("Login error:", error);

        // Handle specific error cases with better detection
        if (
          error.message?.toLowerCase().includes("invalid login credentials")
        ) {
          showToast("Invalid email or password. Please try again.", "error");
        } else if (
          error.message?.toLowerCase().includes("user not found") ||
          error.message?.toLowerCase().includes("not found") ||
          error.status === 400
        ) {
          showToast("Account does not exist. Please sign up first.", "error");
        } else if (
          error.message?.toLowerCase().includes("email not confirmed")
        ) {
          showToast("Please confirm your email before logging in.", "warning");
        } else if (error.message?.toLowerCase().includes("too many requests")) {
          showToast(
            "Too many login attempts. Please try again later.",
            "warning"
          );
        } else {
          showToast(
            error.message || "Login failed. Please try again.",
            "error"
          );
        }
      } else if (data?.user) {
        console.log("Login successful:", data.user.email);

        // Check if this is a first-time login
        const hasLoggedInBefore = await AsyncStorage.getItem(
          "hasLoggedInBefore"
        );

        // Store user data locally
        const userData = {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name || "User",
          username: data.user.user_metadata?.username || email.split("@")[0],
        };

        await AsyncStorage.setItem("userData", JSON.stringify(userData));

        // After login, fetch character_index
        const { data: studentRows } = await supabase
          .from("students")
          .select("character_index")
          .eq("user_id", data.user.id)
          .single();

        const characterIdx = studentRows?.character_index;
        await AsyncStorage.setItem("character_index", String(characterIdx ?? ""));

        showToast("Login successful!", "success");

        // Start background music after successful login
        startBackgroundMusic();

        setTimeout(() => {
          if (characterIdx !== null && characterIdx !== undefined && characterIdx !== "") {
            navigation.replace("Dialogue", { selectedCharacter: Number(characterIdx) });
          } else {
            navigation.replace("CharacterSelect");
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Catch block error:", error);

      // Check if it's a network error
      if (
        error.message?.toLowerCase().includes("network") ||
        error.message?.toLowerCase().includes("fetch")
      ) {
        showToast("Network error. Please check your connection.", "error");
      } else {
        showToast("Something went wrong. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Toast Notification */}
      <ToastNotification
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
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

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.contentContainer}>
            {/* Logo at the top */}
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  transform: [{ scale: logoScale }],
                },
              ]}
            >
              <Image
                source={require("../assets/favicon.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Login Form */}
            <Animated.View
              style={[
                styles.loginBox,
                {
                  transform: [{ translateY: formSlide }],
                  opacity: formOpacity,
                },
              ]}
            >
              <Text style={styles.loginTitle}>LOGIN</Text>

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#bdbdbd"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />

              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password"
                  placeholderTextColor="#bdbdbd"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Animated.View
                style={{
                  width: "100%",
                  transform: [{ scale: loginButtonScale }],
                }}
              >
                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.disabledButton]}
                  onPress={handleLoginPress}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? "LOGGING IN..." : "LOGIN"}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                style={styles.signupLink}
                onPress={() => navigation.navigate("SignUp")}
                disabled={loading}
              >
                <Text style={styles.signupText}>
                  Don't have an account?{" "}
                  <Text style={styles.signupTextBold}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
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
    marginBottom: 30,
    borderWidth: 5,
    borderColor: "#fff",
    borderRadius: 25,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  logo: {
    width: width * 0.25,
    height: width * 0.25,
    maxWidth: 120,
    maxHeight: 120,
    minWidth: 80,
    minHeight: 80,
  },
  loginBox: {
    width: "100%",
    maxWidth: 450,
    minWidth: 280,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    paddingVertical: Math.min(height * 0.04, 40),
    paddingHorizontal: Math.min(width * 0.08, 40),
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 3,
    borderColor: "#fff",
  },
  loginTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.06, 28),
    marginBottom: Math.min(height * 0.025, 25),
    color: "#222",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  passwordContainer: {
    width: "100%",
    position: "relative",
    marginBottom: Math.min(height * 0.02, 20),
  },
  input: {
    width: "100%",
    height: Math.min(height * 0.06, 50),
    minHeight: 45,
    maxHeight: 60,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: Math.min(height * 0.02, 20),
    fontSize: Math.min(width * 0.04, 16),
    fontFamily: "Poppins-Bold",
    color: "#222",
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  passwordInput: {
    paddingRight: 50,
    marginBottom: 0,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -15 }],
    padding: 8,
    zIndex: 10,
  },
  eyeIcon: {
    fontSize: 22,
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#FFA85C",
    borderRadius: 12,
    paddingVertical: Math.min(height * 0.018, 16),
    minHeight: 45,
    alignItems: "center",
    marginTop: Math.min(height * 0.01, 10),
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    borderWidth: 3,
    borderColor: "#fff",
  },
  disabledButton: {
    backgroundColor: "#ccc",
    borderColor: "#999",
  },
  loginButtonText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.045, 18),
    letterSpacing: 1.5,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  signupLink: {
    marginTop: Math.min(height * 0.025, 25),
    paddingVertical: 8,
  },
  signupText: {
    color: "#666",
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.035, 14),
  },
  signupTextBold: {
    color: "#FFA85C",
    fontFamily: "Poppins-Bold",
  },
  toastContainer: {
    position: "absolute",
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 60,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    zIndex: 9999,
  },
  toastIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  toastMessage: {
    flex: 1,
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: Math.min(width * 0.04, 16),
    lineHeight: 22,
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
});
