import { Pressable, StyleSheet, Text } from 'react-native';

import { previewColors, previewText } from './previewTheme';

// Underlined text action for the preview's side panel.
export function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed, hovered }) => [styles.button, hovered && styles.hovered, pressed && styles.pressed]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  hovered: {
    backgroundColor: previewColors.hover,
  },
  pressed: {
    opacity: 0.6,
  },
  label: {
    ...previewText.bodyBold,
    color: previewColors.link,
    textDecorationLine: 'underline',
  },
});
