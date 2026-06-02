import { Stack } from "expo-router";
import RegisterScreen from "../features/Auth/screens/RegisterScreen";
import DashboardScreen from "../features/MoodTracking/screens/DashboardScreen";
import MoodCalendar from "../features/MoodTracking/screens/MoodCalenderScreen";
import MoodCheckInScreen from "../features/MoodTracking/screens/MoodCheckInScreen";
import BookSessionScreen from "../features/Appointments/screens/BookSessionScreen";
import Screen from "../features/Chat/screens/ChatScreen";
import Login from "./(auth)/login";




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
      <Login />

      {/* <RegisterScreen /> */}
      {/* <DashboardScreen /> */}
      {/* <MoodCalendar /> */}
      {/* <MoodCheckInScreen /> */}
      {/* <BookSessionScreen/> */}
      {/* <Screen  /> */}
      
      
    </>
  );
};

export default MainApp;
