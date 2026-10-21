export const submissionLimits = {restaurantName: 120, mapUrl: 2048, reason: 500, contributorName: 80} as const;
export const submissionsUnavailable = 'Submissions are temporarily unavailable. Please try again later.';
export type SubmissionStatus = 'pending' | 'verifying' | 'approved' | 'rejected';
export type SubmissionInput = {restaurantName: string; mapUrl: string; reason?: string; contributorName?: string; displayCredit: boolean};
export type PendingSubmission = SubmissionInput & {id: string; status: 'pending'; submittedAt: string};
const hosts = new Set(['maps.app.goo.gl', 'maps.google.com', 'maps.google.com.sg', 'google.com', 'www.google.com', 'google.com.sg', 'www.google.com.sg', 'goo.gl']);
export function validateSubmission(value: unknown): {value: SubmissionInput} | {error: string} {
 if (!value || typeof value !== 'object' || Array.isArray(value)) return {error: 'Please complete the form.'};
 const raw = value as Record<string, unknown>;
 if (Object.keys(raw).some(key => !['restaurantName', 'mapUrl', 'reason', 'contributorName', 'displayCredit'].includes(key))) return {error: 'Unexpected submission fields.'};
 const fields: Record<string, string> = {};
 for (const [field, limit] of Object.entries(submissionLimits)) {
  const input = raw[field];
  if (input !== undefined && typeof input !== 'string') return {error: 'Please use text in the form fields.'};
  if (typeof input === 'string' && input.length > limit) return {error: 'One of your entries is too long. Please shorten it.'};
  fields[field] = typeof input === 'string' ? input.trim() : '';
 }
 if (!fields.restaurantName) return {error: 'Enter the restaurant name.'};
 if (!fields.mapUrl) return {error: 'Add a Google Maps link.'};
 let url: URL;
 try {url = new URL(fields.mapUrl);} catch {return {error: 'Enter a valid Google Maps link.'};}
 if (url.protocol !== 'https:' || url.username || url.password || url.port || !hosts.has(url.hostname)) return {error: 'Use an HTTPS Google Maps link.'};
 // Google search links and other Google products are not Maps links.
 if ((url.hostname === 'goo.gl' && !url.pathname.startsWith('/maps/')) || (['google.com', 'www.google.com', 'google.com.sg', 'www.google.com.sg'].includes(url.hostname) && !/^\/maps(?:\/|$)/.test(url.pathname))) return {error: 'Use a Google Maps link to the place.'};
 if (raw.displayCredit !== undefined && typeof raw.displayCredit !== 'boolean') return {error: 'Please check the credit preference.'};
 return {value: {restaurantName: fields.restaurantName, mapUrl: fields.mapUrl, ...(fields.reason ? {reason: fields.reason} : {}), ...(fields.contributorName ? {contributorName: fields.contributorName} : {}), displayCredit: raw.displayCredit === true}};
}
