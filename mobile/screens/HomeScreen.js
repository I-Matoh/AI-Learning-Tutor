import React from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabaseClient";

export default function HomeScreen() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // App.js auth listener updates navigation automatically after sign out.
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Home</Text>
        <Text style={styles.text}>You are authenticated with Supabase.</Text>

        <Pressable style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  text: {
    fontSize: 15,
    color: "#555",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#1e66f5",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
