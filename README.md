# 밥Lah MVP v0.1

Mobile-first lunch decisions around Mapletree Business City. Next.js App Router + TypeScript, plain CSS, repository pilot overlay and pure recommendation functions. No accounts, LLM or CMS.

## Run

Node 22.18+ (Vercel uses 24). `npm install`, `npm run dev`. Checks: `npm test`, `npm run typecheck`, `npm run build`.

## Flow

Home → filters → Show me 3 / Just pick something → result → Google Maps → optional post-meal feedback. Maps handoff stores a seven-day reminder; on return or refresh, Home offers feedback. No timed splash.

## Data

`data/restaurants.seed.json` is retained unchanged as historical data. Only records explicitly admitted by `data/restaurants.pilot.json` are used. Five seed overlays plus Harry’s MBC make six locations checked against current operator/mall listings on 2026-10-06. Addresses and menus were checked online, not on foot. See [pilot verification](docs/PILOT_VERIFICATION.md).

Nearby = MBC or ARC, based on verified area context. Unknown walking times are not displayed. Quick / Cheap are disabled until suitable fields are verified. Healthy is available for Grains & Co’s grain/vegetable/protein menu; not a nutritional guarantee. If fewer than three qualify, the app offers a single pick or changed filters, never hidden relaxation.

## Environment

All variables are server-only. No variables are necessary for the core loop.

- `GOOGLE_MAPS_API_KEY`: Places API (New), billing enabled, API restrictions. Optional until imagery activation.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: both required for durable shared feedback and analytics. Use an HTTPS REST endpoint and encrypted Vercel variables.

Copy `.env.example` to `.env.local`; never commit credentials. `npm run places:resolve` prints Places candidates for human confirmation. Confirm name, address and operational status, then set each stable `placeId` in the pilot overlay. Photo resource names are requested fresh, never saved or cached. `/api/places?id=<pilot-id>` fetches photo bytes and author attribution together, exposes no key and fails to a branded fallback. Missing credentials means photos are not active.

Feedback is browser-local (last 100 entries) unless the optional REST store is configured. API returns `persisted:false` rather than falsely claiming durable storage. No community scoring yet. Local data can be removed by clearing browser storage. The REST store needs a maintainer retention/deletion procedure before a wider pilot.

## Analytics

`home_opened`, `filter_selected`, `recommend_3_requested`, `just_pick_requested`, `restaurant_selected`, `reroll_requested`, `maps_opened`, `feedback_submitted`. Server validates allowed properties and stores no name, location or session identifier. Without shared storage, events are structured Vercel runtime logs, not a permanent dashboard.

## Deployment

Use a Vercel preview. The connected Vercel account currently lacks its GitHub login connection, so direct source deployment is used; connecting Git later will enable automatic previews. Keep changes on `sprint-1-mvp-v0.1`; do not merge main until reviewed.

## Remaining pilot checks

- Set Places key, resolve stable place IDs, test live photos and attribution.
- Walk-check Maps destinations, prices, queue speed, opening-hours exceptions and distances.
- Configure durable storage if shared feedback is needed; add retention and abuse controls before public launch.
- Browser QA at iPhone and desktop sizes; automated tests cover recommendation and feedback contracts.

Sprint 1 is not complete until the reachable preview and full mobile loop are verified. Follow the [original product brief](docs/PRODUCT_BRIEF.md) and [migration policy](docs/V1_DATA_MIGRATION.md).
