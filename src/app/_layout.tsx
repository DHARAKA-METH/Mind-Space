import { Stack } from "expo-router";
import "../../global.css";

import { useFonts } from "expo-font";

import {
  Poppins_400Regular,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";

import { CaveatBrush_400Regular } from "@expo-google-fonts/caveat-brush";
import { commonColors, fontFamily } from "@/src/theme";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    CaveatBrush_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: commonColors.white,
        },

        // Default header font
        headerTitleStyle: {
          fontFamily: fontFamily.semiBold,
        },
      }}
    />
  );
}
