# AGENTS.md

## Deployment

- Do not deploy to Netlify production unless the user explicitly asks for a production deploy.
- For Git-based Netlify builds, production deploys are skipped by default via `scripts/netlify-ignore-build.cjs`.
- To intentionally allow a production deploy from Git, include `[deploy]` in the commit message.
- For manual CLI testing, use `netlify deploy` for preview deploys. Use `netlify deploy --prod` only after explicit user approval.
