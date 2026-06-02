import React, { useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import {
  User,
  Lock,
  ChevronRight,
  Circle,
} from "lucide-react-native";

import { loginUser } from "../services/auth.service";

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

      await loginUser(email, password);

      router.replace("/(tabs)/(mood)/moodDashboard");
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
          headerStyle: { backgroundColor: "#F9FAF5" },
          headerShadowVisible: false,
        }}
      />

      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 px-8 items-center justify-center mb-[130px]">

          {/* Logo */}
          <View className="items-center mb-10">
            <View className="w-24 h-24 bg-primary rounded-[30px] items-center justify-center mb-4">
              <View className="w-14 h-14 bg-skyBlue rounded-2xl items-center justify-center">
                <Circle
                  size={35}
                  color="white"
                  fill="rgba(255,255,255,0.3)"
                />
              </View>
            </View>

            <Text className="text-3xl font-bold text-black">
              MindSpace
            </Text>

            <Text className="text-gray-400 mt-1">
              Your student wellness companion
            </Text>
          </View>

          {/* Input Fields */}
          <View className="w-full mb-5">

            {/* Email */}
            <View className="flex-row items-center bg-white rounded-2xl px-4 h-14 mb-4 border border-gray-200">
              <User color="#FFD4B8" size={20} />

              <TextInput
                value={email}
                onChangeText={setEmail}
                className="flex-1 text-base text-black ml-3"
                placeholder="student@university.edu"
                placeholderTextColor="#C7C7CD"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View className="flex-row items-center bg-white rounded-2xl px-4 h-14 border border-gray-200">
              <Lock color="#C2E0FF" size={20} />

              <TextInput
                value={password}
                onChangeText={setPassword}
                className="flex-1 text-base text-black ml-3"
                placeholder="Password"
                placeholderTextColor="#C7C7CD"
                secureTextEntry
              />
            </View>
          </View>

          {/* Role Selector */}
          <Text className="self-start text-gray-500 mb-4 text-base">
            Sign in as
          </Text>

          <View className="flex-row justify-between w-full mb-8">

            {/* Student */}
            <TouchableOpacity
              onPress={() => setRole("student")}
              className={`flex-row items-center justify-center py-4 rounded-2xl w-[48%] ${
                role === "student"
                  ? "bg-primary"
                  : "bg-white border border-gray-200"
              }`}
            >
              <User
                size={18}
                color={role === "student" ? "#000" : "#8CC14A"}
              />

              <Text className="ml-2 font-semibold text-gray-700">
                Student
              </Text>
            </TouchableOpacity>

            {/* Counselor */}
            <TouchableOpacity
              onPress={() => setRole("counselor")}
              className={`flex-row items-center justify-center py-4 rounded-2xl w-[48%] ${
                role === "counselor"
                  ? "bg-primary"
                  : "bg-white border border-gray-200"
              }`}
            >
              <User size={18} color="#8CC14A" />

              <Text className="ml-2 font-semibold text-gray-700">
                Counselor
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="flex-row bg-dark w-full h-16 rounded-3xl justify-center items-center mb-5"
          >
            <Text className="text-primary text-lg font-bold mr-2">
              {loading ? "Signing In..." : "Sign In"}
            </Text>

            <ChevronRight color="#C8E86A" size={20} />
          </TouchableOpacity>

          {/* Register Link */}
          <Text className="text-gray-400 text-sm">
            New here?{" "}
            <Pressable
              onPress={() => router.push("/Route/register")}
            >
              <Text className="text-black font-bold">
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