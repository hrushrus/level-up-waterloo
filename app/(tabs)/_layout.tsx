import { Tabs } from "expo-router";
import { View } from "react-native";
import { TopNavbar } from "@/components/top-navbar";

export default function TabLayout() {
  return (
    <View className="flex-1 bg-background">
      <TopNavbar />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Opportunities",
          }}
        />
        <Tabs.Screen
          name="bookmarks"
          options={{
            title: "Saved",
          }}
        />
        <Tabs.Screen
          name="suggest"
          options={{
            title: "Suggest",
          }}
        />
        <Tabs.Screen
          name="donate"
          options={{
            title: "Support",
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Account",
          }}
        />
      </Tabs>
    </View>
  );
}
