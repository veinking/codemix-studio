# bIDE — a PocketBI product

**bIDE** is a browser-based IDE for coding, data science, and lightweight analysis. Its primary domain is **bideide.com** and it remains technically separate from PocketBI while sharing the PocketBI product family, support identity, and privacy center.

## Product model

- **PocketBI** is the shared public product hub at `pocketbi.app`.
- **bIDE** remains its own web application and domain at `bideide.com`.
- Core browser workflows are designed to work in **local mode** without a configured cloud backend.
- Optional Supabase, AI, sharing, and payment features can be enabled independently later.

## Core capabilities

- Monaco-based code editor
- Python/Pyodide browser runtime
- R/webR browser runtime
- JavaScript and SQL/browser runtime support
- Additional runtime adapters and editor-only languages
- Notebook mode
- Dataset viewer and data operations
- Plot builder/viewer
- Templates and learning tools
- Local browser persistence
- Optional Supabase auth/cloud/share features
- Optional AI Edge Functions
- Optional Stripe subscription scaffolding

## Local mode

When Supabase is not configured, bIDE intentionally falls back to local mode. The app should not require a login to launch the IDE. Cloud sync, AI, account, sharing, and payment features are disabled until their required backend services are configured.

## Fresh clone

```bash
npm install
npm run dev
```

The local Vite development server is configured around port `8080` by default.

## Optional environment configuration

Copy `.env.example` to `.env` only when enabling hosted services.

Frontend variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_PUBLIC_SITE_URL`

Server/Edge Function secrets belong in the backend environment, never in the frontend bundle:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LOVABLE_API_KEY` — currently consumed by the existing AI Edge Functions (`ai-code-assistant`, `code-translator`, `data-advisor`, `explain-error`, and related gateway-backed features)
- `OPENAI_API_KEY` — only required after/if an Edge Function is explicitly migrated to call OpenAI directly; setting it alone does not enable the current gateway-backed functions
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`

Never commit `.env` or real credentials. Before enabling AI publicly, verify the deployed Edge Functions against the provider actually configured in production rather than assuming a generic API key is sufficient.

## Product URLs

- bIDE: `https://bideide.com`
- PocketBI hub: `https://pocketbi.app`
- Shared privacy center: `https://pocketbi.app/privacy-center.html`
- bIDE privacy policy: `https://pocketbi.app/privacy-bide.html`

## Support

Shared developer support: **support@proairesume.com**

Include `bIDE` in the subject line for bIDE-specific requests.

## Deployment notes

The frontend can be deployed independently from PocketBI. Keeping separate deployments reduces the blast radius of failures while allowing both products to share public branding and support resources. Backend services should be enabled only after their environment variables, migrations, security policies, and production behavior have been validated.
