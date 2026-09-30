import { Pressable, StyleSheet } from 'react-native';

import { Icon, type IconProps } from './icon';
import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: Pick<IconProps, 'ios' | 'md'>;
};

/** Full-width black main action ("Speichern", "Outfit planen", …). */
export function PrimaryButton({ label, onPress, disabled, icon }: PrimaryButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.primary },
        (disabled || pressed) && styles.dimmed,
      ]}>
      {icon && <Icon ios={icon.ios} md={icon.md} size={18} color={theme.onPrimary} />}
      <ThemedText style={{ color: theme.onPrimary }}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  dimmed: {
    opacity: 0.5,
  },
});
