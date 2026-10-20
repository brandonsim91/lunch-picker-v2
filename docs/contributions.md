# Community restaurant suggestions

밥Lah is community-informed but human-governed.

GitHub restaurant data contains approved/live places. The private Google Sheet's **Community Submissions** tab holds pending suggestions. Google Places provides verification/current-world data. The POST /api/submissions route never edits restaurant data and never calls Google Places.

## Production configuration

Enable Google Sheets API in the existing Cloud project. Create a dedicated service account without project-wide roles or domain-wide delegation. Share only the required private spreadsheet with its email as Editor; do not enable public editing. Google Sheets access applies to the workbook, not just one tab. The maintainer's Drive connector is separate from deployed server authentication.

Configure these Vercel **Production** variables, then redeploy:

- `GOOGLE_SHEETS_SPREADSHEET_ID`: pilot workbook ID
- `GOOGLE_SHEETS_TAB_NAME`: `Community Submissions` (also the default)
- `GOOGLE_SHEETS_CLIENT_EMAIL`: dedicated service-account email
- `GOOGLE_SHEETS_PRIVATE_KEY`: private key, stored as Secret

Enter credentials directly in Vercel's secure settings or through secure file input. Never paste them into chat, GitHub, the Sheet or logs. Never use a `NEXT_PUBLIC_` prefix. Actual newlines and escaped `\n` are supported in the private key. Feedback and analytics storage are separate and unchanged.

## Write and success contract

Frontend → `POST /api/submissions` → same-origin and payload validation → server-generated UUID and timestamp → Google Sheets append → Pending review.

The form shows “Thanks — we’ll check it out.” only after HTTP 201 with `persisted: true`. Missing configuration, authentication failure or write failure returns 503 and the generic unavailable message. Form contents remain in place. No contribution is saved to localStorage. Success analytics fires only after acknowledged persistence. A synchronous in-flight ref plus disabled button prevents repeated clicks while sending.

One append request writes one row to the quoted tab's A:L range, using `valueInputOption=RAW` and `insertDataOption=INSERT_ROWS`. User text beginning with `=`, `+`, `-` or `@` stays literal text. Success requires Google to acknowledge exactly one updated row. Auth requests have a 4-second timeout with retries disabled; append has a 7-second timeout. The frontend waits up to 15 seconds for the complete response.

| Column | Value |
| --- | --- |
| A | Generated submission UUID |
| B | Generated ISO 8601 timestamp (UTC, includes `Z`) |
| C | Restaurant name |
| D | Validated HTTPS Google Maps link |
| E | Optional reason, otherwise blank |
| F | Optional contributor name, otherwise blank |
| G | Credit permission: `Yes` or `No`, default `No` |
| H | Always `Pending` |
| I:L | Blank: verification notes, Place ID, reviewed at, published at |

The workbook timezone is Singapore. RAW stores the ISO timestamp as unambiguous text; the `Z` suffix means UTC.

## Inspect pending submissions

Open the private spreadsheet in Google Sheets and inspect **Community Submissions**. No public read API is provided. Restrict workbook access to maintainers and the dedicated service account; do not share screenshots containing contributor names or free text.

Every stored submission has a server-generated UUID, submittedAt timestamp and status pending. Optional contributorName and reason are stored only when supplied; displayCredit defaults to false. Future moderation may use pending → verifying → approved/rejected, but this sprint only creates pending entries.

## Manual approval boundary

Pending → Verifying → Approved or Rejected → verify restaurant data → add/update Places and the GitHub production dataset → deploy → mark Published.

Brandon reviews the suggestion. Before publication, confirm the correct outlet, name, address, Google Place ID, OPERATIONAL status and absence of a duplicate live listing. Then create/update data/restaurants.pilot.json with verifiedForV2: true and deploy it. Only this reviewed GitHub change can add a suggestion to recommendations. Changing a Sheet status alone never publishes it. Credit requires explicit opt-in.

Pending records remain until a maintainer deletes them; there is no automatic retention expiry or moderation dashboard in this sprint. Delete unwanted rows using their unique submission ID. Do not log contributor text, Maps URLs, private keys, access tokens or Google API error bodies.

## Production QA and limitations

Submit one clearly marked test through the actual UI. Verify exactly one row, UUID/time, A:L mapping, `No` credit, `Pending` status and blank I:L; remove only that test row afterward. Verify an invalid/non-Maps URL creates no row or success event. Never break production credentials to test failure.

A timeout after Google commits an append can leave an uncertain response. There is no automatic append retry. Inspect the Sheet before retrying manually. The in-flight guard prevents simultaneous clicks, not retries across page reloads or uncertain responses. Duplicate restaurant review remains human-controlled.
