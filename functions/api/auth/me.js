
import {
  json,
  getCustomer
} from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  if (!env.DB) {
    return json({
      error: "Customer database is not configured."
    }, 503);
  }

  try {
    const customer = await getCustomer(request, env.DB);

    if (!customer) {
      return json({
        authenticated: false
      }, 401);
    }

    return json({
      authenticated: true,
      customer: {
        fullName: customer.full_name,
        email: customer.email
      }
    });

  } catch {
    return json({
      error: "Unable to check your account."
    }, 500);
  }
}
