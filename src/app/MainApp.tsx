import { Stack } from "expo-router";
import LoginScreen from "../features/Auth/screens/LoginScreen";
import RegisterScreen from "../features/Auth/screens/RegisterScreen";
import DashboardScreen from "../features/MoodTracking/screens/DashboardScreen";
import MoodCalendar from "../features/MoodTracking/screens/MoodCalenderScreen";
import MoodCheckInScreen from "../features/MoodTracking/screens/MoodCheckInScreen";
import BookSessionScreen from "../features/Appointments/screens/BookSessionScreen";


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
      {/* <RegisterScreen /> */}
      {/* <DashboardScreen /> */}
      {/* <MoodCalendar /> */}
      {/* <MoodCheckInScreen /> */}
      <BookSessionScreen/>
      
      
    </>
  );
};

export default MainApp;
