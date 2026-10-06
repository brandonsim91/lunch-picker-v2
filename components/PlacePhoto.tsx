'use client';
import {useEffect,useState} from 'react';
type Photo={image:string|null;attributions:{name:string;uri:string|null}[]};
export default function PlacePhoto({id,name,compact=false}:{id:string;name:string;compact?:boolean}){
 const [photo,setPhoto]=useState<Photo|null>(null);const [failed,setFailed]=useState(false);
 useEffect(()=>{const controller=new AbortController();setPhoto(null);setFailed(false);fetch(`/api/places?id=${encodeURIComponent(id)}`,{signal:controller.signal,cache:'no-store'}).then(r=>r.ok?r.json():null).then(setPhoto).catch(()=>{});return()=>controller.abort();},[id]);
 if(compact && (!photo?.image || failed))return null;
 return <figure className="photo">{photo?.image && !failed?<><img src={photo.image} alt={name} onError={()=>setFailed(true)}/><figcaption>Google Maps{photo.attributions.map((a,i)=><span key={i}> · {a.uri && /^(https:\/\/|\/\/)/.test(a.uri)?<a href={a.uri.startsWith('//')?`https:${a.uri}`:a.uri} target="_blank" rel="noreferrer">{a.name}</a>:a.name}</span>)}</figcaption></>:<div className="photo-fallback" aria-label="Restaurant photo unavailable"><span lang="ko">밥</span><p className="small">Lunch is waiting.</p></div>}</figure>;
}
