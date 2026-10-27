import { useTheme } from "@/constants/theme";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function PlayerLayout() {
  const theme = useTheme();
  // Details pages follow the theme; the player screen paints its own black
  SystemUI.setBackgroundColorAsync(theme.background);
  return (
    <GestureHandlerRootView>
      <StatusBar translucent style={"auto"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }} />
    </GestureHandlerRootView>
  );
}
