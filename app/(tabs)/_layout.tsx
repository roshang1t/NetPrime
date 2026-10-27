import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useTheme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export const unstable_settings = {
  initialRouteName: "index",
  // Only include these as tabs
  tabs: ["index", "search", "more"],
};

type IconName = ComponentProps<typeof Ionicons>["name"];

// Filled icon when selected, outline otherwise
function tabIcon(active: IconName, inactive: IconName) {
  return function TabIcon({ color, focused }: { color: string; focused: boolean }) {
    return <Ionicons size={24} name={focused ? active : inactive} color={color} />;
  };
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  return (
    <GestureHandlerRootView>
      <StatusBar style={colorScheme === "light" ? "dark" : "light"} translucent />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.text,
          tabBarInactiveTintColor: theme.textTertiary,
          tabBarButton: HapticTab,
          headerShown: false,
          tabBarBackground: () => <TabBarBackground backgroundColor={theme.background} />,
          tabBarHideOnKeyboard: true,
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
          tabBarStyle: Platform.select({
            ios: {
              position: "absolute",
              borderTopColor: theme.separator,
            },
            default: {
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: theme.separator,
              elevation: 0,
            },
          }),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: "Home", tabBarIcon: tabIcon("home", "home-outline") }}
        />
        <Tabs.Screen
          name="search"
          options={{ title: "Search", tabBarIcon: tabIcon("search", "search-outline") }}
        />
        <Tabs.Screen
          name="more"
          options={{ title: "More", tabBarIcon: tabIcon("person-circle", "person-circle-outline") }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}
