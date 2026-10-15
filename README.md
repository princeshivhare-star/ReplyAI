# ReplyAI

ReplyAI is a React/Vite customer-conversation workspace with Supabase authentication and data storage, Meta messaging/comment integrations, OpenAI reply generation, and Stripe subscriptions. API credentials stay on the server; only the Supabase anon key is exposed to the browser.

## Local development

1. Install Node.js 20 or newer, then run `npm install`.
2. Copy `env.example` to `.env` and fill in the Supabase values. The app can build without credentials, but authentication and API-backed features require them.
3. Apply `supabase/migrations/202610150001_initial_schema.sql` to your Supabase project using its SQL editor.
4. Run `npm run dev`. The Vite app runs at `http://localhost:5173`; its local API adapter runs on `http://127.0.0.1:3000`.
5. Run `npm test` for the rule-matching tests and `npm run build` for the production frontend build.

For local Meta OAuth and webhook testing, use an HTTPS tunnel and configure Meta with the tunnel's public callback/webhook URLs. Meta cannot call a loopback address on your computer.

## Environment variables

Use `env.example` as the complete variable list. Add secrets to your local `.env` or your hosting provider's encrypted environment-variable settings; never commit them or place service-role, Meta, OpenAI, Stripe, or cron secrets in a `VITE_` variable.

Required services:

- **Supabase:** set the project URL and anon key for the frontend, plus the service-role key for server-side functions. Configure email confirmation and allowed redirect URLs in Supabase Auth.
- **Meta:** configure the app ID/secret and the exact OAuth redirect URL. Add `/api/webhook` as the Meta webhook callback with the configured verify token. Subscribe the app to Instagram `comments` and `messages`, and Facebook Page `feed` and `messages` events. The OAuth flow stores Page/Instagram tokens server-side and subscribes connected accounts to events.
- **OpenAI:** set a server-side API key; optionally choose the model. The AI endpoint uses a daily usage quota.
- **Stripe:** create recurring USD prices of $19/month for Starter and $49/month for Growth, then provide each Price ID. Checkout rejects inactive or mismatched Price IDs. Configure the `/api/billing/webhook` endpoint for checkout completion and subscription create/update/delete events. Enable plan switching in the Stripe billing portal.
- **Scheduled worker:** the webhook endpoint queues Meta events and returns promptly. Invoke `/api/process-webhooks` once per minute with `Authorization: Bearer <CRON_SECRET>` using Vercel Cron or an equivalent trusted scheduler.

Plan allowances are 3 automations and 20 AI replies/month on Free, 5 automations and 50 AI replies/month on Starter, and unlimited automations with 1,000 AI replies/month on Growth. Social accounts are not capped.

## Deploy to Vercel

Import the repository into Vercel. The checked-in Vercel configuration builds the Vite frontend, routes the API functions, applies baseline browser security headers, and schedules the webhook worker. Add all production environment variables before deploying. Set `APP_URL` to the production HTTPS origin and `META_REDIRECT_URI` to `https://<your-domain>/api/meta/callback`; the callback URL must exactly match Meta's configuration.

Live social messaging requires the Meta app to be configured, webhook fields subscribed, and any required Meta App Review/business verification completed. Stripe checkout requires valid Price IDs and an active webhook endpoint. These external approval, account, and credential steps cannot be completed from the source repository alone.
