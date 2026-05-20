import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { MovieContextProvider } from "@/contexts/movieContext";
import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export const unstable_settings = {
  initialRouteName: "index",
  // Only include these as tabs
  tabs: ["index", "search", "more"],
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView>
      <MovieContextProvider>
        <StatusBar
          style={colorScheme === "light" ? "dark" : "light"}
          translucent
        />
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
            tabBarButton: HapticTab,
            headerShown: false,
            tabBarBackground: () => (
              <TabBarBackground
                backgroundColor={
                  colorScheme === "dark"
                    ? Colors.dark.background
                    : Colors.light.background
                }
              />
            ),
            tabBarHideOnKeyboard: true,

            tabBarStyle: Platform.select({
              ios: {
                position: "absolute",
              },
              default: {
                borderTopWidth: StyleSheet.hairlineWidth,
                // elevation: 1,
                marginTop: 0,
                // height: 10,
              },
            }),
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color }) => (
                <MaterialIcons size={28} name="home" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="search"
            options={{
              title: "search",
              tabBarIcon: ({ color }) => (
                <MaterialIcons size={28} name="search" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="more"
            options={{
              title: "More",
              tabBarIcon: ({ color }) => (
                <MaterialIcons size={28} name="menu" color={color} />
              ),
            }}
          />
        </Tabs>
      </MovieContextProvider>
    </GestureHandlerRootView>
  );
}
