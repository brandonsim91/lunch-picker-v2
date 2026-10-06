'use client';
import {useEffect, useRef, useState, type FormEvent} from 'react';
import {track} from '../lib/analytics';
import {submissionLimits, submissionsUnavailable, validateSubmission} from '../lib/submissions';
export default function ContributionForm({onBack}: {onBack: () => void}) {
 const [sending, setSending] = useState(false);
 const [success, setSuccess] = useState(false);
 const [error, setError] = useState('');
 const heading = useRef<HTMLHeadingElement>(null);
 const inFlight = useRef(false);
 useEffect(() => {heading.current?.focus();}, [success]);
 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (inFlight.current) return;
  const form = new FormData(event.currentTarget);
  const validated = validateSubmission({restaurantName: form.get('restaurantName'), mapUrl: form.get('mapUrl'), reason: form.get('reason'), contributorName: form.get('contributorName'), displayCredit: form.get('displayCredit') === 'on'});
  if ('error' in validated) {setError(validated.error); return;}
  inFlight.current = true; setSending(true); setError('');
  try {
   const response = await fetch('/api/submissions', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(validated.value), signal: AbortSignal.timeout(10000)});
   const result = await response.json();
   if (!response.ok || result.persisted !== true) {setError(response.status === 400 || response.status === 413 ? result.message || 'Please check your entries.' : submissionsUnavailable); return;}
   track('contribution_submitted'); setSuccess(true);
  } catch {setError(submissionsUnavailable);}
  finally {inFlight.current = false; setSending(false);}
 }
 if (success) return <><h1 ref={heading} tabIndex={-1}>Thanks — we’ll check it out.</h1><p className="muted" role="status">New places are verified before they appear in 밥Lah.</p><button className="action primary" onClick={onBack}>Back to lunch</button></>;
 return <><h1 ref={heading} tabIndex={-1}>Know somewhere good?</h1><p className="muted">Share a lunch spot and we’ll check it before adding it to 밥Lah.</p>
 <form className="contribution-form" onSubmit={submit} aria-busy={sending}>
  <label htmlFor="restaurantName">Restaurant name <span className="muted small">(required)</span><input id="restaurantName" name="restaurantName" required maxLength={submissionLimits.restaurantName} placeholder="OGOG 오곡" autoComplete="off"/></label>
  <label htmlFor="mapUrl">Google Maps link <span className="muted small">(required)</span><input id="mapUrl" name="mapUrl" type="url" required maxLength={submissionLimits.mapUrl} placeholder="https://maps.app.goo.gl/..." inputMode="url" autoCapitalize="none" spellCheck={false} autoComplete="off" aria-describedby="maps-help"/></label>
  <p id="maps-help" className="muted small">Paste the place’s Google Maps link, including a short share link.</p>
  <label htmlFor="reason">Why should we try it? <span className="muted small">(optional)</span><textarea id="reason" name="reason" maxLength={submissionLimits.reason} rows={3} placeholder="Fast Korean lunch and the portions are good."/></label>
  <label htmlFor="contributorName">Your name <span className="muted small">(optional)</span><input id="contributorName" name="contributorName" maxLength={submissionLimits.contributorName} placeholder="Chloe" autoComplete="name"/></label>
  <label className="credit-option"><input type="checkbox" name="displayCredit"/> <span>Credit me if this place gets added</span></label>
  <p className="muted small">Your suggestion goes to the pilot maintainer for review. Adding your name is optional. <a href="/privacy">Privacy</a></p>
  {error&&<p className="submission-error" role="alert">{error}</p>}
  <button className="action primary" type="submit" disabled={sending}>{sending?'Sending…':'Submit place'}</button>
 </form></>;
}
