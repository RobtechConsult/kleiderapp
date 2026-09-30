import { router, useLocalSearchParams } from 'expo-router';

import { ItemForm } from '@/components/item-form';
import { ThemedText } from '@/components/themed-text';
import { useWardrobe } from '@/store/wardrobe-store';

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getItem, updateItem } = useWardrobe();
  const item = getItem(id);

  if (!item) return <ThemedText themeColor="textSecondary">Artikel nicht gefunden.</ThemedText>;

  return (
    <ItemForm
      initial={item}
      wishlist={item.wishlist}
      onSubmit={async (values) => {
        await updateItem(item.id, values);
        router.back();
      }}
    />
  );
}
