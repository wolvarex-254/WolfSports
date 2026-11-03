import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import {
  AggregateData,
  displayStatus,
  formatDate,
  getAggregate,
  getConfiguredApiKey,
  getConfiguredBaseUrl,
  imageUrl,
  Match,
  streamUrl,
  Sport,
  teamLogo,
  teamName,
  VideoItem,
} from "./api";
import "./styles.css";

type FeedState = { data: AggregateData | null; loading: boolean; error: string };
type Content = "highlights" | "replays" | "matches";

const emptyFeed: FeedState = { data: null, loading: false, error: "" };

function App() {
  const route = window.location.pathname.replace(/\/+$/, "") || "/";
  return route === "/docs" ? <DocsPage /> : <FeedPage />;
}

function FeedPage() {
  const baseUrl = getConfiguredBaseUrl();
  const apiKey = getConfiguredApiKey();
  const [feeds, setFeeds] = useState<Record<Sport, FeedState>>({ football: emptyFeed, basketball: emptyFeed });
  const [sport, setSport] = useState<Sport>("football");
  const [content, setContent] = useState<Content>("highlights");
  const [playing, setPlaying] = useState<{ title: string; url: string; poster?: string } | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const loadFeeds = useCallback(async () => {
    if (!apiKey) {
      setFeeds({ football: emptyFeed, basketball: emptyFeed });
      return;
    }
    const controller = new AbortController();
    setFeeds({ football: { data: null, loading: true, error: "" }, basketball: { data: null, loading: true, error: "" } });
    await Promise.all(((["football", "basketball"] as Sport[]).map(async (item) => {
      try {
        const response = await getAggregate(item, baseUrl, apiKey, controller.signal);
        setFeeds((current) => ({ ...current, [item]: { data: response.data || {}, loading: false, error: "" } }));
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setFeeds((current) => ({ ...current, [item]: { data: null, loading: false, error: (error as Error).message } }));
      }
    })));
    return () => controller.abort();
  }, [apiKey, baseUrl, refreshToken]);

  useEffect(() => {
    void loadFeeds();
  }, [loadFeeds]);

  const feed = feeds[sport];
  const items = useMemo(() => {
    if (content === "highlights") return feed.data?.highlightList || [];
    if (content === "replays") return feed.data?.replayList || [];
    return feed.data?.latestMatchList || [];
  }, [content, feed.data]);
  const totalHighlights = (feeds.football.data?.highlightList?.length || 0) + (feeds.basketball.data?.highlightList?.length || 0);
  const totalReplays = (feeds.football.data?.replayList?.length || 0) + (feeds.basketball.data?.replayList?.length || 0);
  const isConfigured = Boolean(apiKey && baseUrl);

  function openItem(item: VideoItem | Match) {
    const url = streamUrl(item);
    if (!url) return;
    if ("title" in item) {
      setPlaying({ title: item.title || "FRAMEX stream", url, poster: imageUrl(item) });
      return;
    }
    const match = item as Match;
    const title = `${teamName(match.team1 || match.homeTeam)} vs ${teamName(match.team2 || match.awayTeam)}`;
    setPlaying({ title, url, poster: teamLogo(match.team1 || match.homeTeam) });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup"><span className="brand-mark">WS</span><div><strong>Wolfsports</strong><span>Powered by FRAMEX</span></div></div>
        <div className="top-actions"><span className={`connection-pill ${isConfigured ? "connected" : "needs-config"}`}><i />{isConfigured ? "FRAMEX connected" : "FRAMEX docs"}</span><a className="top-docs-link" href="/docs">Docs</a></div>
      </header>

      <main className="content-wrap">
        <section className="hero">
          <div className="hero-visual" aria-hidden="true"><img src="/manus-storage/async-images/Q40uWHNOZhF2PEmvawfrhR/image-1.webp" alt="" /></div>
          <div className="hero-copy"><p className="eyebrow">LIVE SPORTS / FRAMEX API</p><h1>Every match.<br /><em>One clean feed.</em></h1><p className="hero-text">A focused sports front end for highlights, full replays, and match data delivered by your FRAMEX API.</p><div className="hero-actions"><button className="primary-button" onClick={() => { setSport("football"); setContent("highlights"); document.getElementById("feed")?.scrollIntoView({ behavior: "smooth" }); }}>Explore highlights <span>↗</span></button><a className="quiet-button" href="/docs">Docs <span>→</span></a></div></div>
          <div className="hero-score"><div className="score-label">TODAY ON THE FEED</div><div className="score-number">{totalHighlights + totalReplays || "—"}</div><div className="score-caption">highlight & replay items</div><div className="score-divider" /><div className="sport-stat"><span>Football</span><strong>{feeds.football.data?.latestMatchList?.length || 0} matches</strong></div><div className="sport-stat"><span>Basketball</span><strong>{feeds.basketball.data?.latestMatchList?.length || 0} matches</strong></div></div>
        </section>

        <section id="feed" className="feed-section">
          <div className="section-heading"><div><p className="eyebrow">THE DAILY FEED</p><h2>Choose your game.</h2></div><button className="refresh-button" onClick={() => setRefreshToken((value) => value + 1)} disabled={feed.loading}>↻ <span>Refresh</span></button></div>
          <div className="sport-tabs">{(["football", "basketball"] as Sport[]).map((item) => <button key={item} onClick={() => { setSport(item); setContent("highlights"); }} className={sport === item ? "active" : ""}><span className={`sport-dot ${item}`} />{item}<b>{feeds[item].data?.latestMatchList?.length || 0}</b></button>)}</div>
          <div className="content-tabs">{(["highlights", "replays", "matches"] as Content[]).map((item) => <button key={item} className={content === item ? "active" : ""} onClick={() => setContent(item)}>{item === "highlights" ? "Highlights" : item === "replays" ? "Full replays" : "Latest matches"}{content === item && <span />}</button>)}</div>

          {!isConfigured ? <SetupPrompt /> : feed.loading ? <LoadingGrid /> : feed.error ? <ErrorState message={feed.error} onRetry={() => setRefreshToken((value) => value + 1)} /> : items.length === 0 ? <EmptyState content={content} /> : content === "matches" ? <MatchGrid matches={items as Match[]} onPlay={openItem} /> : <VideoGrid items={items as VideoItem[]} content={content} onPlay={openItem} />}
        </section>
      </main>

      <footer className="footer"><span>WOLFSPORTS / OPEN SPORTS CLIENT</span><span>Data and playback URLs are supplied by your FRAMEX instance. <a href="/docs">Read the docs →</a></span></footer>
      {playing && <Player stream={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}

function SetupPrompt() {
  return <div className="state-card setup-state"><div className="state-icon">⌁</div><h3>Configure your FRAMEX client</h3><p>Set the production API base URL and a domain-restricted key in your local environment, then restart Wolfsports.</p><a className="primary-button" href="/docs">Read the docs <span>→</span></a></div>;
}

function LoadingGrid() { return <div className="card-grid">{Array.from({ length: 6 }, (_, index) => <div className="skeleton-card" key={index}><div className="skeleton-image" /><div className="skeleton-line wide" /><div className="skeleton-line" /></div>)}</div>; }
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="state-card error-state"><div className="state-icon">!</div><h3>FRAMEX feed unavailable</h3><p>{message}</p><button className="quiet-button" onClick={onRetry}>Try again</button></div>; }
function EmptyState({ content }: { content: Content }) { return <div className="state-card"><div className="state-icon">○</div><h3>No {content} yet</h3><p>The FRAMEX endpoint returned no items for this view. Try the other sport or refresh when new fixtures are published.</p></div>; }

function VideoGrid({ items, content, onPlay }: { items: VideoItem[]; content: Content; onPlay: (item: VideoItem) => void }) {
  return <div className="card-grid">{items.map((item, index) => <article className="video-card" key={item.id || `${item.title}-${index}`}><div className="media-frame">{imageUrl(item) ? <img src={imageUrl(item)} alt="" loading="lazy" /> : <div className="media-fallback"><span>GN</span></div>}<div className="media-badge">{content === "highlights" ? "HIGHLIGHT" : "REPLAY"}</div>{streamUrl(item) ? <button className="play-button" onClick={() => onPlay(item)} aria-label={`Play ${item.title || "video"}`}>▶</button> : <span className="unavailable-badge">UPCOMING</span>}</div><div className="card-copy"><div className="card-kicker">{item.publishedAt ? formatDate(item.publishedAt) : item.date ? formatDate(item.date) : "FRAMEX SPORTS"}</div><h3>{item.title || "Untitled sports video"}</h3>{item.description && <p>{item.description}</p>}<div className="card-meta"><span>{item.duration ? `${item.duration}` : "On demand"}</span><span>{streamUrl(item) ? "Proxy ready" : "Upcoming"}</span></div></div></article>)}</div>;
}

function MatchGrid({ matches, onPlay }: { matches: Match[]; onPlay: (item: Match) => void }) {
  return <div className="match-list">{matches.map((match, index) => { const home = match.team1 || match.homeTeam; const away = match.team2 || match.awayTeam; return <article className="match-card" key={match.id || index}><div className="match-date">{formatDate(match.matchTime || match.startTime)}<span>{displayStatus(match.status)}</span></div><div className="teams"><div className="team"><TeamLogo team={home} /><strong>{teamName(home)}</strong></div><div className="versus">VS</div><div className="team"><TeamLogo team={away} /><strong>{teamName(away)}</strong></div></div><div className="match-bottom"><span>{match.score ? `${match.score.home ?? "—"} : ${match.score.away ?? "—"}` : "Fixture"}</span>{streamUrl(match) ? <button onClick={() => onPlay(match)}>Watch match →</button> : <span className="muted">Upcoming</span>}</div></article>; })}</div>;
}
function TeamLogo({ team }: { team?: { logo?: { url?: string } | string } }) { const src = teamLogo(team); return src ? <img className="team-logo" src={src} alt="" /> : <span className="team-logo placeholder">•</span>; }

function Player({ stream, onClose }: { stream: { title: string; url: string; poster?: string }; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playerError, setPlayerError] = useState("");
  useEffect(() => { const video = videoRef.current; if (!video) return; let hls: Hls | null = null; setPlayerError(""); if (Hls.isSupported() && stream.url.includes(".m3u8")) { hls = new Hls({ enableWorker: true }); hls.loadSource(stream.url); hls.attachMedia(video); hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) setPlayerError("The FRAMEX proxy could not load this stream. It may have expired or be temporarily unavailable."); }); } else { video.src = stream.url; video.play().catch(() => undefined); } return () => { hls?.destroy(); video.removeAttribute("src"); video.load(); }; }, [stream.url]);
  return <div className="player-backdrop" role="dialog" aria-modal="true" aria-label={stream.title} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="player-modal"><div className="player-head"><div><p className="eyebrow">FRAMEX PROXY PLAYER</p><h2>{stream.title}</h2></div><button className="close-button" onClick={onClose} aria-label="Close player">×</button></div><div className="player-screen">{stream.poster && <img className="player-poster" src={stream.poster} alt="" />}<video ref={videoRef} controls playsInline poster={stream.poster} onError={() => setPlayerError("Playback failed. Check the proxy URL or request a fresh stream from FRAMEX.")} />{playerError && <div className="player-error"><strong>Playback unavailable</strong><span>{playerError}</span></div>}</div><p className="player-note">Playback uses the proxy URL returned by FRAMEX. Signed URLs can expire; reload the item to request a fresh one.</p></div></div>;
}

function DocsPage() {
  useEffect(() => { document.title = "Wolfsports Docs — FRAMEX sports API"; }, []);
  return <div className="docs-shell"><header className="topbar"><a className="brand-lockup brand-link" href="/"><span className="brand-mark">WS</span><div><strong>Wolfsports</strong><span>Powered by FRAMEX</span></div></a><a className="top-docs-link" href="/">Back to feed</a></header><main className="docs-wrap"><p className="eyebrow">WOLFSPORTS / DEVELOPER DOCS</p><h1>Build a sports feed<br /><em>on FRAMEX.</em></h1><p className="docs-lead">Wolfsports is a small open-source client for FRAMEX sports aggregates. Bring your own domain-restricted key, request the feed, and use the returned proxy URLs for playback.</p><section className="docs-section"><span className="docs-index">01</span><div><h2>Configure the client</h2><p>Copy the example environment file and set a production FRAMEX base URL plus a key whose allowed domain includes the site where your client runs.</p><pre><code>{`VITE_FRAMEX_API_BASE_URL=https://framex.wolvarex.com/api/v1\nVITE_FRAMEX_API_KEY=fxk_live_...`}</code></pre></div></section><section className="docs-section"><span className="docs-index">02</span><div><h2>Request the sports aggregate</h2><p>Use the same endpoint for football and basketball. Send the key in the <code>X-API-Key</code> header.</p><pre><code>{`GET /sports/aggregate?sportType=football\nGET /sports/aggregate?sportType=basketball\n\nfetch(url, { headers: { "X-API-Key": key } })`}</code></pre></div></section><section className="docs-section"><span className="docs-index">03</span><div><h2>Render and play</h2><p>Read <code>data.highlightList</code>, <code>data.replayList</code>, and <code>data.latestMatchList</code>. Prefer each item's <code>proxyUrl</code> for playback. Signed URLs can expire, so request a fresh aggregate response when a stream fails.</p><div className="docs-callout"><strong>Security by default</strong><span>Never commit a live key. Configure the allowed root domain in FRAMEX, keep the key server-side where possible, and treat proxy URLs as short-lived media links.</span></div></div></section><a className="primary-button docs-cta" href="/">Open the live feed <span>↗</span></a></main><footer className="footer"><span>WOLFSPORTS / OPEN SPORTS CLIENT</span><span>FRAMEX-powered, provider-agnostic.</span></footer></div>;
}

export default App;
