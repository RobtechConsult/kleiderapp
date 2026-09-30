import { router, Stack, useLocalSearchParams } from 'expo-router';

import { ItemForm } from '@/components/item-form';
import { useWardrobe } from '@/store/wardrobe-store';

/** Adds a wardrobe item, or a wish-list item with ?wishlist=1. */
export default function AddItemScreen() {
  const { wishlist } = useLocalSearchParams<{ wishlist?: string }>();
  const toWishlist = wishlist === '1';
  const { addItem } = useWardrobe();

  return (
    <>
      {toWishlist && <Stack.Screen options={{ title: 'Zur Wunschliste' }} />}
      <ItemForm
        wishlist={toWishlist}
        onSubmit={async (values) => {
          await addItem({ ...values, wishlist: toWishlist || undefined });
          router.back();
        }}
      />
    </>
  );
}
