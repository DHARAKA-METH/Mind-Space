import React, { useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Pressable,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { User, Lock, ChevronRight } from "lucide-react-native";

import { loginUser } from "../services/auth.service";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/src/config/firebase";
import { commonColors, spacing, studentColors } from "@/src/theme";

const LoginScreen = () => {
  const [role, setRole] = useState("student");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
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

      const user = await loginUser(email, password);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      const userType = userData?.userType || "student";
      console.log("-------------", userType);

      if (userType === "counselor") {
        router.replace("/(tabs)/(counselor)/CounselorDashboard");
      } else {
        router.replace("/(tabs)/(mood)/moodDashboard");
      }
    } catch (error: any) {
      let message = "Login failed";

      switch (error.code) {
        case "auth/user-not-found":
          message = "User not found";
          break;

        case "auth/wrong-password":
        case "auth/invalid-credential":
          message = "Invalid email or password";
          break;

        case "auth/invalid-email":
          message = "Invalid email address";
          break;
      }

      Alert.alert("Login Failed", message);
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
        <View className="flex-1 px-8 items-center justify-center mb-[130px]">
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

          {/* Input Fields */}
          <View className="w-full mb-5">
            {/* Email */}
            <View
              className="mb-4 h-14 flex-row items-center rounded-2xl border border-app-border bg-app-surface px-4"
            >
              <User color={studentColors.accent} size={20} />

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
            Sign in as
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

          {/* Sign In Button */}
          <TouchableOpacity
            onPress={handleLogin}
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
              {loading ? "Signing In..." : "Sign In"}
            </Text>

            <ChevronRight color={commonColors.white} size={20} />
          </TouchableOpacity>

          {/* Register Link */}
          <Text className="text-body text-app-textSecondary">
            New here?{" "}
            <Pressable
              onPress={() => router.push("/Route/register")}
              accessibilityRole="link"
              hitSlop={spacing.xs}
            >
              <Text className="text-body font-bold text-app-primaryMuted">
                Create account
              </Text>
            </Pressable>
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
};

export default LoginScreen;
