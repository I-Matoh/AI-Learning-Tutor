import React, { useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import AuthForm from "../components/AuthForm";
import { supabase } from "../lib/supabaseClient";

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async ({ email, password }) => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    // Root auth listener in App.js switches navigator based on the new session.
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.subtitle}>Sign in to continue</Text>
        <AuthForm
          mode="login"
          loading={loading}
          error={error}
          onSubmit={handleLogin}
          onToggleMode={() => navigation.navigate("Signup")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f2f5fa",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    gap: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "#5c5c5c",
    marginLeft: 4,
  },
});
