import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Names = Exclude<SymbolViewProps['name'], string>;

export type IconProps = {
  /** SF Symbol name (iOS). */
  ios: NonNullable<Names['ios']>;
  /** Material Symbol name (Android and web). */
  md: NonNullable<Names['android']>;
  size?: number;
  color?: ColorValue;
};

/** Platform icon: SF Symbols on iOS, Material Symbols elsewhere. */
export function Icon({ ios, md, size = 24, color }: IconProps) {
  const theme = useTheme();
  return (
    <SymbolView
      name={{ ios, android: md, web: md }}
      size={size}
      tintColor={color ?? theme.text}
      weight="regular"
    />
  );
}
