import { router, Stack } from "expo-router";
import { ChevronRight, Circle, Lock, Mail, User } from "lucide-react-native";
import React, { useState } from "react";
import {
    Alert,
    Pressable,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

      router.replace("/(tabs)/(mood)/moodDashboard");
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
          headerStyle: { backgroundColor: "#F9FAF5" },
          headerShadowVisible: false,
        }}
      />

      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 px-8 items-center justify-center mb-20">
          {/* Logo */}
          <View className="items-center mb-10">
            <View className="w-24 h-24 bg-primary rounded-[30px] items-center justify-center mb-4">
              <View className="w-14 h-14 bg-skyBlue rounded-2xl items-center justify-center">
                <Circle size={35} color="white" fill="rgba(255,255,255,0.3)" />
              </View>
            </View>

            <Text className="text-3xl font-bold text-black">MindSpace</Text>

            <Text className="text-gray-400 mt-1">
              Your student wellness companion
            </Text>
          </View>

          {/* Inputs */}
          <View className="w-full mb-5">
            {/* Name */}
            <View className="flex-row items-center bg-white rounded-2xl px-4 h-14 mb-4 border border-gray-200">
              <User color="#FFD4B8" size={20} />

              <TextInput
                value={name}
                onChangeText={setName}
                className="flex-1 text-base text-black ml-3"
                placeholder="Full Name"
                placeholderTextColor="#C7C7CD"
              />
            </View>

            {/* Email */}
            <View className="flex-row items-center bg-white rounded-2xl px-4 h-14 mb-4 border border-gray-200">
              <Mail color="#C2E0FF" size={20} />

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
              <Lock color="#E8D5F5" size={20} />

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
            Sign up as
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
              <User size={18} color={role === "student" ? "#000" : "#8CC14A"} />

              <Text className="ml-2 font-semibold text-gray-700">Student</Text>
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

          {/* Register Button */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            className="flex-row bg-dark w-full h-16 rounded-3xl justify-center items-center mb-5"
          >
            <Text className="text-primary text-lg font-bold mr-2">
              {loading ? "Creating..." : "Create Account"}
            </Text>

            <ChevronRight color="#C8E86A" size={20} />
          </TouchableOpacity>

          {/* Login Link */}
          <Text className="text-gray-400 text-sm">
            Already have an account?{" "}
            <Pressable onPress={() => router.push("/Route/login")}>
              <Text className="text-black font-bold">Sign In</Text>
            </Pressable>
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
};

export default RegisterScreen;
