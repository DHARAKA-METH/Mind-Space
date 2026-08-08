import { router, Stack } from "expo-router";
import { ChevronRight, Lock, Mail, User } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { registerUser } from "../services/auth.service";

const colors = {
  background: "#F9F5F1",
  lavender: "#CCC5E8",
  purple: "#8D7BB8",
  peach: "#F47F63",
  text: "#1F1F2E",
  secondaryText: "#8C8992",
  white: "#FFFFFF",
  charmBlack: "#2C2C2C",
};

const RegisterScreen = () => {
  const [role, setRole] = useState<"student" | "counselor">("student");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter your name");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Validation Error", "Please enter your email");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Validation Error", "Please enter your password");
      return;
    }

    try {
      setLoading(true);

      await registerUser({
        name,
        email,
        password,
        userType: role,
      });

      Alert.alert("Success", "Account created successfully");

      if (role === "counselor") {
        router.replace("/(tabs)/(counselor)/CounselorDashboard");
      } else {
        router.replace("/(tabs)/(mood)/moodDashboard");
      }
    } catch (error: any) {
      let message = "Something went wrong";

      switch (error.code) {
        case "auth/email-already-in-use":
          message = "Email already exists";
          break;

        case "auth/invalid-email":
          message = "Invalid email address";
          break;

        case "auth/weak-password":
          message = "Password should be at least 6 characters";
          break;
      }

      Alert.alert("Registration Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />

      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="flex-1 px-8 items-center justify-center mb-20">
          {/* Logo */}
          <View className="items-center mb-10">
            <Image source={require("../../../../assets/images/icon.png")} style={{ width: 96, height: 96, borderRadius: 30 }} />

            <Text className="text-3xl font-bold" style={{ color: colors.text }}>
              MindSpace
            </Text>

            <Text className="mt-1" style={{ color: colors.secondaryText }}>
              Your student wellness companion
            </Text>
          </View>

          {/* Inputs */}
          <View className="w-full mb-5">
            {/* Name */}
            <View
              className="flex-row items-center rounded-2xl px-4 h-14 mb-4 border"
              style={{ backgroundColor: colors.white, borderColor: "#ECE6E2" }}
            >
              <User color={colors.peach} size={20} />

              <TextInput
                value={name}
                onChangeText={setName}
                className="flex-1 text-base ml-3"
                style={{ color: colors.text }}
                placeholder="Full Name"
                placeholderTextColor={colors.secondaryText}
              />
            </View>

            {/* Email */}
            <View
              className="flex-row items-center rounded-2xl px-4 h-14 mb-4 border"
              style={{ backgroundColor: colors.white, borderColor: "#ECE6E2" }}
            >
              <Mail color={colors.lavender} size={20} />

              <TextInput
                value={email}
                onChangeText={setEmail}
                className="flex-1 text-base ml-3"
                style={{ color: colors.text }}
                placeholder="student@university.edu"
                placeholderTextColor={colors.secondaryText}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View
              className="flex-row items-center rounded-2xl px-4 h-14 border"
              style={{ backgroundColor: colors.white, borderColor: "#ECE6E2" }}
            >
              <Lock color={colors.lavender} size={20} />

              <TextInput
                value={password}
                onChangeText={setPassword}
                className="flex-1 text-base ml-3"
                style={{ color: colors.text }}
                placeholder="Password"
                placeholderTextColor={colors.secondaryText}
                secureTextEntry
              />
            </View>
          </View>

          {/* Role Selector */}
          <Text className="self-start mb-4 text-base" style={{ color: colors.secondaryText }}>
            Sign up as
          </Text>

          <View className="flex-row justify-between w-full mb-8">
            {/* Student */}
            <TouchableOpacity
              onPress={() => setRole("student")}
              className="flex-row items-center justify-center py-4 rounded-2xl w-[48%]"
              style={{
                backgroundColor: role === "student" ? colors.charmBlack : colors.white,
                borderWidth: 1,
                borderColor: role === "student" ? colors.charmBlack : "#ECE6E2",
              }}
            >
              <User size={18} color={role === "student" ? "#fff" : colors.charmBlack} />

              <Text
                className="ml-2 font-semibold"
                style={{ color: role === "student" ? "#fff" : colors.secondaryText }}
              >
                Student
              </Text>
            </TouchableOpacity>

            {/* Counselor */}
            <TouchableOpacity
              onPress={() => setRole("counselor")}
              className="flex-row items-center justify-center py-4 rounded-2xl w-[48%]"
              style={{
                backgroundColor: role === "counselor" ? colors.charmBlack : colors.white,
                borderWidth: 1,
                borderColor: role === "counselor" ? colors.charmBlack : "#ECE6E2",
              }}
            >
              <User size={18} color={role === "counselor" ? "#fff" : colors.charmBlack} />

              <Text
                className="ml-2 font-semibold"
                style={{ color: role === "counselor" ? "#fff" : colors.secondaryText }}
              >
                Counselor
              </Text>
            </TouchableOpacity>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            className="flex-row w-full h-16 rounded-3xl justify-center items-center mb-5"
            style={{
              backgroundColor: colors.purple,
              shadowColor: colors.purple,
              shadowOpacity: 0.15,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }}
          >
            <Text className="text-lg font-bold mr-2" style={{ color: "#FFFFFF" }}>
              {loading ? "Creating..." : "Create Account"}
            </Text>

            <ChevronRight color="#FFFFFF" size={20} />
          </TouchableOpacity>

          {/* Login Link */}
          <Text style={{ color: colors.secondaryText, fontSize: 14 }}>
            Already have an account?{" "}
            <Pressable onPress={() => router.push("/Route/login")}>
              <Text className="font-bold" style={{ color: colors.purple }}>
                Sign In
              </Text>
            </Pressable>
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
};

export default RegisterScreen;
