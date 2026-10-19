export type Filter = 'Quick' | 'Cheap' | 'Healthy';
export type DistanceTier = 'near' | 'mid' | 'far';
export type LunchPreferences = {distance: DistanceTier; food: Filter[]};
export type MoodTag = 'Healthy' | 'Local / Asian' | 'Western / Cafe';
export type Mood = 'anything' | 'healthy' | 'local_asian' | 'western_cafe';
export type MoodPreferences = {distance: DistanceTier; mood: Mood};
export type Restaurant = {
  id: string; name: string; cuisine: string[]; address: string; mapUrl: string;
  area: string; walkingMinutes: number | null; priceBand: string | null;
  active: boolean; quickLunch: boolean | null; healthyOption: boolean | null;
  importedFromV1?: boolean;
  verifiedForV2: boolean; lastVerifiedAt: string | null; placeId?: string | null;
  tags: string[]; moodTags: MoodTag[]; reason: string; sourceUrl: string; lunchDays?: number[];
};
