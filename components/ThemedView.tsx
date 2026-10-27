import { useTheme } from '@/constants/theme';
import { View, type ViewProps } from 'react-native';

export type ThemedViewProps = ViewProps & {
  surface?: 'background' | 'surface' | 'surfaceRaised';
};

export function ThemedView({ style, surface = 'background', ...otherProps }: ThemedViewProps) {
  const theme = useTheme();
  return <View style={[{ backgroundColor: theme[surface] }, style]} {...otherProps} />;
}
