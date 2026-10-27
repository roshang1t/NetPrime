import { type, TypeVariant, useTheme } from '@/constants/theme';
import { Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  variant?: TypeVariant;
  tone?: 'primary' | 'secondary' | 'tertiary';
};

/** All app text goes through the type ramp; screens never set fontSize directly. */
export function ThemedText({ variant = 'body', tone = 'primary', style, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const color =
    tone === 'secondary' ? theme.textSecondary : tone === 'tertiary' ? theme.textTertiary : theme.text;
  return <Text style={[type[variant], { color }, style]} {...rest} />;
}
