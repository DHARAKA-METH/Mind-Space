import { Stack } from "expo-router";
import LoginScreen from "./features/Auth/screens/LoginScreen";
import RegisterScreen from "./features/Auth/screens/RegisterScreen";

const MainApp = () => {
  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerStyle: { backgroundColor: "#F9FAF5" },
          headerShadowVisible: false,
        }}
      />
      {/* <LoginScreen /> */}
      <RegisterScreen />
    </>
  );
};

export default MainApp;
