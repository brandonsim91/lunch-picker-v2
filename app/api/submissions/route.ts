import {persist} from '../../../lib/storage.ts';
import {validateSubmission, submissionsUnavailable, type PendingSubmission} from '../../../lib/submissions.ts';
export async function POST(req: Request) {
 const origin = req.headers.get('origin');
 if (origin) {try {if (new URL(origin).origin !== new URL(req.url).origin) return Response.json({persisted: false, message: 'Request not allowed.'}, {status: 403});} catch {return Response.json({persisted: false, message: 'Request not allowed.'}, {status: 403});}}
 let raw: string;
 try {raw = await req.text();} catch {return Response.json({persisted: false, message: 'Please complete the form.'}, {status: 400});}
 if (raw.length > 16384) return Response.json({persisted: false, message: 'Your submission is too long.'}, {status: 413});
 let input: unknown;
 try {input = JSON.parse(raw);} catch {return Response.json({persisted: false, message: 'Please complete the form.'}, {status: 400});}
 const validated = validateSubmission(input);
 if ('error' in validated) return Response.json({persisted: false, message: validated.error}, {status: 400});
 const submission: PendingSubmission = {...validated.value, id: crypto.randomUUID(), status: 'pending', submittedAt: new Date().toISOString()};
 try {
  if (!await persist('submissions', submission)) return Response.json({persisted: false, message: submissionsUnavailable}, {status: 503});
  return Response.json({persisted: true}, {status: 201});
 } catch {return Response.json({persisted: false, message: submissionsUnavailable}, {status: 503});}
}
