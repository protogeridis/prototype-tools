import { previewColors } from './previewTheme';

// Small icons for the preview chrome. Plain SVG elements, since the preview only runs on web, so
// it doesn't depend on how the app imports its own icons.

type IconProps = { size?: number; color?: string };

function Icon({ size = 16, color = previewColors.text, d }: IconProps & { d: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden style={{ display: 'block' }}>
      <path d={d} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const CheckIcon = (props: IconProps) => <Icon color={previewColors.link} {...props} d="M3 8.3l3.3 3.2L13 4.8" />;
export const ChevronDownIcon = (props: IconProps) => <Icon {...props} d="M3.5 6l4.5 4.5L12.5 6" />;
export const PlusIcon = (props: IconProps) => <Icon {...props} d="M8 3v10M3 8h10" />;
export const MinusIcon = (props: IconProps) => <Icon {...props} d="M3 8h10" />;
