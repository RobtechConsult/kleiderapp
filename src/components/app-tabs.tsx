import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Stylist</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'sparkles', selected: 'sparkles' }} md="auto_awesome" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="wardrobe">
        <NativeTabs.Trigger.Label>Kleiderschrank</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'tshirt', selected: 'tshirt.fill' }} md="checkroom" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="outfits">
        <NativeTabs.Trigger.Label>Outfits</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'rectangle.stack', selected: 'rectangle.stack.fill' }}
          md="style"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
