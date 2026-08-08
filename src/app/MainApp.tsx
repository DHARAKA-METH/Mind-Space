import { Stack } from "expo-router";

import { studentColors } from "@/src/theme";

import Login from "./(auth)/login";




const MainApp = () => {
  
  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerStyle: { backgroundColor: studentColors.background },
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
      {/* <RecommendationScreen /> */}
      
      
    </>
  );
};

export default MainApp;
