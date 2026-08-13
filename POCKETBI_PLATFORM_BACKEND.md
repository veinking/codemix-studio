# PocketBI Platform backend

bIDE now targets the shared PocketBI Platform Supabase project:

`bozkwngfioubgwzvzfif`

The shared backend owns PocketBI ID, profiles, billing sources, entitlements, credits, usage, organizations, and bIDE product data. KcalTap/Foodtrack remains on its own Supabase project.

The reconstructed bIDE tables and RPC contracts were applied to the shared backend from the surviving `codemix-studio` schema history.

Do not redeploy the historical Edge Functions blindly. Review authentication, rate limiting, and required secrets first. In particular, unauthenticated AI/activity RPC execution is disabled in the shared backend until deliberate abuse controls are in place.
