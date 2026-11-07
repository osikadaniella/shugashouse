# ShugasHouse — Storefront Starter

A responsive premium general-merchandise storefront starter for the Nigerian market.

## Included
- Responsive homepage and navigation
- Category tiles and featured product cards
- Product search and category filters
- Front-end shopping bag interaction
- Customer login and registration page layouts (not yet connected)
- NGN price display

## Important before launch
This is the first storefront stage only. The sample products and prices are illustrative. The cart is currently browser-side only. Login, registration, checkout, payment processing, order storage, inventory and admin functions are not connected yet. Do not collect real customer credentials or payments until the secure backend is implemented and tested.

## Preview locally
Open `index.html` in a browser, or deploy the folder to a Cloudflare Pages project.

## Next development stage
Connect Cloudflare Pages Functions and D1 for:
- Secure password hashing and session management
- Customer registration, login and logout
- Product and inventory database
- Persistent cart and order creation
- Admin-only product/order management
- Paystack or Flutterwave payment verification

Never store plaintext passwords or trust a browser-only payment success message.
