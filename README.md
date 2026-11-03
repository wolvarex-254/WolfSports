# Wolfsports

**An open-source sports streaming web client powered by the FRAMEX API.**

Wolfsports is a modern, responsive sports platform for exploring football and basketball highlights, full-match replays, fixtures, and match updates.

Built with a clean interface and powered by **FRAMEX**, Wolfsports demonstrates how developers can build sports applications using the FRAMEX API without managing their own sports database or scraping infrastructure.

### Live Platform

- **Live Demo:** https://wolfsports.onrender.com/
- **Powered by FRAMEX:** https://framex.wolvarex.com/
- **Developer Documentation:** https://wolfsports.onrender.com/docs

---

## Features

- Football and basketball content feeds.
- Match highlights and full-match replays.
- Latest matches, fixtures, and match statuses.
- Responsive design optimized for desktop and mobile.
- Two-column video cards on mobile screens.
- MP4 and HLS video playback.
- Secure playback through FRAMEX proxy URLs.
- Automatic recovery from expired stream links.
- Loading, empty, error, and upcoming-match states.
- Built-in developer documentation.
- Domain-restricted FRAMEX API authentication.
- SEO metadata, sitemap, and crawlable routes.

## Powered by FRAMEX API

Wolfsports uses the **FRAMEX API** as its primary source for sports content.

**API Platform:** https://framex.wolvarex.com/

FRAMEX handles sports data aggregation and provides the information needed to display highlights, replays, and match records.

Wolfsports acts as the frontend application, transforming the API responses into an accessible sports viewing experience.

### How It Works

```text
FRAMEX API
    |
    | Sports Aggregate Endpoints
    |
    v
Wolfsports Web Client
    |
    |-- Football
    |-- Basketball
    |-- Highlights
    |-- Full Replays
    |-- Latest Matches
    |
    v
FRAMEX Proxy Playback
    |
    v
Video Player (MP4 / HLS)
```

Wolfsports does not maintain a separate sports database or scrape external sports providers.

### API Endpoints

Football:

```http
GET https://framex.wolvarex.com/api/v1/sports/aggregate?sportType=football
```

Basketball:

```http
GET https://framex.wolvarex.com/api/v1/sports/aggregate?sportType=basketball
```

Requests use the `X-API-Key` header.

The application consumes three primary response fields:

| Field | Description |
|---|---|
| `data.highlightList` | Sports highlights and featured videos |
| `data.replayList` | Full-match replays |
| `data.latestMatchList` | Fixtures and match status information |

## Getting Started

### Requirements

- Node.js 18+
- pnpm
- FRAMEX API key

### Installation

Clone the repository and install dependencies.

```bash
git clone <your-repository-url>
cd wolfsports
pnpm install
```

Create your local environment configuration:

```bash
cp .env.example .env.local
```

Add your FRAMEX API configuration:

```dotenv
VITE_FRAMEX_API_BASE_URL=https://framex.wolvarex.com/api/v1
VITE_FRAMEX_API_KEY=your_domain_restricted_api_key
```

Start the development server:

```bash
pnpm dev
```

The application runs on:

```text
http://localhost:3000
```

Developer documentation is available at `/docs`.

## FRAMEX API Authentication

Wolfsports uses domain-restricted API keys to access FRAMEX.

Because Wolfsports is a browser-based application, its `VITE_` configuration values are included in the frontend bundle.

**Important:** Only use a browser-safe, domain-restricted API key. Never expose administrator credentials or unrestricted API keys.

For the live Render deployment:

```text
https://wolfsports.onrender.com
```

Configure your FRAMEX key to permit the appropriate Render domain according to the FRAMEX domain restriction policy.

Development domains such as localhost should be authorized separately when needed.

Do not commit production credentials, local environment files, signed stream URLs, or API response dumps.

## Video Playback

Wolfsports supports two primary playback formats:

- **MP4:** Standard browser video playback, including HTTP range requests.
- **HLS:** Adaptive streaming through `hls.js`.

The player prioritizes the `proxyUrl` supplied by FRAMEX and falls back to `streamUrl` when necessary.

FRAMEX proxy URLs may be signed and time-limited.

When a stream expires, Wolfsports can request fresh aggregate data to obtain an updated playback URL.

Matches without playable streams are displayed as upcoming rather than presenting broken playback links.

## Local FRAMEX API Testing

When running a local FRAMEX API instance alongside Wolfsports, configure:

```dotenv
VITE_FRAMEX_API_BASE_URL=/framex-api
```

The Vite development server proxies `/framex-api` to the local FRAMEX server on port `8080`.

It also supports local playback relay requests through `/api/v1`.

These proxy settings are intended for development only.

Production deployments should use the public FRAMEX API.

## Production Deployment

Wolfsports can be deployed to static hosting platforms that support Vite applications.

Build the application:

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

The compiled application is generated in the `dist/` directory.

### Deploy on Render

The official live preview is hosted on Render:

**https://wolfsports.onrender.com/**

Create a new Render Static Site and configure:

| Setting | Value |
|---|---|
| Build command | `pnpm install --frozen-lockfile && pnpm build` |
| Publish directory | `dist` |

Environment variables:

```dotenv
VITE_FRAMEX_API_BASE_URL=https://framex.wolvarex.com/api/v1
VITE_FRAMEX_API_KEY=your_domain_restricted_api_key
```

Configure the following rewrite rule:

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

This ensures that client-side routes such as `/docs` continue working when accessed directly.

Keep the sitemap, robots policy, and route manifest publicly accessible.

## Project Structure

```text
wolfsports/
├── src/
│   ├── App.tsx
│   ├── api.ts
│   └── styles.css
├── public/
│   ├── manus-routes.json
│   ├── robots.txt
│   └── sitemap.xml
├── index.html
├── .env.example
└── package.json
```

### Important Routes

| Route | Description |
|---|---|
| `/` | Main sports feed |
| `/docs` | Developer documentation |
| `/manus-routes.json` | Public route manifest |
| `/robots.txt` | Search crawler policy |
| `/sitemap.xml` | Sitemap |

## Open Source

Wolfsports is designed as a standalone, open-source demonstration of what developers can build with the FRAMEX API.

It is independent of the private `Framex-Stream` project and does not copy or depend on its source code.

Developers can explore the application, customize the interface, and use it as a starting point for their own FRAMEX-powered sports experiences.

A suitable open-source license should be added before public distribution.

## Links

- **Wolfsports Live Demo:** https://wolfsports.onrender.com/
- **FRAMEX API Platform:** https://framex.wolvarex.com/
- **Wolfsports Documentation:** https://wolfsports.onrender.com/docs

---

**Wolfsports — Sports powered by FRAMEX.**
