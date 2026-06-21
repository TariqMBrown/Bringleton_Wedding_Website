# Wedding website — setup guide

This site is based on [rampatra/wedding-website](https://github.com/rampatra/wedding-website).
It's a static site: HTML + SCSS (compiled with Gulp) + a tiny serverless RSVP backend
(Google Sheets + Apps Script). No server, no database, no hosting fees.

## Status — Erin & Tariq, June 27, 2027

**Already filled in & rendering:**
- Names, page title, hero (text instead of the template's name-logo image), footer
- Date: Sunday, June 27, 2027
- Events: Ceremony @ Grand Rapids Art Museum (1–2 PM), Reception @ St. Cecilia's (3–8 PM)
- Dress code: cocktail / semi-formal (placeholder default — edit to taste)
- Your 6 photos wired into the hero, "How we met", and engagement gallery
- Venue map: keyless Google Maps embed (no API key needed)
- Instagram hashtag #ErinAndTariq, add-to-calendar event, RSVP deadline (June 1, 2027)

**Still TODO before going live:**
1. Rewrite the "How we met" paragraph (currently a friendly placeholder) — `index.html`, `#intro`.
2. Stand up the RSVP backend so the form actually saves responses — **step 2 below**.
3. (Optional) Replace `[YOUR-DOMAIN]` in the `og:image` meta tag once deployed.
4. Deploy — **step 4 below**.

---


## Run it locally

```bash
npm install          # once
npx gulp             # compile sass/ -> css/ and minify js/ -> *.min.js
python3 -m http.server 8000
# open http://localhost:8000
```

Re-run `npx gulp` after editing anything in `sass/` or `js/` (the page loads the
**minified** `css/styles.min.css` and `js/scripts.min.js`, not the source files).
Tip: `npx gulp watch` rebuilds automatically on save.

---

## 1. Personalize the content

All placeholders are written like `[THIS]`. Search the project for `[` to find them.
Main spots:

### `index.html`
- `[PARTNER 1]` / `[PARTNER 2]` — your names (title, hero, footer, social preview)
- `[WEDDING DATE]`, `[DAY 1 DATE]`, `[DAY 2 DATE]` — dates
- Events section — one `<div class="wpN">` block per event; add/remove to taste
  (the `wp3`–`wp9` classes drive the scroll-in animations)
- Dress-code modal — or delete the "Dress code" button if unused
- `[YOURHASHTAG]` — Instagram/Twitter hashtag
- `[CITY]`, `[YOUTUBE_ID]` — the background-video section (or delete `#video-bg`)
- `[VENUE NAME]`, `[VENUE ADDRESS]`, `[CONTACT NAME]`, `[PHONE]` — the map section
- Uber button — replace coords/address or delete the block
- `[RSVP DEADLINE]`
- `[YOUR_GOOGLE_MAPS_API_KEY]` — see step 3
- Google Analytics block is commented out; add `[GA_ID]` and uncomment if you want it

### `js/scripts.js`
- Calendar event details (title / start / end / address) — already set for June 27, 2027
- `RSVP_ENDPOINT` + invite-code hashes — see step 2
- (The venue map is now a keyless `<iframe>` embed in `index.html`, so the old
  `initMap()` lat/lng and the Maps API key are no longer used.)

### Images & icons
- Replace the photos in `img/` and `img/eng_pics/` (keep the same filenames, or update
  the `src=`/`href=` references). `logo.png` / `logo-lg.png` are the header/hero logos.
- Regenerate favicons (the `favicon*`, `android-chrome-*`, `apple-touch-icon*`,
  `mstile-*`, `safari-pinned-tab.svg` files) e.g. with https://realfavicongenerator.net

---

## 2. RSVP backend (Google Drive Sheet + Apps Script)

The form POSTs `email`, `name`, `extras`, `invite_code` to a Google Apps Script web app,
which appends a row to a Google Sheet in your Drive (and can email you on each RSVP).
The browser/code side is **already wired up** — you only do the Google-account steps below
and paste **one URL** back.

### a. Create the sheet
1. Go to **https://sheets.new** (signed in as you) and name it e.g. "Wedding RSVPs".
2. In **row 1**, type these 5 headers, one per cell (exact spelling, lowercase):
   `timestamp`  `email`  `name`  `extras`  `invite_code`

### b. Add the script
1. In that sheet: **Extensions → Apps Script**.
2. Delete the sample `function myFunction() {}` and paste the **entire contents of
   `apps-script/Code.gs`** from this project. (Optionally set `NOTIFY_EMAIL` to
   `tariqmbrown@gmail.com` near the top to get an email per RSVP.)
3. Click the **Save** (disk) icon.

### c. Deploy as a web app
1. **Deploy → New deployment**. Click the gear ⚙ → **Web app**.
2. **Execute as:** Me. **Who has access:** **Anyone**.
3. **Deploy**, then **Authorize access** (pick your Google account; on the
   "Google hasn't verified this app" screen click *Advanced → Go to … (unsafe)* — it's
   your own script).
4. Copy the **Web app URL** (ends in `/exec`). You can paste it into a browser to
   confirm it shows `{"result":"ok", ...}`.

### d. Connect it (the one paste)
Open `js/scripts.js`, find this line near the RSVP section:

```javascript
window.RSVP_ENDPOINT = 'PASTE_YOUR_WEB_APP_URL_HERE';
```

Replace the placeholder with your `/exec` URL, then run **`npx gulp`** to rebuild.
(If you'd rather not run gulp, the same `PASTE_YOUR_WEB_APP_URL_HERE` string also exists
in `js/scripts.min.js` — replacing it there works too.)

> Whenever you edit `Code.gs` later, redeploy with **Deploy → Manage deployments →
> edit (pencil) → Version: New version → Deploy**, or the `/exec` URL keeps serving the
> old code.

### e. The invite code
Guests must enter an invite code so randoms can't spam your sheet. It's already set to:

> **`erintariq`**  (put this on your invitations)

Only its MD5 hash is in the code, never the plain word. To change it: serve the site,
open the browser **console**, run `MD5('your-new-code')`, and replace the hash in the
`VALID_INVITE_HASHES` array in `js/scripts.js` (add more entries for multiple codes),
then `npx gulp`. To drop the code requirement entirely, set
`VALID_INVITE_HASHES = []`-bypass by deleting the invite-code `if (...) return;` block and
removing the invite-code `<input>` from `index.html`.

### f. Test
Serve the site, fill the form with code `erintariq`, and submit. You should see the
"Thank you!" modal and a new row appear in your sheet. Before the URL is connected the
form shows a friendly "endpoint isn't connected yet" notice instead.
If it fails, open the console — a CORS/`/exec` 302 is normal (jQuery follows it); a
`result: error` message comes from the script itself.

---

## 3. Google Maps

The venue map needs a **Google Maps JavaScript API key**:
https://developers.google.com/maps/documentation/javascript/get-api-key

1. Create a key, enable the **Maps JavaScript API**, and (recommended) restrict it to
   your domain.
2. Put it in `index.html` where it says `[YOUR_GOOGLE_MAPS_API_KEY]`.
3. Set the marker coordinates in `js/scripts.js` `initMap()` (`[LAT]`/`[LNG]`). In Google
   Maps, right-click your venue — the first context-menu item is the `lat, lng` pair.

---

## 4. Deploy (GitHub Pages, free)

1. Create a GitHub repo and push this folder.
2. Repo **Settings → Pages → Build and deployment → Deploy from a branch**, pick your
   branch and `/ (root)`.
3. Your site goes live at `https://<username>.github.io/<repo>/`.
4. **Custom domain?** Add a file named `CNAME` (no extension) at the repo root containing
   just your domain (e.g. `wedding.example.com`), and point a DNS CNAME/ALIAS record at
   GitHub Pages. (The original author's `CNAME` was removed during setup.)

Because the page references `node_modules/` for a couple of CSS/JS files (with CDN
fallbacks), either commit `node_modules/` or rely on the built-in `onerror` CDN
fallbacks — the site works either way.
