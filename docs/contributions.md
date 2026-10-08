# Community restaurant suggestions

밥Lah is community-informed but human-governed.

GitHub restaurant data contains approved/live places. Upstash holds pending suggestions. Google Places provides verification/current-world data. The POST /api/submissions route never edits restaurant data and never calls Google Places.

Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in the Vercel baplah project for Production (and Preview if testing previews), then redeploy. Keep the token private. Without these settings, or on any write failure, submissions return 503 and users see an unavailable message. No contribution is saved to localStorage.

## Inspect pending submissions

Open the connected database in the Upstash console, then its Data Browser. Inspect the Redis list `baplah:submissions`; each list item is a JSON submission, newest first. The Redis command `LRANGE baplah:submissions 0 49` reads the first 50. Use additional ranges for older entries. No public read API is provided. Restrict console access to maintainers; do not share screenshots containing contributor names or free text.

Every stored submission has a server-generated UUID, submittedAt timestamp and status pending. Optional contributorName and reason are stored only when supplied; displayCredit defaults to false. Future moderation may use pending → verifying → approved/rejected, but this sprint only creates pending entries.

## Manual approval boundary

Brandon reviews the suggestion. After approval to proceed, the maintainer inspects the submitted Maps URL, confirms the correct Google Place ID, name, address and OPERATIONAL status, then creates/updates the restaurant in data/restaurants.pilot.json with verifiedForV2: true and deploys it. Only this reviewed GitHub change can add a suggestion to recommendations. Do not interpret receiving a suggestion as approval. Credit requires the contributor's explicit opt-in.

Pending records remain in shared storage until a maintainer deletes them; there is no automatic retention expiry or moderation dashboard in this sprint. Delete unwanted records through the database console using their unique ID to identify the exact list entry. Do not put contributor information into logs or analytics.
