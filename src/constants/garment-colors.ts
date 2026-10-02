/** Colours offered when adding an item, with names for labels and statistics. */
export const GarmentColors = [
  { hex: '#1C1C1E', name: 'Schwarz' },
  { hex: '#FFFFFF', name: 'Weiß' },
  { hex: '#8E8E93', name: 'Grau' },
  { hex: '#1F2A44', name: 'Navy' },
  { hex: '#5B7FA6', name: 'Jeansblau' },
  { hex: '#2E8B57', name: 'Grün' },
  { hex: '#A67B5B', name: 'Braun' },
  { hex: '#E8DCC8', name: 'Beige' },
  { hex: '#C0392B', name: 'Rot' },
  { hex: '#F4A7B9', name: 'Rosa' },
] as const;

export function colorName(hex: string) {
  return GarmentColors.find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.name ?? hex;
}
