import LunchApp from '../components/LunchApp';
import {restaurants} from '../lib/restaurants';
import {priceCoverageReady} from '../lib/price';
export default function Page(){const contributionsEnabled=process.env.ENABLE_CONTRIBUTIONS==='true';const priceFiltersEnabled=process.env.ENABLE_PRICE_FILTERS==='true' && priceCoverageReady(restaurants);return <LunchApp restaurants={restaurants} contributionsEnabled={contributionsEnabled} priceFiltersEnabled={priceFiltersEnabled}/>;}
