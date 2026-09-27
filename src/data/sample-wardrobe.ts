import type { ClothingItem, Outfit } from '@/types/wardrobe';

const now = new Date().toISOString();

/** Demo data until photo capture and persistence are implemented. */
export const sampleItems: ClothingItem[] = [
  { id: 'i1', name: 'Hellblaue Bluse', category: 'tops', color: '#A9C6E8', seasons: ['spring', 'summer'], wearCount: 4, createdAt: now },
  { id: 'i2', name: 'Grüne Schluppenbluse', category: 'tops', color: '#2E8B57', seasons: ['spring', 'autumn'], wearCount: 2, createdAt: now },
  { id: 'i3', name: 'Schwarzer Crop-Pullover', category: 'tops', color: '#1C1C1E', seasons: ['autumn', 'winter'], wearCount: 7, createdAt: now },
  { id: 'i4', name: 'Weite schwarze Hose', category: 'bottoms', color: '#111111', seasons: ['autumn', 'winter', 'spring'], wearCount: 9, createdAt: now },
  { id: 'i5', name: 'Jeans-Midirock', category: 'bottoms', color: '#5B7FA6', seasons: ['spring', 'summer'], wearCount: 3, createdAt: now },
  { id: 'i6', name: 'Lederjacke mit Teddyfutter', category: 'outerwear', color: '#2B2B2B', seasons: ['winter'], favorite: true, wearCount: 11, createdAt: now },
  { id: 'i7', name: 'Trenchcoat', category: 'outerwear', color: '#A67B5B', seasons: ['autumn', 'spring'], wearCount: 5, createdAt: now },
  { id: 'i8', name: 'Chelsea Boots creme', category: 'shoes', color: '#E8DCC8', seasons: ['autumn', 'winter'], wearCount: 6, createdAt: now },
  { id: 'i9', name: 'Sandalen', category: 'shoes', color: '#6B4F3A', seasons: ['summer'], wearCount: 1, createdAt: now },
  { id: 'i10', name: 'Schwarze Hobo-Bag', category: 'bags', color: '#0E0E0E', seasons: ['spring', 'summer', 'autumn', 'winter'], favorite: true, wearCount: 14, createdAt: now },
];

export const sampleOutfits: Outfit[] = [
  { id: 'o1', name: 'Lässiger Winter-Look', itemIds: ['i3', 'i4', 'i6', 'i8'], createdAt: now },
  { id: 'o2', name: 'Frühling im Büro', itemIds: ['i1', 'i5', 'i10'], createdAt: now },
];
