
import {
  json,
  validOrigin,
  clearCookieHeader
} from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ error: "Customer database is not configured." }, 503);
  }

  if (!validOrigin(request)) {
    return json({ error: "Request origin not allowed." }, 403);
  }

  const cookie = request.headers.get("Cookie") || "";

  const token = cookie
    .split(";")
    .map(part => part.trim())
    .find(part => part.startsWith("shugas_session="))
    ?.slice("shugas_session=".length);

  if (token) {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(token)
    );

    let binary = "";

    for (const byte of new Uint8Array(digest)) {
      binary += String.fromCharCode(byte);
    }

    const tokenHash = btoa(binary);

    await env.DB.prepare(
      "DELETE FROM customer_sessions WHERE token_hash = ?"
    ).bind(tokenHash).run();
  }

  return json(
    { ok: true },
    200,
    { "Set-Cookie": clearCookieHeader() }
  );
}
