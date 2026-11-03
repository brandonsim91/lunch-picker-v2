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
export type DietaryRequirements = {halal?: boolean; vegetarian?: boolean};
export type DietaryEvidence = {
  status: 'Verified' | 'Unknown' | 'Not Certified';
  authority: 'MUIS' | 'Official menu'; sourceUrl: string; verifiedAt: string;
  certificateReference?: string; validFrom?: string | null; validUntil?: string | null;
  currentDirectoryListing?: boolean; observedName?: string; observedAddress?: string;
  outletSourceUrl?: string; dish?: string; limitations: string;
};
export type DietaryVerification = {
  restaurantId: string; outletName: string; outletAddress: string;
  halal?: DietaryEvidence; vegetarian?: DietaryEvidence;
};
export type MoodPreferences = {distance: DistanceTier; mood: Mood; price?: PriceSelection; dietary?: DietaryRequirements};
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
  dietaryVerification?: DietaryVerification;
};
