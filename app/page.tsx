import LunchApp from '../components/LunchApp';
import {restaurants} from '../lib/restaurants';
import {priceCoverageReady} from '../lib/price';
import priceResearch from '../data/prices.curated.json';
import dietaryResearch from '../data/dietary.staging.v1.json';
import {attachDietaryEvidence,dietaryPreviewEnabled} from '../lib/dietary';
import type {DietaryVerification,Restaurant} from '../lib/types';
import stagingCatalogue from '../data/restaurants.staging.v1.json';
import {withStagingRestaurants} from '../lib/staging-restaurants';

export default function Page(){
 const dietaryFiltersEnabled=dietaryPreviewEnabled(process.env.VERCEL_ENV);
 const contributionsEnabled=!dietaryFiltersEnabled&&process.env.ENABLE_CONTRIBUTIONS==='true';
 const previewPricing=process.env.VERCEL_ENV==='preview';
 // Fail closed in production until the feature is explicitly approved and enabled.
 const productionPricing=process.env.VERCEL_ENV==='production' && process.env.ENABLE_PRICE_FILTERS==='true';
 const pricingRequested=previewPricing||productionPricing;
 const researchedPrices:Record<string,string>=priceResearch.prices;
 const candidateRestaurants=pricingRequested
  ? restaurants.map(r=>({...r,priceBand:researchedPrices[r.id]??r.priceBand}))
  : restaurants;
 const priceFiltersEnabled=pricingRequested && priceCoverageReady(candidateRestaurants);
 const displayedRestaurants=priceFiltersEnabled ? candidateRestaurants : restaurants;
 // Keep canonical price readiness stable; unpriced staging additions match Any only.
 const catalogue=withStagingRestaurants(displayedRestaurants,stagingCatalogue.restaurants as Restaurant[],process.env.VERCEL_ENV);
 const previewRestaurants=dietaryFiltersEnabled?attachDietaryEvidence(catalogue,dietaryResearch.records as DietaryVerification[]):catalogue;
 return <LunchApp restaurants={previewRestaurants} contributionsEnabled={contributionsEnabled} priceFiltersEnabled={priceFiltersEnabled} previewPricing={previewPricing} dietaryFiltersEnabled={dietaryFiltersEnabled}/>;
}
