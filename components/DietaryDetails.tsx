import type {Restaurant} from '../lib/types';
import {verifiedDietaryEvidence} from '../lib/dietary';

export default function DietaryDetails({restaurant}:{restaurant:Restaurant}){
 const halal=verifiedDietaryEvidence(restaurant,'halal');
 const vegetarian=verifiedDietaryEvidence(restaurant,'vegetarian');
 if(!halal&&!vegetarian)return null;
 return <div className="dietary-details">
  <div className="dietary-badges">{halal&&<span>Halal-certified</span>}{vegetarian&&<span>Vegetarian options</span>}</div>
  {vegetarian&&<p className="small">Try: {vegetarian.dish}</p>}
  <details><summary>Dietary evidence</summary>
   {halal&&<p><a href={halal.sourceUrl} target="_blank" rel="noopener noreferrer">MUIS directory</a> · {halal.certificateReference}<br/>Checked {halal.verifiedAt}. {halal.validUntil?`Valid until ${halal.validUntil}.`:'Expiry not displayed by directory.'}<br/>{halal.limitations}</p>}
   {vegetarian&&<p><a href={vegetarian.sourceUrl} target="_blank" rel="noopener noreferrer">Official menu</a> · Checked {vegetarian.verifiedAt}<br/>{vegetarian.limitations}</p>}
  </details>
 </div>;
}
