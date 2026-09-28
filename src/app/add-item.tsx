import { router } from 'expo-router';

import { ItemForm } from '@/components/item-form';
import { useWardrobe } from '@/store/wardrobe-store';

export default function AddItemScreen() {
  const { addItem } = useWardrobe();

  return (
    <ItemForm
      onSubmit={async (values) => {
        await addItem(values);
        router.back();
      }}
    />
  );
}
