import { radius, spacing, type, useTheme } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleProp, TextInput, View, ViewStyle } from "react-native";

/** Filled search input with leading icon and a clear button. */
export function SearchField({
  value,
  onChangeText,
  placeholder = "Search",
  autoFocus,
  style,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          height: 44,
          paddingHorizontal: spacing.md,
          borderRadius: radius.lg,
          borderCurve: "continuous",
          backgroundColor: theme.surface,
        },
        style,
      ]}
    >
      <MaterialIcons name="search" size={20} color={theme.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary}
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
        selectionColor={theme.accent}
        style={[type.body, { flex: 1, color: theme.text, paddingVertical: 0 }]}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText("")}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <MaterialIcons name="cancel" size={18} color={theme.textTertiary} />
        </Pressable>
      )}
    </View>
  );
}
