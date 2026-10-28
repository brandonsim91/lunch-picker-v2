export type Filter = 'Quick' | 'Cheap' | 'Healthy';
export type DistanceTier = 'near' | 'mid' | 'far';
export type PriceTier = '$' | '$$' | '$$$';
export type PriceSelection = 'any' | PriceTier;
export type DistanceVerification = {
  origin: 'mbc-block-30'; source: 'Google Maps walking directions'; verifiedAt: string;
  sourceUrl: string; destination: string; endpoint: 'outlet' | 'building-entrance'; notes: string;
};
export type LunchPreferences = {distance: DistanceTier; food: Filter[]};
export type MoodTag = 'Healthy' | 'Local / Asian' | 'Western / Cafe';
export type Mood = 'anything' | 'healthy' | 'local_asian' | 'western_cafe';
export type MoodPreferences = {distance: DistanceTier; mood: Mood; price?: PriceSelection};
export type Restaurant = {
  id: string; name: string; cuisine: string[]; address: string; mapUrl: string;
  area: string; walkingMinutes: number | null; distanceTier: DistanceTier | null;
  walkingDistanceMetres?: number | null; distanceVerification?: DistanceVerification | null;
  priceBand: string | null;
  active: boolean; quickLunch: boolean | null; healthyOption: boolean | null;
  importedFromV1?: boolean;
  verifiedForV2: boolean; lastVerifiedAt: string | null; placeId?: string | null;
  photoBusinessStatusOverride?: 'verified-operational'; preferredPhotoIndex?: number;
  tags: string[]; moodTags: MoodTag[]; reason: string; sourceUrl: string; lunchDays?: number[];
};
