import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DEV_SETTING_GROUPS, type DevSettingGroup, type DevSettingKey, type DevSettings } from './devSettings';
import { Dropdown } from './Dropdown';
import { previewColors, previewText } from './previewTheme';
import { estimateSegmentWidth, SegmentedControl, TRACK_PADDING } from './SegmentedControl';

type Props = {
  settings: DevSettings;
  onChange: (key: DevSettingKey, value: string) => void;
};

const MAX_SEGMENTS = 3;

// A group with a single option has nothing to choose (e.g. Language while the app only has one),
// so it isn't shown.
const groups = (DEV_SETTING_GROUPS as readonly DevSettingGroup[]).filter((group) => group.options.length > 1);

// The dev settings as compact controls for the web preview's panel: a segmented control for 2–3
// options when their labels fit the panel's width, otherwise a dropdown. The selected option's
// description sits underneath.
export function PreviewSettings({ settings, onChange }: Props) {
  const [width, setWidth] = useState(0);

  if (groups.length === 0) {
    return <Text style={styles.description}>No settings yet. Add them in preview/devSettings.ts.</Text>;
  }

  return (
    <View style={styles.list} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {groups.map((group, index) => {
        const key = group.key as DevSettingKey;
        const value: string = settings[key];
        const selected = group.options.find((o) => o.value === value) ?? group.options[0];
        const segmentWidth = (width - TRACK_PADDING * 2) / group.options.length;
        const fits = group.options.every((o) => estimateSegmentWidth(o.label) <= segmentWidth);
        const segmented = group.options.length <= MAX_SEGMENTS && width > 0 && fits;

        return (
          // Earlier groups stack above later ones, so an open dropdown covers the groups below it.
          <View key={group.key} style={[styles.group, { zIndex: groups.length - index }]}>
            <View style={styles.labelRow}>
              <Text style={styles.title}>{group.title}</Text>
              <Text style={styles.caption}>{group.caption}</Text>
            </View>
            {segmented ? (
              <SegmentedControl
                accessibilityLabel={group.title}
                options={group.options}
                value={value}
                onChange={(next) => onChange(key, next)}
              />
            ) : (
              <Dropdown
                accessibilityLabel={group.title}
                options={group.options.map((o) => ({ value: o.value, title: o.title }))}
                value={value}
                onChange={(next) => onChange(key, next)}
              />
            )}
            <Text style={styles.description}>{selected.description}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 24,
  },
  group: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: {
    ...previewText.bodyBold,
    color: previewColors.text,
  },
  caption: {
    ...previewText.body,
    fontSize: 12,
    color: previewColors.textTertiary,
  },
  description: {
    ...previewText.body,
    fontSize: 13,
    lineHeight: 19,
    color: previewColors.textSecondary,
  },
});
