import {GoogleAuth} from 'google-auth-library';
import type {PendingSubmission} from './submissions.ts';

const scope = 'https://www.googleapis.com/auth/spreadsheets';

function config() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  const tabName = process.env.GOOGLE_SHEETS_TAB_NAME?.trim() || 'Community Submissions';
  if (!spreadsheetId || !clientEmail || !privateKey) return null;
  return {spreadsheetId, clientEmail, privateKey, tabName};
}

export function communitySubmissionRow(submission: PendingSubmission) {
  return [
    submission.id,
    submission.submittedAt,
    submission.restaurantName,
    submission.mapUrl,
    submission.reason ?? '',
    submission.contributorName ?? '',
    submission.displayCredit ? 'Yes' : 'No',
    'Pending',
    '',
    '',
    '',
    ''
  ];
}

export async function persistCommunitySubmission(submission: PendingSubmission) {
  const cfg = config();
  if (!cfg) return false;

  const auth = new GoogleAuth({
    credentials: {client_email: cfg.clientEmail, private_key: cfg.privateKey},
    scopes: [scope]
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error('Google Sheets authentication failed');

  const range = encodeURIComponent(`${cfg.tabName}!A:L`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(cfg.spreadsheetId)}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {Authorization: `Bearer ${token.token}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({values: [communitySubmissionRow(submission)]}),
    signal: AbortSignal.timeout(7000),
    cache: 'no-store'
  });

  if (!response.ok) throw new Error('Google Sheets write failed');
  const body = await response.json() as {updates?: {updatedRows?: number}};
  if (!body.updates?.updatedRows) throw new Error('Google Sheets write failed');
  return true;
}
