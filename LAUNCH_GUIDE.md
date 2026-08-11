# bIDE Launch Guide

bIDE is a browser IDE and a **PocketBI product**. The public product domain remains **bideide.com** while PocketBI provides the shared product hub, privacy center, and developer support identity.

## Current positioning

**One-line description**

> bIDE is a browser-based IDE for Python, R, JavaScript, SQL, notebooks, and data work with core local workflows that do not require an account.

Avoid advertising cloud, AI, subscription, or sharing features as active unless the corresponding backend services are actually configured and tested in production.

## Demo flow

For public demos, show the low-friction local experience first:

1. Open `bideide.com`.
2. Launch the IDE without creating an account.
3. Run a small Python or R example in the browser.
4. Demonstrate the editor and a data-oriented tool such as a dataset view or plot.
5. Explain that cloud/AI features are optional services rather than requirements for the core IDE.

## Product-family language

Use:

- **bIDE** for the product name.
- **bIDE — a PocketBI product** when explaining the product family.
- **PocketBI** for the shared product hub at `pocketbi.app`.

Keep `bideide.com` as the canonical bIDE product domain rather than moving the IDE into the PocketBI deployment.

## Launch checklist

- [ ] Confirm `bideide.com` loads successfully.
- [ ] Confirm `/ide` launches for a guest/local-mode user.
- [ ] Test Python and R browser execution.
- [ ] Test mobile and desktop layouts.
- [ ] Confirm login/signup are hidden or disabled when Supabase is not configured.
- [ ] Confirm AI/cloud/payment actions are not presented as working when their backends are disabled.
- [ ] Confirm Support shows the shared developer inbox.
- [ ] Confirm bIDE links to the PocketBI Privacy Center.
- [ ] Capture current screenshots only after production behavior is verified.

## Privacy and support

- Shared privacy center: `https://pocketbi.app/privacy-center.html`
- bIDE privacy: `https://pocketbi.app/privacy-bide.html`
- Support: **support@proairesume.com**

Include `bIDE` in support-message subject lines.

## Marketing channels

Once production is stable, good launch channels include Product Hunt, Show HN, relevant programming/data communities, university resource pages, developer directories, short tutorial videos, and technical posts that demonstrate the browser runtime architecture.

Marketing claims should match the currently deployed product. In particular, do not claim unlimited AI, active subscriptions, cloud sync, or backend features until they are actually enabled and tested.
