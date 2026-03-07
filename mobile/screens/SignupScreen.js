import React, { useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import AuthForm from "../components/AuthForm";
import { supabase } from "../lib/supabaseClient";

export default function SignupScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async ({ email, password }) => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // If email confirmation is enabled, session may be null until user verifies email.
    if (!data.session) {
      setError("Account created. Check your email to confirm your account.");
      return;
    }

    // If session is returned immediately, App.js auth listener will switch to app flow.
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.subtitle}>Create your account</Text>
        <AuthForm
          mode="signup"
          loading={loading}
          error={error}
          onSubmit={handleSignup}
          onToggleMode={() => navigation.navigate("Login")}
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
