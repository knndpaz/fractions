import React, { useState, useRef, useEffect } from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { supabase } from "../supabase";

const { width, height } = Dimensions.get("window");

// Responsive scaling functions
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export default function SignUp({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Sparkle animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !fullName || !username) {
      Alert.alert(
        "Missing Information",
        "Please fill in all fields to continue"
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "Passwords do not match. Please try again."
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 6 characters long"
      );
      return;
    }

    if (username.length < 3) {
      Alert.alert(
        "Invalid Username",
        "Username must be at least 3 characters long"
      );
      return;
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password,
        options: {
          data: {
            full_name: fullName,
            username: username.toLowerCase().trim(),
          },
        },
      });

      if (error) {
        Alert.alert("Sign Up Failed", error.message);
      } else {
        navigation.navigate("Login");
        setTimeout(() => {
          Alert.alert(
            "🎉 Success!",
            "Account created successfully! You can now log in and start your fraction adventure."
          );
        }, 500);
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  const sparkleRotate = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ImageBackground
        source={require("../assets/bg 1.png")}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Gradient overlay */}
        <View style={styles.gradientOverlay} />

        {/* Animated sparkles */}
        <Animated.View
          style={[
            styles.sparkle,
            {
              top: verticalScale(100),
              left: scale(40),
              opacity: sparkleOpacity,
              transform: [{ rotate: sparkleRotate }],
            },
          ]}
        >
          <Text style={styles.sparkleText}>✨</Text>
        </Animated.View>
        <Animated.View
          style={[
            styles.sparkle,
            {
              top: verticalScale(200),
              right: scale(30),
              opacity: sparkleOpacity,
              transform: [{ rotate: sparkleRotate }],
            },
          ]}
        >
          <Text style={styles.sparkleText}>⭐</Text>
        </Animated.View>
        <Animated.View
          style={[
            styles.sparkle,
            {
              bottom: verticalScale(150),
              left: scale(50),
              opacity: sparkleOpacity,
              transform: [{ rotate: sparkleRotate }],
            },
          ]}
        >
          <Text style={styles.sparkleText}>💫</Text>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.signupBox,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.signupTitle}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join the fraction adventure! 🚀
              </Text>
            </View>

            {/* Input fields */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#999"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>@</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#999"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? "👁️" : "🙈"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={styles.eyeIcon}>
                    {showConfirmPassword ? "👁️" : "🙈"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Password requirements */}
            <View style={styles.requirementsBox}>
              <Text style={styles.requirementsTitle}>
                Password Requirements:
              </Text>
              <Text style={styles.requirementText}>
                • At least 6 characters
              </Text>
              <Text style={styles.requirementText}>
                • Username at least 3 characters
              </Text>
            </View>

            {/* Sign up button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.signupButton, loading && styles.disabledButton]}
                onPress={handleSignUp}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.signupButtonText}>
                  {loading ? "Creating Account..." : "Sign Up 🎯"}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Login link */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.7}
            >
              <Text style={styles.loginText}>
                Already have an account?{" "}
                <Text style={styles.loginTextBold}>Login</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
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
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: verticalScale(40),
  },
  signupBox: {
    width: scale(340),
    maxWidth: "90%",
    backgroundColor: "#fff",
    borderRadius: moderateScale(28),
    paddingVertical: verticalScale(36),
    paddingHorizontal: scale(24),
    alignItems: "center",
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    borderWidth: moderateScale(4),
    borderColor: "#FFA85C",
  },
  header: {
    width: "100%",
    alignItems: "center",
    marginBottom: verticalScale(24),
    paddingBottom: verticalScale(16),
    borderBottomWidth: moderateScale(2),
    borderBottomColor: "#f0f0f0",
  },
  signupTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(28),
    color: "#222",
    letterSpacing: 0.5,
    marginBottom: verticalScale(4),
  },
  subtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: moderateScale(14),
    color: "#666",
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    gap: verticalScale(14),
    marginBottom: verticalScale(16),
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: moderateScale(16),
    paddingHorizontal: scale(16),
    height: verticalScale(56),
    borderWidth: moderateScale(2),
    borderColor: "#e0e0e0",
  },
  inputIcon: {
    fontSize: moderateScale(20),
    marginRight: scale(12),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(15),
    fontFamily: "Poppins-Regular",
    color: "#222",
  },
  eyeButton: {
    padding: scale(8),
  },
  eyeIcon: {
    fontSize: moderateScale(18),
  },
  requirementsBox: {
    width: "100%",
    backgroundColor: "#f0f7ff",
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginBottom: verticalScale(20),
    borderLeftWidth: moderateScale(4),
    borderLeftColor: "#FFA85C",
  },
  requirementsTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(12),
    color: "#666",
    marginBottom: verticalScale(4),
  },
  requirementText: {
    fontFamily: "Poppins-Regular",
    fontSize: moderateScale(11),
    color: "#888",
    lineHeight: moderateScale(18),
  },
  signupButton: {
    width: scale(290),
    backgroundColor: "#FFA85C",
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(16),
    alignItems: "center",
    elevation: 8,
    shadowColor: "#FFA85C",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: moderateScale(3),
    borderColor: "#fff",
  },
  disabledButton: {
    backgroundColor: "#ccc",
    shadowOpacity: 0.2,
  },
  signupButtonText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(18),
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: verticalScale(20),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(12),
    color: "#999",
    marginHorizontal: scale(12),
  },
  loginLink: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(20),
  },
  loginText: {
    color: "#666",
    fontFamily: "Poppins-Regular",
    fontSize: moderateScale(14),
    textAlign: "center",
  },
  loginTextBold: {
    color: "#FFA85C",
    fontFamily: "Poppins-Bold",
    fontSize: moderateScale(14),
  },
  sparkle: {
    position: "absolute",
    zIndex: 1,
  },
  sparkleText: {
    fontSize: moderateScale(32),
  },
});
