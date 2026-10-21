import LunchApp from '../components/LunchApp';
import {restaurants} from '../lib/restaurants';
export default function Page(){const contributionsEnabled=process.env.ENABLE_CONTRIBUTIONS==='true';return <LunchApp restaurants={restaurants} contributionsEnabled={contributionsEnabled}/>;}
