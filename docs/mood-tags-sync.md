# Mood Tags sync — 19 October 2026

Source: the maintainer's private Places catalogue, Mood Tags column,
matched only through Internal ID. The private catalogue URL is not published here.

88 nonblank Sheet rows were inspected. 87 unique Internal IDs matched all 87
production catalogue records. Only moodTags was added/updated in restaurant data.
No other restaurant metadata, community submissions or feedback was changed.

| Tag | Mapped records (including inactive) | Active records |
| --- | ---: | ---: |
| Healthy | 2 | 2 |
| Local / Asian | 60 | 54 |
| Western / Cafe | 35 | 34 |

One unresolved row was skipped: row 39, 川太子麻辣烫, blank Internal ID.
It was not matched by name, address or guesswork. All production records already
have matching rows with explicit Internal IDs, including chuan-tai-zi-mala-tang-arc.

The current Sheet is authoritative even when its choices differ from an example
or a cuisine inference. Green Elephant has all three approved tags. Grains & Co.
has Healthy and Western / Cafe. Nature Cafe, Stuff’d, Boost and The Soup Spoon
do not have Healthy. Anything is a UI state, never a stored restaurant tag.

The app reads only the GitHub snapshot. Future Sheet changes require another
reviewed sync and deployment. scripts/sync-mood-tags.mjs validates a connector
export of {row,id,name,tags} records and writes only with --write. It rejects
unknown tags, duplicate IDs/tags and missing production mappings.

The selector is single-choice and intersects the cumulative MBC distance radius.
Unavailable moods are hidden. Changing radius retains a still-available mood,
otherwise resets to Anything. Both recommendation actions share the same pool.
Existing safety checks, random weights, uniqueness and reroll policy remain.
Positive moods require dated verification, matching the previous food trust rule.
