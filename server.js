require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cookieSession = require('cookie-session');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PAGE_COUNT = 21;
const DATA_DIR = path.join(__dirname, 'data');
const CONTENT_PATH = path.join(DATA_DIR, 'content.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'letmein';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const PORT = process.env.PORT || 3000;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function defaultMargin() {
  return { top: 24, right: 24, bottom: 24, left: 24 };
}

function defaultQuoteTransform() {
  // percentages relative to the left page
  return { x: 15, y: 20, width: 70, height: 45, rotation: 0 };
}

function defaultNoteTransform() {
  // zoom >= 1, posX/posY are the focal point as a percentage of the image
  return { zoom: 1, posX: 50, posY: 50 };
}

function defaultContent() {
  const pages = [];
  for (let i = 0; i < PAGE_COUNT; i++) {
    pages.push({
      quoteImage: null,
      quoteTransform: defaultQuoteTransform(),
      noteImage: null,
      noteTransform: defaultNoteTransform(),
      margin: null // null = inherit globalMargin
    });
  }
  return {
    title: "Happy 21st Birthday",
    coverImage: null,
    epilogueImage: null,
    trueCoverImage: null,
    globalMargin: defaultMargin(),
    yesMessage: "I'm so glad you liked it. Happy 21st birthday!",
    noMessage: "That's okay — tell me what you'd change 💛",
    pages
  };
}

function loadContent() {
  if (!fs.existsSync(CONTENT_PATH)) {
    const initial = defaultContent();
    fs.writeFileSync(CONTENT_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = fs.readFileSync(CONTENT_PATH, 'utf-8');
  try {
    const parsed = JSON.parse(raw);
    // Backfill in case PAGE_COUNT changed or fields are missing
    if (!Array.isArray(parsed.pages)) parsed.pages = [];
    while (parsed.pages.length < PAGE_COUNT) {
      parsed.pages.push({
        quoteImage: null,
        quoteTransform: defaultQuoteTransform(),
        noteImage: null,
        noteTransform: defaultNoteTransform(),
        margin: null
      });
    }
    parsed.pages.forEach((page) => {
      if (!page.quoteTransform) page.quoteTransform = defaultQuoteTransform();
      if (!page.noteTransform) page.noteTransform = defaultNoteTransform();
    });
    if (!parsed.globalMargin) parsed.globalMargin = defaultMargin();
    return parsed;
  } catch (e) {
    console.error('Failed to parse content.json, resetting to defaults.', e);
    const initial = defaultContent();
    fs.writeFileSync(CONTENT_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
}

function saveContent(content) {
  fs.writeFileSync(CONTENT_PATH, JSON.stringify(content, null, 2));
}

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(
  cookieSession({
    name: 'session',
    secret: SESSION_SECRET,
    maxAge: 24 * 60 * 60 * 1000
  })
);

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: 'Not authenticated' });
}

// --- Auth ---
app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (password && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Wrong password' });
});

app.post('/api/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

app.get('/api/session', (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// --- Content (public GET so the book can be viewed; writes require auth) ---
app.get('/api/content', (req, res) => {
  res.json(loadContent());
});

app.post('/api/content', requireAuth, (req, res) => {
  const incoming = req.body;
  if (!incoming || !Array.isArray(incoming.pages) || incoming.pages.length !== PAGE_COUNT) {
    return res.status(400).json({ error: 'Invalid content payload' });
  }
  saveContent(incoming);
  res.json({ ok: true });
});

// --- Uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = crypto.randomBytes(8).toString('hex') + ext;
    cb(null, name);
  }
});

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.has(file.mimetype)) return cb(null, true);
    cb(new Error('Unsupported file type'));
  }
});

app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: '/uploads/' + req.file.filename });
});

app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message || 'Upload error' });
  next();
});

// --- Static ---
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Birthday book running at http://localhost:${PORT}`);
  console.log(`Admin panel at http://localhost:${PORT}/admin.html`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`(Using default admin password "letmein" — set ADMIN_PASSWORD env var to change it.)`);
  }
});
