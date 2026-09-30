import { router } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconProps } from './icon';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { comingSoon } from '@/lib/dialogs';

const BAR_HEIGHT = 64;
const ADD_BUTTON_SIZE = 60;

/**
 * Bottom navigation: Start · Kleiderschrank · (+) · Outfit · Entdecken.
 * The center button is not a route; it opens the add menu.
 */
export function AppTabs() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      {/* No asChild here: its prop merging turns a style array into {0: …, 1: …}, which crashes on web. */}
      <TabList style={[styles.bar, { paddingBottom: insets.bottom, backgroundColor: theme.background }]}>
        <TabTrigger name="index" href="/" asChild>
          <TabButton label="Start" icon={{ ios: 'house', md: 'home' }} />
        </TabTrigger>
        <TabTrigger name="wardrobe" href="/wardrobe" asChild>
          <TabButton label="Kleiderschrank" icon={{ ios: 'cabinet', md: 'door_sliding' }} />
        </TabTrigger>

        <View style={styles.addSlot}>
          <AddButton open={menuOpen} onPress={() => setMenuOpen(true)} />
        </View>

        <TabTrigger name="outfits" href="/outfits" asChild>
          <TabButton label="Outfit" icon={{ ios: 'tshirt', md: 'checkroom' }} />
        </TabTrigger>
        <TabTrigger name="discover" href="/discover" asChild>
          <TabButton label="Entdecken" icon={{ ios: 'safari', md: 'explore' }} />
        </TabTrigger>
      </TabList>

      <AddMenu open={menuOpen} onClose={() => setMenuOpen(false)} bottomInset={insets.bottom} />
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  label: string;
  icon: Pick<IconProps, 'ios' | 'md'>;
};

function TabButton({ label, icon, isFocused, ...props }: TabButtonProps) {
  const theme = useTheme();
  const color = isFocused ? theme.text : theme.textSecondary;

  return (
    <Pressable {...props} style={styles.tab} accessibilityRole="tab" accessibilityLabel={label}>
      <Icon ios={icon.ios} md={icon.md} color={color} size={26} />
      <ThemedText type="small" numberOfLines={1} style={[styles.tabLabel, { color }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function AddButton({ open, onPress }: { open: boolean; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={open ? 'Menü schließen' : 'Hinzufügen'}
      onPress={onPress}
      style={({ pressed }) => [
        styles.addButton,
        { backgroundColor: theme.primary, borderColor: theme.background },
        pressed && styles.pressed,
      ]}>
      <Icon ios={open ? 'xmark' : 'plus'} md={open ? 'close' : 'add'} color={theme.onPrimary} size={28} />
    </Pressable>
  );
}

type MenuEntry = { label: string; icon: Pick<IconProps, 'ios' | 'md'>; onPress: () => void };

function AddMenu({
  open,
  onClose,
  bottomInset,
}: {
  open: boolean;
  onClose: () => void;
  bottomInset: number;
}) {
  const run = (action: () => void) => () => {
    onClose();
    action();
  };

  const sections: { title: string; entries: MenuEntry[] }[] = [
    {
      title: 'Artikel',
      entries: [
        { label: 'Artikel hinzufügen', icon: { ios: 'tshirt', md: 'apparel' }, onPress: () => router.push('/add-item') },
        { label: 'Zur Wunschliste hinzufügen', icon: { ios: 'heart', md: 'favorite' }, onPress: () => router.push({ pathname: '/add-item', params: { wishlist: '1' } }) },
      ],
    },
    {
      title: 'Outfit',
      entries: [
        { label: 'Zum Outfit-Buch hinzufügen', icon: { ios: 'book', md: 'menu_book' }, onPress: () => router.push('/create-outfit') },
        { label: 'Zum Kalender hinzufügen', icon: { ios: 'calendar.badge.plus', md: 'calendar_add_on' }, onPress: () => router.push('/plan-outfit') },
      ],
    },
    {
      title: 'Entdecken',
      entries: [
        { label: 'Beitrag hochladen', icon: { ios: 'plus.circle', md: 'add_circle' }, onPress: () => comingSoon('Beiträge') },
      ],
    },
  ];

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Menü schließen" />

      <View
        pointerEvents="box-none"
        style={[styles.menuWrapper, { bottom: bottomInset + BAR_HEIGHT + Spacing.three }]}>
        <ThemedView style={styles.menu}>
          {sections.map((section) => (
            <View key={section.title} style={styles.menuSection}>
              <ThemedText type="small" themeColor="textSecondary">
                {section.title}
              </ThemedText>
              {section.entries.map((entry) => (
                <MenuRow key={entry.label} entry={entry} onPress={run(entry.onPress)} />
              ))}
            </View>
          ))}
        </ThemedView>
      </View>

      <View pointerEvents="box-none" style={[styles.menuAddButton, { bottom: bottomInset }]}>
        <AddButton open onPress={onClose} />
      </View>
    </Modal>
  );
}

function MenuRow({ entry, onPress }: { entry: MenuEntry; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
      <Icon ios={entry.icon.ios} md={entry.icon.md} />
      <ThemedText>{entry.label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    flex: 1,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  tab: {
    flex: 1,
    height: BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  addSlot: {
    flex: 1,
    height: BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: ADD_BUTTON_SIZE,
    height: ADD_BUTTON_SIZE,
    borderRadius: ADD_BUTTON_SIZE / 2,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -Spacing.four,
  },
  pressed: {
    opacity: 0.7,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  menuWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  menu: {
    width: '100%',
    maxWidth: MaxContentWidth / 1.5,
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  menuSection: {
    gap: Spacing.one,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  menuAddButton: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
