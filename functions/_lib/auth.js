
const ITERATIONS = 310000;
const SESSION_DAYS = 7;

function toBase64(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

async function sha256(value) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return new Uint8Array(digest);
}

async function hashPassword(password, salt = randomBytes(16)) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: ITERATIONS
    },
    key,
    256
  );

  return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(
    new Uint8Array(bits)
  )}`;
}

async function verifyPassword(password, stored) {
  try {
    const [scheme, iterationsText, saltText, expectedText] =
      stored.split("$");

    if (scheme !== "pbkdf2") return false;

    const iterations = Number(iterationsText);

    if (
      !Number.isInteger(iterations) ||
      iterations < 100000 ||
      iterations > 1000000
    ) return false;

    const salt = fromBase64(saltText);
    const expected = fromBase64(expectedText);

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt,
        iterations
      },
      key,
      expected.length * 8
    );

    const actual = new Uint8Array(bits);

    if (actual.length !== expected.length) return false;

    let difference = 0;

    for (let i = 0; i < actual.length; i++) {
      difference |= actual[i] ^ expected[i];
    }

    return difference === 0;
  } catch {
    return false;
  }
}

function cookieValue(request, name) {
  const header = request.headers.get("Cookie") || "";

  for (const part of header.split(";")) {
    const index = part.indexOf("=");

    if (index < 0) continue;

    if (part.slice(0, index).trim() === name) {
      return part.slice(index + 1).trim();
    }
  }

  return null;
}

function cookieHeader(token) {
  return `shugas_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
}

function clearCookieHeader() {
  return "shugas_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers
    }
  });
}

function validOrigin(request) {
  const origin = request.headers.get("Origin");

  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function createSession(db, customerId) {
  const token = toBase64(randomBytes(32))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");

  const tokenHash = toBase64(await sha256(token));

  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 86400000
  ).toISOString();

  await db.prepare(
    "INSERT INTO customer_sessions (token_hash, customer_id, expires_at) VALUES (?, ?, ?)"
  ).bind(tokenHash, customerId, expiresAt).run();

  return token;
}

async function getCustomer(request, db) {
  const token = cookieValue(request, "shugas_session");

  if (!token) return null;

  const tokenHash = toBase64(await sha256(token));

  const row = await db.prepare(
    `SELECT c.id, c.full_name, c.email
     FROM customer_sessions s
     JOIN customers c ON c.id = s.customer_id
     WHERE s.token_hash = ? AND s.expires_at > ?
     LIMIT 1`
  ).bind(tokenHash, new Date().toISOString()).first();

  return row || null;
}

export {
  hashPassword,
  verifyPassword,
  json,
  validOrigin,
  createSession,
  getCustomer,
  cookieHeader,
  clearCookieHeader
};
