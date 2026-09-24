# Sayu Restaurant — Build QA Notes

Delivered: vanilla HTML/CSS/JS site (`index.html`, `menu.html`, `gallery.html`, `styles.css`, `main.js`). No build step — open `index.html` directly or drop the folder on any static host.

## Palette — sampled, not eyeballed
Ran a pixel-read script against `images/logo/sayu_logo.png`:
- `--color-washi: #FCF8EC` (most common background pixel)
- `--color-sumi: #000000` (darkest ink-stroke pixel, true black)
Both confirmed against WCAG AA — hanko red on washi is 6.5:1, sumi on washi is 19.8:1, all body text combos checked and pass.

## Images — what's real vs stock
**No confirmed-rights photos of Sayu's actual food or room were found** (no live official site, Instagram/Facebook fetches were blocked — see below). Every photo in `/images/gallery/` is **licensed stock photography** (Unsplash License, free for commercial use, no attribution required), chosen to match real izakaya/sushi subject matter. Each is clearly labelled "Stock photo" on the gallery page and captioned honestly — none are presented as actual Sayu photos.

Stock images used: nigiri platter, sashimi platter, robata grill coals, chef hands preparing sushi, dining room interior, sake set, izakaya small plates, exterior storefront with lanterns.

**Before launch:** swap these for real photos of Sayu's food and room once the client can supply or approve them.

## Research access notes
Live web search found an AGFG listing and what appears to be a real Instagram account (`instagram.com/sayu_japanese_restaurant`) for the business — that Instagram link is now wired into the header/footer icons per your message mid-build. Direct fetches of Instagram, the AGFG page, and Facebook all returned 403/429 (bot-blocked), so none of their photo/menu content could be pulled in directly.

One search summary suggested Sayu **won** (not just was nominated for) the AGFG Readers' Choice 2026 Japanese category, but I could not verify this against a direct source (the AGFG page itself blocked fetching). **The site currently only says "nominee" — confirm the actual award status with the client before changing this claim.**

## Menu
No real menu items or prices were found anywhere online. `menu.html` has honest category structure (Sushi & Sashimi, Robata/Grill, Izakaya Small Plates, Sides, Drinks) with clearly marked placeholders and `<!-- TODO -->` comments — no invented dishes or prices.

## Open items to confirm with the client before launch
1. **Menu items and pricing** — needed from the client directly.
2. **Hours discrepancy** — Google Business shows Thu/Fri/Sat lunch (11:30am–2pm) + dinner; AGFG shows dinner-only Tue–Sat. Site is built on the Google hours (flagged in an HTML comment in `index.html` near the hours table). Confirm which is correct.
3. **AGFG Readers' Choice 2026** — confirm win vs. nomination (see above).
4. **Facebook page** (`facebook.com/p/Sayu-61584788882682/`) — linked in the footer, but shows minimal activity. Confirm it's the real, actively-managed page.
5. **Instagram** (`instagram.com/sayu_japanese_restaurant`) — now linked per your instruction; confirm it's the correct/active account.
6. **Photo usage rights** — all gallery images are Unsplash-licensed stock; swap for real, rights-cleared photos before launch.
7. **Online bookings** — no reservation platform found; site is phone-only by design, per the brief.

## Known environment-only limitation (not a site bug)
Testing in this sandbox, Google Fonts and the Google Maps embed both fail to load because this container's outbound proxy intercepts TLS for those hosts. Both use standard, correct URLs (Google Fonts CDN link, the documented no-API-key Maps embed pattern) and will work normally on any real hosting.
