import LunchApp from '../components/LunchApp';
import {restaurants} from '../lib/restaurants';
import {priceCoverageReady} from '../lib/price';
import priceResearch from '../data/prices.staging.json';

export default function Page(){
 const contributionsEnabled=process.env.ENABLE_CONTRIBUTIONS==='true';
 // Only the Vercel Preview environment uses the research snapshot; production never does.
 const previewPricing=process.env.VERCEL_ENV==='preview';
 const previewPrices: Record<string,string>=priceResearch.prices;
 const displayedRestaurants=previewPricing
   ? restaurants.map(r=>({...r,priceBand:previewPrices[r.id]??r.priceBand}))
   : restaurants;
 // Production still requires both an explicit release flag and complete catalogue coverage.
 const priceFiltersEnabled=previewPricing || (process.env.ENABLE_PRICE_FILTERS==='true' && priceCoverageReady(displayedRestaurants));
 return <LunchApp restaurants={displayedRestaurants} contributionsEnabled={contributionsEnabled} priceFiltersEnabled={priceFiltersEnabled} previewPricing={previewPricing}/>;
}
