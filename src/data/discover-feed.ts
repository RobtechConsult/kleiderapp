import type { Category } from '@/types/wardrobe';

export type FeedPiece = { category: Category; color: string };

export type FeedPost = {
  id: string;
  author: string;
  pieces: FeedPiece[];
};

/** Demo community feed until there is a backend with real posts. */
export const discoverFeed: FeedPost[] = [
  {
    id: 'p1',
    author: 'lina',
    pieces: [
      { category: 'tops', color: '#F2F2F2' },
      { category: 'outerwear', color: '#1F2A44' },
      { category: 'bottoms', color: '#6F8FB8' },
      { category: 'bags', color: '#2B2B2B' },
      { category: 'shoes', color: '#111111' },
      { category: 'accessories', color: '#3A3A3A' },
    ],
  },
  {
    id: 'p2',
    author: 'mara',
    pieces: [
      { category: 'tops', color: '#EDEDED' },
      { category: 'bottoms', color: '#5B7FA6' },
      { category: 'shoes', color: '#FAFAFA' },
    ],
  },
  {
    id: 'p3',
    author: 'jo',
    pieces: [
      { category: 'tops', color: '#F4F1EA' },
      { category: 'outerwear', color: '#1C1C1C' },
      { category: 'bottoms', color: '#2A2A2A' },
    ],
  },
  {
    id: 'p4',
    author: 'sam',
    pieces: [
      { category: 'dresses', color: '#A67B5B' },
      { category: 'shoes', color: '#E8DCC8' },
      { category: 'bags', color: '#6B4F3A' },
    ],
  },
  {
    id: 'p5',
    author: 'kim',
    pieces: [
      { category: 'tops', color: '#2E8B57' },
      { category: 'bottoms', color: '#E8E4DA' },
      { category: 'shoes', color: '#3B2F2F' },
      { category: 'accessories', color: '#C9A227' },
    ],
  },
  {
    id: 'p6',
    author: 'ali',
    pieces: [
      { category: 'outerwear', color: '#A9C6E8' },
      { category: 'bottoms', color: '#1C1C1E' },
    ],
  },
];
