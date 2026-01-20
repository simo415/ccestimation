# Confluent Cost Calculator

This is the repository for a simple [Confluent cost calculator](https://simo415.github.io/ccestimation/).

A small React app (Vite) that estimates monthly Confluent costs for Standard, Enterprise and Dedicated clusters based on throughput, average message size, retention and replication.

Quick start:

```sh
cd ConfluentCostCalc
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

Notes:
- Pricing defaults are simplified and for demonstration only. You can override storage $/GB/month in the inputs.
- This is not official Confluent pricing.
 - You can now add multiple topics/use-cases. Each topic has its own throughput, average message size and retention.
 - Replication is fixed to Confluent's default of 3 (no user override). The calculator sums storage and network across topics then applies replication.

Deploying to GitHub Pages
-------------------------

This project is configured to deploy to GitHub Pages for the repository `simo415/ccestimation`.

1. Install dev dependencies (adds `gh-pages`):

```sh
npm install
```

2. Build and deploy:

```sh
npm run deploy
```

This runs `npm run build` and then publishes the `dist/` folder to the `gh-pages` branch using the `gh-pages` package. The Vite `base` has been set to `/ccestimation/` in `vite.config.js` so static assets load correctly when served from GitHub Pages.

If your repository name or GitHub username is different, update the `homepage` field in `package.json` and the `base` value in `vite.config.js` accordingly.
