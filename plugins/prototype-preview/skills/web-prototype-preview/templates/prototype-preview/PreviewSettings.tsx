'use client';

import { useEffect, useRef, useState } from 'react';

import { estimateSegmentWidth, SegmentedControl, Select } from './controls';
import { DEV_SETTING_LIST, type DevSettingKey, type DevSettings } from './devSettings';
import styles from './preview.module.css';

const MAX_SEGMENTS = 3;
const TRACK_PADDING = 3;

// A group with a single option has nothing to choose (e.g. Language while the app only has one),
// so it isn't shown.
const groups = DEV_SETTING_LIST.filter((group) => group.options.length > 1);

// The dev settings as compact controls for the panel: a segmented control for 2–3 options when
// their labels fit, otherwise a select. The selected option's description sits underneath.
export function PreviewSettings({
  settings,
  onChange,
}: {
  settings: DevSettings;
  onChange: (key: DevSettingKey, value: string) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(() => setWidth(list.clientWidth));
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  if (groups.length === 0) {
    return <p className={styles.description}>No settings yet. Add them in prototype-preview/devSettings.ts.</p>;
  }

  return (
    <div className={styles.settings} ref={listRef}>
      {groups.map((group) => {
        const key = group.key as DevSettingKey;
        const value: string = settings[key];
        const selected = group.options.find((o) => o.value === value) ?? group.options[0];
        const segmentWidth = (width - TRACK_PADDING * 2) / group.options.length;
        const fits = group.options.every((o) => estimateSegmentWidth(o.label) <= segmentWidth);
        const segmented = group.options.length <= MAX_SEGMENTS && width > 0 && fits;

        return (
          <div key={group.key} className={styles.group}>
            <div className={styles.labelRow}>
              <span className={styles.groupTitle}>{group.title}</span>
              <span className={styles.groupCaption}>{group.caption}</span>
            </div>
            {segmented ? (
              <SegmentedControl
                label={group.title}
                options={group.options}
                value={value}
                onChange={(next) => onChange(key, next)}
              />
            ) : (
              <Select
                label={group.title}
                options={group.options}
                value={value}
                onChange={(next) => onChange(key, next)}
              />
            )}
            <p className={styles.description}>{selected.description}</p>
          </div>
        );
      })}
    </div>
  );
}
