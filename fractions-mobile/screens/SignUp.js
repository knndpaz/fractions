import React, { useState } from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { supabase } from "../supabase";

export default function SignUp({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !fullName || !username) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (username.length < 3) {
      Alert.alert("Error", "Username must be at least 3 characters");
      return;
    }

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
        // Automatically navigate to login after successful signup
        navigation.navigate("Login");

        // Show success message briefly
        setTimeout(() => {
          Alert.alert(
            "Success",
            "Account created successfully! You can now log in."
          );
        }, 500);
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/bg 1.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.centered}>
        <View style={styles.signupBox}>
          <Text style={styles.signupTitle}>SIGN UP</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#bdbdbd"
            value={fullName}
            onChangeText={setFullName}
          />
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
            placeholder="Email"
            placeholderTextColor="#bdbdbd"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#bdbdbd"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#bdbdbd"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.signupButton, loading && styles.disabledButton]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.signupButtonText}>
              {loading ? "CREATING ACCOUNT..." : "SIGN UP"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  signupBox: {
    width: 260,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 32,
    paddingHorizontal: 18,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  signupTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    marginBottom: 18,
    color: "#222",
    letterSpacing: 1,
  },
  input: {
    width: "100%",
    height: 38,
    backgroundColor: "#f3f3f3",
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 14,
    fontSize: 14,
    fontFamily: "Poppins-Bold",
    color: "#222",
  },
  signupButton: {
    width: "100%",
    backgroundColor: "#FFA85C",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 6,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  signupButtonText: {
    color: "#fff",
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  loginLink: {
    marginTop: 16,
  },
  loginText: {
    color: "#FFA85C",
    fontFamily: "Poppins-Bold",
    fontSize: 12,
  },
});
