# 밥Lah Brand

The supplied artwork is the visual source of truth. Do not reconstruct the Hangul, substitute fonts, or reinterpret the artwork.

## Approved assets

- `baplah-logo-horizontal.png`: transparent 423 × 186 PNG cropped directly from the approved horizontal reference. Black stylised 밥 and smiling rice bowl, warm-orange handwritten Lah and underline. Use at 140 CSS pixels wide in the website header, preserving aspect ratio.
- `/icon-192.png`: 192 × 192 app/browser icon.
- `/icon-512.png`: 512 × 512 app icon.
- `/apple-touch-icon.png`: 180 × 180 iPhone Home Screen icon.

The square icons use only the white 밥 extracted from the separate charcoal app-icon reference. They have opaque charcoal backgrounds; iOS applies its Home Screen rounded-square mask. They do not contain Lah, orange details, or the horizontal logo.

These are raster extractions from the supplied images, not font recreations or approximate SVG tracings. The source icon is a small raster reference; a future original master would improve very large exports without changing the design.

The previous reconstructed SVGs, variants and cream/orange app icon have been removed. Do not restore or reuse them.

## Identity and palette

Product name: **밥Lah**. Primary tagline: **Eat where today?**.

- Cream: `#FFF8ED`
- Charcoal: `#2E2E2E`
- Warm Orange: `#E06B4D`
- Muted Red: `#C94F4F`
- Soft Green: `#6BA776`

## iPhone refresh check

Open the production site in Safari, inspect the header, then choose Share → Add to Home Screen. Confirm the charcoal icon with white 밥. Delete and re-add an existing shortcut if iOS has cached the previous icon. Actual Safari installation QA must be performed on an iPhone; desktop checks cannot confirm the operating system's icon cache.
