'use client';

import styles from './preview.module.css';

// Controls for the preview's chrome.

// Segmented control: a gray track with the selected option raised in white.
export function SegmentedControl({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div className={styles.segmented} role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className={styles.segment}
          onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Rough width of a segment label, used to decide whether options fit a segmented control.
export function estimateSegmentWidth(label: string) {
  return label.length * 7.4 + 20;
}

// Native select, styled: 'field' fills its row; 'pill' is the compact toolbar picker.
export function Select({
  options,
  value,
  onChange,
  label,
  variant = 'field',
}: {
  options: readonly { value: string; title: string }[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  variant?: 'field' | 'pill';
}) {
  return (
    <select
      aria-label={label}
      className={variant === 'pill' ? `${styles.select} ${styles.pill}` : styles.select}
      value={value}
      onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.title}
        </option>
      ))}
    </select>
  );
}

export function TextButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className={styles.textButton} onClick={onClick}>
      {label}
    </button>
  );
}
