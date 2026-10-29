import LunchApp from '../components/LunchApp';
import {restaurants} from '../lib/restaurants';
import {priceCoverageReady} from '../lib/price';
import priceResearch from '../data/prices.curated.json';

export default function Page(){
 const contributionsEnabled=process.env.ENABLE_CONTRIBUTIONS==='true';
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
 return <LunchApp restaurants={displayedRestaurants} contributionsEnabled={contributionsEnabled} priceFiltersEnabled={priceFiltersEnabled} previewPricing={previewPricing}/>;
}
