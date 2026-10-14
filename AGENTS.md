# AGENTS.md

## Deployment

- Production is the VPS (flaggo.rohanahire.com). Every push to `main` is deployed there within about 5 minutes by `flaggo-deploy.timer` (see `deploy/` and `docs/production-setup.md`).
- Do not push or merge to `main` unless the user asked for it, because that is a production deploy.
- Do not add Netlify (or any other hosted platform) config; the app has no Netlify dependency.
