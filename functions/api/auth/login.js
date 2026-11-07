
import {
  verifyPassword,
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
    return json({ error: "Please enter your email and password." }, 400);
  }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password || email.length > 254 || password.length > 128) {
    return json({ error: "Email or password is incorrect." }, 400);
  }

  try {
    const customer = await env.DB.prepare(
      "SELECT id, full_name, email, password_hash FROM customers WHERE email = ? LIMIT 1"
    ).bind(email).first();

    if (
      !customer ||
      !(await verifyPassword(password, customer.password_hash))
    ) {
      return json({ error: "Email or password is incorrect." }, 401);
    }

    const token = await createSession(env.DB, customer.id);

    return json(
      {
        ok: true,
        customer: {
          fullName: customer.full_name,
          email: customer.email
        }
      },
      200,
      { "Set-Cookie": cookieHeader(token) }
    );

  } catch {
    return json({ error: "Unable to sign in. Please try again." }, 500);
  }
}
