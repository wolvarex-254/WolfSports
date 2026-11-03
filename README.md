# Wolfsports

Wolfsports is a focused, responsive sports web client powered by the FRAMEX API. It presents football and basketball highlights, full replays, fixtures, and FRAMEX proxy playback in a clean open-source interface.

This repository is a standalone consumer application. It is intentionally separate from the private `Framex-Stream` repository and does not copy, modify, deploy, or depend on its source.

## Features

- Football and basketball aggregate feeds.
- Highlight, full-replay, and latest-match views.
- Responsive two-column video cards on phone screens.
- FRAMEX proxy playback with MP4 range support and HLS support through `hls.js`.
- Clear loading, empty, API-error, expired-stream, and upcoming-match states.
- Public developer documentation at `/docs`.
- Domain-restricted FRAMEX API-key usage through the `X-API-Key` header.
- SEO metadata, crawlable route manifest, robots policy, and sitemap.

## How the data flows

Wolfsports does not scrape sports providers and does not contain a separate sports database. The browser requests the FRAMEX aggregate endpoint:

```text
GET https://framex.wolvarex.com/api/v1/sports/aggregate?sportType=football
GET https://framex.wolvarex.com/api/v1/sports/aggregate?sportType=basketball
```

Each request sends the configured key as `X-API-Key`. The interface reads these response fields:

- `data.highlightList` — short-form or featured sports videos.
- `data.replayList` — full-match replays.
- `data.latestMatchList` — fixtures and match status records.

For playback, Wolfsports prefers the `proxyUrl` returned by FRAMEX and falls back to `streamUrl` when necessary. Signed proxy URLs can expire, so the client requests a fresh aggregate response when a link becomes invalid.

## Local development

Requirements: Node.js 18 or newer and pnpm.

```bash
pnpm install
cp .env.example .env.local
```

Set the browser-safe configuration in `.env.local`:

```dotenv
VITE_FRAMEX_API_BASE_URL=https://framex.wolvarex.com/api/v1
VITE_FRAMEX_API_KEY=fxk_live_your_domain_restricted_key
```

Start the development server:

```bash
pnpm dev
```

The Vite server listens on port `3000` by default. Open `/` for the feed or `/docs` for the developer guide.

### Local FRAMEX API testing

When testing against a FRAMEX API running on the same Manus sandbox, use:

```dotenv
VITE_FRAMEX_API_BASE_URL=/framex-api
```

The development Vite configuration proxies `/framex-api` to a local FRAMEX server on port `8080` and proxies `/api/v1` for local playback relay requests. This behavior is development-only. Production Wolfsports deployments should use the public FRAMEX URL.

## API-key security

Wolfsports is a browser client, so a `VITE_` key is included in the browser bundle and must be treated as public application configuration. Do not use an administrator credential or an unrestricted key.

Create a FRAMEX key restricted to the root domain that serves Wolfsports. For example, a key intended for `sports.example.com` should allow `example.com` according to the FRAMEX domain policy. Add preview or localhost domains separately for development testing. FRAMEX validates the request origin and rejects keys used from unapproved domains.

Never commit `.env.local`, production keys, signed stream URLs, or copied response dumps. The repository ignores local environment files by default.

## Playback notes

The FRAMEX proxy is the playback boundary. Wolfsports does not expose the upstream provider URL as its primary player source. The player supports normal MP4 playback and HLS streams through `hls.js` when the URL ends in `.m3u8`.

A signed URL may expire between listing and playback. The expected recovery is:

1. Close or reload the failed player.
2. Request the aggregate endpoint again.
3. Use the newly returned `proxyUrl`.
4. Respect HTTP range responses such as `206 Partial Content` for seeking and resume behavior.

A match without a playable URL is presented as **Upcoming**, not as a broken provider link.

## Production build

```bash
pnpm build
pnpm preview
```

The build output is written to `dist/`. For a static host, serve `dist/` with SPA fallback enabled so `/docs` resolves to `index.html`. Keep `/manus-routes.json`, `robots.txt`, and `sitemap.xml` publicly readable.

### Render static-site settings

Create a Render **Static Site** from this repository with:

```text
Build command: pnpm install --frozen-lockfile && pnpm build
Publish directory: dist
```

Add these environment variables in Render, using a key restricted to the Render hostname:

```text
VITE_FRAMEX_API_BASE_URL=https://framex.wolvarex.com/api/v1
VITE_FRAMEX_API_KEY=fxk_live_your_domain_restricted_key
```

Add a rewrite rule so the public docs route and any future client-side routes work on refresh:

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

## Project structure

```text
src/
  App.tsx       Feed UI, docs route, card views, and player modal
  api.ts        FRAMEX request client, response types, and URL/status helpers
  styles.css    Responsive Wolfsports visual system
public/
  manus-routes.json
  robots.txt
  sitemap.xml
index.html      Crawlable metadata shell
.env.example    Safe configuration template
```

## Useful routes

- `/` — Wolfsports sports feed.
- `/docs` — public FRAMEX integration documentation.
- `/manus-routes.json` — crawlable route manifest.

## License and separation

Add the license that matches your intended open-source distribution before publishing the new repository. Wolfsports is an independent FRAMEX API consumer; keep it separate from `Framex-Stream` and do not copy private provider adapters or source code into this project.
