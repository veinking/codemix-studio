# bIDE Product QC Identity

Canonical customer-support identity for bIDE is `support@pocketbi.app`.

Customer-facing Support, Privacy, and Terms surfaces must use that address and must not use the retired `support@bideide.com`, KcalTap's `support@kcaltap.com`, or the legacy shared `support@proairesume.com` mailbox.

Vercel Git deployments are intentionally limited to `main` and deliberate `preview/**` branches. Normal agent, native-iOS, chore, and QC branches must not consume preview deployments.

The build-time guard is `npm run test:qc-identity`.
