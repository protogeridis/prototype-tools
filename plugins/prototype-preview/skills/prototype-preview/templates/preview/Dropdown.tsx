import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CheckIcon, ChevronDownIcon } from './icons';
import { previewColors, previewText } from './previewTheme';

export type DropdownOption = { value: string; title: string; detail?: string };

type Props = {
  options: readonly DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  accessibilityLabel: string;
  // 'pill' for the compact device picker; 'field' for a full-width select in a form.
  variant?: 'pill' | 'field';
  // Where a pill's menu lines up: centred under it, or from its left edge (e.g. at the left of
  // the window, where a centred menu would run off it).
  menuAlign?: 'center' | 'start';
};

// Select menu for the web preview. Opens below its trigger and closes on selection, a click
// outside or Escape.
export function Dropdown({
  options,
  value,
  onChange,
  accessibilityLabel,
  variant = 'field',
  menuAlign = 'center',
}: Props) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value) ?? options[0];
  const pill = variant === 'pill';

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <View
      style={[
        styles.container,
        pill && styles.containerPill,
        pill && menuAlign === 'start' && styles.containerStart,
        open && styles.containerOpen,
      ]}>
      {open && <Pressable style={styles.dismiss} accessibilityLabel="Close menu" onPress={() => setOpen(false)} />}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel}: ${current.title}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((o) => !o)}
        style={({ pressed, hovered }) => [
          pill ? styles.pill : styles.field,
          (pressed || hovered) && styles.triggerHover,
        ]}>
        <Text style={[styles.triggerLabel, !pill && styles.triggerLabelField]} numberOfLines={1}>
          {current.title}
        </Text>
        <View style={open && styles.chevronOpen}>
          <ChevronDownIcon />
        </View>
      </Pressable>
      {open && (
        <View style={[styles.menu, pill ? styles.menuPill : styles.menuField]} accessibilityRole="menu">
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="menuitem"
                accessibilityState={{ selected }}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={({ pressed, hovered }) => [styles.item, (pressed || hovered) && styles.itemHover]}>
                <View style={styles.itemTexts}>
                  <Text style={styles.itemTitle}>{option.title}</Text>
                  {option.detail && <Text style={styles.itemDetail}>{option.detail}</Text>}
                </View>
                <View style={styles.check}>{selected && <CheckIcon />}</View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  containerPill: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  containerStart: {
    alignItems: 'flex-start',
  },
  // Lifts the open menu above whatever follows it on the page.
  containerOpen: {
    zIndex: 10,
  },
  // Full-page catcher for clicks outside the open menu.
  dismiss: {
    position: 'fixed' as 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    cursor: 'default',
  },
  pill: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 18,
    paddingRight: 14,
    borderRadius: 100,
    backgroundColor: previewColors.surface,
    boxShadow: '0px 1px 2px rgba(14, 15, 12, 0.08), inset 0px 0px 0px 1px rgba(14, 15, 12, 0.12)',
  },
  field: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: previewColors.surface,
    boxShadow: 'inset 0px 0px 0px 1px rgba(14, 15, 12, 0.16)',
  },
  triggerHover: {
    backgroundColor: previewColors.hover,
  },
  triggerLabel: {
    ...previewText.bodyBold,
    color: previewColors.text,
  },
  triggerLabelField: {
    flex: 1,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  menu: {
    position: 'absolute',
    top: 46,
    padding: 6,
    borderRadius: 16,
    backgroundColor: previewColors.surface,
    boxShadow: '0px 12px 32px rgba(14, 15, 12, 0.18), inset 0px 0px 0px 1px rgba(14, 15, 12, 0.08)',
  },
  menuPill: {
    width: 240,
  },
  menuField: {
    left: 0,
    right: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  itemHover: {
    backgroundColor: previewColors.hover,
  },
  itemTexts: {
    flex: 1,
  },
  itemTitle: {
    ...previewText.bodyBold,
    color: previewColors.text,
  },
  itemDetail: {
    ...previewText.body,
    fontSize: 12,
    lineHeight: 18,
    color: previewColors.textTertiary,
  },
  check: {
    width: 16,
    height: 16,
  },
});
