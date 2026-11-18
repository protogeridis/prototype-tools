import { Pressable, StyleSheet, Text, View } from 'react-native';

import { previewColors, previewText } from './previewTheme';

type Props = {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  accessibilityLabel: string;
};

// iOS-style segmented control: a gray track with the selected segment raised in white.
export function SegmentedControl({ options, value, onChange, accessibilityLabel }: Props) {
  return (
    <View style={styles.track} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            style={({ hovered }) => [styles.segment, selected ? styles.selected : hovered && styles.hovered]}>
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Rough width of a segment label in the font below, used to decide whether options fit.
export function estimateSegmentWidth(label: string) {
  return label.length * 7.4 + SEGMENT_PADDING * 2;
}

const SEGMENT_PADDING = 10;
export const TRACK_PADDING = 3;

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: TRACK_PADDING,
    gap: 2,
    borderRadius: 12,
    backgroundColor: previewColors.track,
  },
  segment: {
    flex: 1,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SEGMENT_PADDING,
    borderRadius: 9,
  },
  hovered: {
    backgroundColor: 'rgba(14, 15, 12, 0.05)',
  },
  selected: {
    backgroundColor: previewColors.surface,
    boxShadow: '0px 1px 3px rgba(14, 15, 12, 0.12), 0px 1px 1px rgba(14, 15, 12, 0.04)',
  },
  label: {
    ...previewText.medium,
    fontSize: 13,
    lineHeight: 18,
    color: previewColors.textSecondary,
  },
  labelSelected: {
    ...previewText.semiBold,
    color: previewColors.text,
  },
});
