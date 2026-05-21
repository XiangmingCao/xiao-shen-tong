import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const DATA_DIR = join(ROOT, 'data');
const DB_FILE = join(DATA_DIR, 'users.json');
const PORT = Number(process.env.PORT || 3000);
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.csv': 'text/csv; charset=utf-8',
};

let dbCache = null;

function defaultState() {
  return {
    mastered: {},
    stars: 0,
    records: {},
    currentLanguage: 'zh',
    petLevel: 1,
    petClaimedLevels: {},
  };
}

async function loadDb() {
  if (dbCache) return dbCache;
  try {
    dbCache = JSON.parse(await readFile(DB_FILE, 'utf8'));
  } catch(e) {
    dbCache = { users: {}, sessions: {} };
  }
  dbCache.users ||= {};
  dbCache.sessions ||= {};
  return dbCache;
}

async function saveDb() {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DB_FILE, JSON.stringify(dbCache, null, 2));
}

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

async function readJson(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1024 * 1024) throw new Error('BODY_TOO_LARGE');
  }
  return body ? JSON.parse(body) : {};
}

function cleanUsername(username) {
  return String(username || '').trim().slice(0, 24);
}

function validatePassword(password) {
  return typeof password === 'string' && password.length > 0 && password.length <= 64;
}

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
  return { salt, hash };
}

function passwordMatches(password, user) {
  const actual = Buffer.from(hashPassword(password, user.salt).hash, 'hex');
  const expected = Buffer.from(user.passwordHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function createSession(db, username) {
  const token = randomBytes(32).toString('hex');
  db.sessions[token] = {
    username,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  return token;
}

function authToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function authenticatedUser(db, req) {
  const token = authToken(req);
  const session = db.sessions[token];
  if (!session || session.expiresAt < Date.now()) {
    if (session) delete db.sessions[token];
    return null;
  }
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  const user = db.users[session.username];
  return user ? { username: session.username, user, token } : null;
}

function publicUser(username, user, token) {
  return {
    username,
    token,
    state: user.state || defaultState(),
  };
}

async function handleApi(req, res, pathname) {
  const db = await loadDb();

  if (req.method === 'POST' && pathname === '/api/register') {
    const { username: rawUsername, password, initialState } = await readJson(req);
    const username = cleanUsername(rawUsername);
    if (!username || !validatePassword(password)) return json(res, 400, { error: 'MISSING_FIELDS' });
    if (db.users[username]) return json(res, 409, { error: 'USER_EXISTS' });

    const { salt, hash } = hashPassword(password);
    db.users[username] = {
      salt,
      passwordHash: hash,
      state: initialState && typeof initialState === 'object' ? initialState : defaultState(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const token = createSession(db, username);
    await saveDb();
    return json(res, 201, publicUser(username, db.users[username], token));
  }

  if (req.method === 'POST' && pathname === '/api/login') {
    const { username: rawUsername, password } = await readJson(req);
    const username = cleanUsername(rawUsername);
    const user = db.users[username];
    if (!username || !validatePassword(password)) return json(res, 400, { error: 'MISSING_FIELDS' });
    if (!user) return json(res, 404, { error: 'USER_NOT_FOUND' });
    if (!passwordMatches(password, user)) return json(res, 401, { error: 'WRONG_PASSWORD' });

    const token = createSession(db, username);
    await saveDb();
    return json(res, 200, publicUser(username, user, token));
  }

  const auth = authenticatedUser(db, req);
  if (!auth) {
    await saveDb();
    return json(res, 401, { error: 'UNAUTHORIZED' });
  }

  if (req.method === 'GET' && pathname === '/api/me') {
    await saveDb();
    return json(res, 200, publicUser(auth.username, auth.user, auth.token));
  }

  if (req.method === 'GET' && pathname === '/api/state') {
    await saveDb();
    return json(res, 200, { state: auth.user.state || defaultState() });
  }

  if (req.method === 'PUT' && pathname === '/api/state') {
    const { state } = await readJson(req);
    if (!state || typeof state !== 'object') return json(res, 400, { error: 'INVALID_STATE' });
    auth.user.state = state;
    auth.user.updatedAt = new Date().toISOString();
    await saveDb();
    return json(res, 200, { ok: true });
  }

  if (req.method === 'POST' && pathname === '/api/logout') {
    delete db.sessions[auth.token];
    await saveDb();
    return json(res, 200, { ok: true });
  }

  return json(res, 404, { error: 'NOT_FOUND' });
}

function serveStatic(req, res, pathname) {
  const requested = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
  const filePath = normalize(join(ROOT, requested));
  if (relative(ROOT, filePath).startsWith('..')) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const stream = createReadStream(filePath);
  stream.on('open', () => {
    res.writeHead(200, {
      'Content-Type': CONTENT_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream',
    });
    stream.pipe(res);
  });
  stream.on('error', () => {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  });
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url.pathname);
      return;
    }
    serveStatic(req, res, url.pathname);
  } catch(error) {
    console.error(error);
    json(res, 500, { error: 'SERVER_ERROR' });
  }
});

server.listen(PORT, () => {
  console.log(`小神童认字乐园服务器已启动: http://localhost:${PORT}`);
});
