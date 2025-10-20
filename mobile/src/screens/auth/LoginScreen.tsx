import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { signIn, isLoading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleLogin = async () => {
    try {
      setIsSigningIn(true);
      await signIn();
      // Navigation will be handled by the auth state change
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Failed to sign in. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Header */}
        <View style={styles.header}>
          <Ionicons name="fitness" size={60} color="#3B82F6" />
          <Text style={styles.title}>NextLevel Coaching</Text>
          <Text style={styles.subtitle}>Mobile App</Text>
        </View>

        {/* Login Section */}
        <View style={styles.form}>
          <Text style={styles.description}>
            Sign in with your NextLevel Coaching account to access your
            programs, schedule, and messages.
          </Text>

          <TouchableOpacity
            style={[
              styles.loginButton,
              (isLoading || isSigningIn) && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading || isSigningIn}
          >
            {isLoading || isSigningIn ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="log-in" size={20} color="#fff" />
            )}
            <Text style={styles.loginButtonText}>
              {isLoading || isSigningIn
                ? "Signing In..."
                : "Sign In with Kinde"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.helpText}>
            You'll be redirected to your browser to sign in securely.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Secure authentication powered by Kinde
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 4,
  },
  form: {
    marginBottom: 32,
  },
  description: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  loginButtonDisabled: {
    backgroundColor: "#6B7280",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  helpText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    color: "#6B7280",
    fontSize: 12,
    textAlign: "center",
  },
});
