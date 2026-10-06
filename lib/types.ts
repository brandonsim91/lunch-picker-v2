export type Filter = 'Nearby' | 'Quick' | 'Cheap' | 'Healthy';
export type Restaurant = {
  id: string; name: string; cuisine: string[]; address: string; mapUrl: string;
  area: string; walkingMinutes: number | null; priceBand: string | null;
  active: boolean; quickLunch: boolean | null; healthyOption: boolean | null;
  verifiedForV2: boolean; lastVerifiedAt: string | null; placeId?: string | null;
  tags: string[]; reason: string; sourceUrl: string; lunchDays?: number[];
};
