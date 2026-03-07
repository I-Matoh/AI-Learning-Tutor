import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function AuthForm({
  mode = "login",
  onSubmit,
  loading = false,
  error = "",
  onToggleMode,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const title = useMemo(
    () => (mode === "signup" ? "Create account" : "Welcome back"),
    [mode]
  );
  const actionText = useMemo(
    () => (mode === "signup" ? "Sign up" : "Login"),
    [mode]
  );
  const switchText = useMemo(
    () =>
      mode === "signup"
        ? "Already have an account? Login"
        : "No account yet? Sign up",
    [mode]
  );

  const handleSubmit = () => {
    onSubmit({ email: email.trim(), password });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <TextInput
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor="#7c7c7c"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />

      <TextInput
        autoCapitalize="none"
        autoComplete="password"
        placeholder="Password"
        placeholderTextColor="#7c7c7c"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        editable={!loading}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.button, loading ? styles.buttonDisabled : null]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>{actionText}</Text>
        )}
      </Pressable>

      <Pressable onPress={onToggleMode} disabled={loading}>
        <Text style={styles.switchText}>{switchText}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1a1a1a",
    backgroundColor: "#fafafa",
  },
  button: {
    backgroundColor: "#1769ff",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  switchText: {
    textAlign: "center",
    color: "#1769ff",
    fontWeight: "600",
    marginTop: 4,
  },
  error: {
    color: "#b00020",
    fontSize: 14,
  },
});
