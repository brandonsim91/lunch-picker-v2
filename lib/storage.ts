export async function persist(kind: 'feedback'|'events'|'submissions', value: unknown) {
  const url=process.env.UPSTASH_REDIS_REST_URL, token=process.env.UPSTASH_REDIS_REST_TOKEN;
  if(!url || !token)return false;
  const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(['LPUSH',`baplah:${kind}`,JSON.stringify(value)]),signal:AbortSignal.timeout(5000),cache:'no-store'});
  if(!response.ok)throw new Error('Storage unavailable');
  const body=await response.json();if(body.error || !Number.isInteger(body.result) || body.result < 1)throw new Error('Storage unavailable');
  return true;
}
