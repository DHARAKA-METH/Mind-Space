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

import { commonColors, spacing, studentColors } from "@/src/theme";

import { registerUser } from "../services/auth.service";

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
          headerStyle: { backgroundColor: studentColors.background },
          headerShadowVisible: false,
        }}
      />

      <SafeAreaView className="flex-1 bg-app-background">
        <View className="flex-1 px-8 items-center justify-center mb-20">
          {/* Logo */}
          <View className="items-center mb-10">
            <Image source={require("../../../../assets/images/icon.png")} style={{ width: 96, height: 96, borderRadius: 30 }} />

            <Text className="text-heading font-bold text-app-textPrimary">
              MindSpace
            </Text>

            <Text className="mt-1 text-body text-app-textSecondary">
              Your student wellness companion
            </Text>
          </View>

          {/* Inputs */}
          <View className="w-full mb-5">
            {/* Name */}
            <View
              className="mb-4 h-14 flex-row items-center rounded-2xl border border-app-border bg-app-surface px-4"
            >
              <User color={studentColors.accent} size={20} />

              <TextInput
                value={name}
                onChangeText={setName}
                className="ml-3 flex-1 text-body-lg text-app-textPrimary"
                placeholder="Full Name"
                placeholderTextColor={studentColors.textSecondary}
              />
            </View>

            {/* Email */}
            <View
              className="mb-4 h-14 flex-row items-center rounded-2xl border border-app-border bg-app-surface px-4"
            >
              <Mail color={studentColors.primaryLight} size={20} />

              <TextInput
                value={email}
                onChangeText={setEmail}
                className="ml-3 flex-1 text-body-lg text-app-textPrimary"
                placeholder="student@university.edu"
                placeholderTextColor={studentColors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View
              className="h-14 flex-row items-center rounded-2xl border border-app-border bg-app-surface px-4"
            >
              <Lock color={studentColors.primaryLight} size={20} />

              <TextInput
                value={password}
                onChangeText={setPassword}
                className="ml-3 flex-1 text-body-lg text-app-textPrimary"
                placeholder="Password"
                placeholderTextColor={studentColors.textSecondary}
                secureTextEntry
              />
            </View>
          </View>

          {/* Role Selector */}
          <Text className="mb-4 self-start text-body-lg text-app-textSecondary">
            Sign up as
          </Text>

          <View className="flex-row justify-between w-full mb-8">
            {/* Student */}
            <TouchableOpacity
              onPress={() => setRole("student")}
              accessibilityRole="button"
              accessibilityState={{ selected: role === "student" }}
              className={`w-[48%] flex-row items-center justify-center rounded-2xl border py-4 ${
                role === "student"
                  ? "border-selected bg-selected"
                  : "border-app-border bg-app-surface"
              }`}
            >
              <User
                size={18}
                color={role === "student" ? commonColors.white : commonColors.controlSelected}
              />

              <Text
                className={`ml-2 text-body font-semibold ${
                  role === "student" ? "text-app-surface" : "text-app-textSecondary"
                }`}
              >
                Student
              </Text>
            </TouchableOpacity>

            {/* Counselor */}
            <TouchableOpacity
              onPress={() => setRole("counselor")}
              accessibilityRole="button"
              accessibilityState={{ selected: role === "counselor" }}
              className={`w-[48%] flex-row items-center justify-center rounded-2xl border py-4 ${
                role === "counselor"
                  ? "border-selected bg-selected"
                  : "border-app-border bg-app-surface"
              }`}
            >
              <User
                size={18}
                color={role === "counselor" ? commonColors.white : commonColors.controlSelected}
              />

              <Text
                className={`ml-2 text-body font-semibold ${
                  role === "counselor" ? "text-app-surface" : "text-app-textSecondary"
                }`}
              >
                Counselor
              </Text>
            </TouchableOpacity>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            accessibilityRole="button"
            accessibilityState={{ disabled: loading }}
            className="mb-5 h-16 w-full flex-row items-center justify-center rounded-3xl bg-app-primaryMuted"
            style={{
              shadowColor: studentColors.primaryMuted,
              shadowOpacity: 0.15,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: spacing.xxs },
              elevation: 3,
            }}
          >
            <Text className="mr-2 text-subtitle font-bold text-app-surface">
              {loading ? "Creating..." : "Create Account"}
            </Text>

            <ChevronRight color={commonColors.white} size={20} />
          </TouchableOpacity>

          {/* Login Link */}
          <Text className="text-body text-app-textSecondary">
            Already have an account?{" "}
            <Pressable
              onPress={() => router.push("/Route/login")}
              accessibilityRole="link"
              hitSlop={spacing.xs}
            >
              <Text className="text-body font-bold text-app-primaryMuted">
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
