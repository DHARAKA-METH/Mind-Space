import { Text, View } from "react-native";
import { Stack } from "expo-router";

export default function Index() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Home",
          headerStyle: { backgroundColor: "white" },
          headerTintColor: "black",
          headerTitleAlign: "center", 
        }}
      />

      <View className="flex flex-1 items-center justify-center bg-white">
        <Text className="text-xl">welcome home.</Text>
      </View>
    </>
  );
}