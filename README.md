# Her 21st Birthday Book

A digital flip-through book: a closed cover, 21 two-page spreads (a quote image
on the left, a handwritten note image on the right), and a closing scene with
an epilogue and a "did you like it?" reveal. Everything is edited from a
password-protected admin panel — no code changes needed to add content.

## Running it

```bash
npm install
cp .env.example .env   # then edit ADMIN_PASSWORD in .env
npm start
```

- Book (what she sees): http://localhost:3000/
- Admin panel (where you upload things): http://localhost:3000/admin.html

The admin password defaults to `letmein` if you don't set `ADMIN_PASSWORD` —
change it in `.env` before sending the link to anyone.

## How it's put together

- `server.js` — small Express server. Serves the site, stores uploaded images
  in `public/uploads/`, and stores all text/layout data in `data/content.json`
  (auto-created on first run). Reading the content is public (that's how the
  book renders for her); writing it requires the admin login.
- `public/index.html` + `public/js/book.js` + `public/css/style.css` — the
  book itself: cover opening animation, page-turn transitions between
  spreads, and the closing/reveal scene.
- `public/admin.html` + `public/js/admin.js` + `public/css/admin.css` — the
  editor: upload the cover, epilogue, and true-cover images; for each of the
  21 pages, upload a quote image (drag to reposition, drag the corner handle
  to resize) and a note image (fills the page, margin adjustable); set the
  global page margin and the two closing messages.

## Editing content

1. Go to `/admin.html` and log in.
2. **Front Cover** — upload the closed-book cover image.
3. **Page 1–21** — for each page: upload a quote image on the left (drag/resize
   it however looks right), upload a handwritten note image on the right, and
   optionally override that page's margin.
4. **Epilogue** — the image shown when the book closes again at the end.
5. **True Cover** — the image revealed full-screen if she says she liked the
   book, plus the messages for "Yes" and "Not really".
6. **Global Settings** — the default margin (in px) used on every note page
   unless a page overrides it.
7. Click **Save** in the top bar after each set of changes.

Anything left empty just shows a soft placeholder in the book, so you can fill
it in over time without breaking anything.

## Deploying

This needs a Node process running (not a static host), since uploads and
saves are written to disk. Any small Node host works (Render, Railway, Fly.io,
a VPS, etc.) — set `ADMIN_PASSWORD` and `SESSION_SECRET` as environment
variables there, run `npm install && npm start`, and make sure `data/` and
`public/uploads/` are on persistent storage (not wiped on redeploy).

## Coming later (stage 2)

A bookmark with its own picture, hinted at but not built yet.
