
import {
  hashPassword,
  json,
  validOrigin,
  createSession,
  cookieHeader
} from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ error: "Customer database is not configured." }, 503);
  }

  if (!validOrigin(request)) {
    return json({ error: "Request origin not allowed." }, 403);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: "Please submit valid details." }, 400);
  }

  const fullName = String(body.fullName || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (fullName.length < 2 || fullName.length > 100) {
    return json({ error: "Enter your full name." }, 400);
  }

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return json({ error: "Enter a valid email address." }, 400);
  }

  if (password.length < 10 || password.length > 128) {
    return json({
      error: "Password must be between 10 and 128 characters."
    }, 400);
  }

  try {
    const existing = await env.DB.prepare(
      "SELECT id FROM customers WHERE email = ? LIMIT 1"
    ).bind(email).first();

    if (existing) {
      return json({
        error: "This email already has an account. Please sign in."
      }, 409);
    }

    const passwordHash = await hashPassword(password);

    const result = await env.DB.prepare(
      "INSERT INTO customers (full_name, email, password_hash) VALUES (?, ?, ?)"
    ).bind(fullName, email, passwordHash).run();

    const customerId = result.meta.last_row_id;

    const token = await createSession(env.DB, customerId);

    return json({
      ok: true,
      customer: { fullName, email }
    }, 201, {
      "Set-Cookie": cookieHeader(token)
    });

  } catch {
    return json({
      error: "Unable to create account. Please try again."
    }, 500);
  }
}
