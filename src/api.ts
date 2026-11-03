export type Sport = "football" | "basketball";

export interface VideoItem {
  id?: string | number;
  title?: string;
  description?: string;
  duration?: string | number;
  date?: string;
  publishedAt?: string;
  proxyUrl?: string;
  streamUrl?: string;
  url?: string;
  cover?: { url?: string } | string;
  thumbnail?: string;
  status?: string;
}

export interface MatchTeam {
  name?: string;
  logo?: { url?: string } | string;
}

export interface Match {
  id?: string | number;
  team1?: MatchTeam;
  team2?: MatchTeam;
  homeTeam?: MatchTeam;
  awayTeam?: MatchTeam;
  status?: string;
  matchTime?: string | number;
  startTime?: string | number;
  score?: { home?: number | string; away?: number | string };
  streamUrl?: string;
  proxyUrl?: string;
}

export interface AggregateData {
  highlightList?: VideoItem[];
  replayList?: VideoItem[];
  latestMatchList?: Match[];
}

export interface AggregateResponse {
  data?: AggregateData;
  message?: string;
  code?: number;
}

const DEFAULT_BASE_URL = "https://framex.wolvarex.com/api/v1";

export function getConfiguredBaseUrl() {
  return (import.meta.env.VITE_FRAMEX_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

export function getConfiguredApiKey() {
  return (import.meta.env.VITE_FRAMEX_API_KEY || localStorage.getItem("wolfsports.framexApiKey") || localStorage.getItem("goalnivo.framexApiKey") || "").trim();
}

export async function getAggregate(sport: Sport, baseUrl: string, apiKey: string, signal?: AbortSignal) {
  const url = `${baseUrl.replace(/\/$/, "")}/sports/aggregate?sportType=${encodeURIComponent(sport)}`;
  const response = await fetch(url, {
    signal,
    headers: {
      Accept: "application/json",
      ...(apiKey ? { "X-API-Key": apiKey } : {}),
    },
  });
  const body = (await response.json().catch(() => ({}))) as AggregateResponse | { error?: string };
  if (!response.ok) {
    throw new Error("error" in body && body.error ? body.error : `FRAMEX returned HTTP ${response.status}`);
  }
  return body as AggregateResponse;
}

export function imageUrl(item: VideoItem) {
  if (typeof item.cover === "string") return item.cover;
  return item.cover?.url || item.thumbnail || "";
}

export function streamUrl(item: VideoItem | Match) {
  const value = item.proxyUrl || item.streamUrl || ("url" in item ? item.url : "") || "";
  return value.replace(/\/api\/v1\/api\/v1\//g, "/api/v1/");
}

export function teamName(team?: MatchTeam) {
  return team?.name || "TBD";
}

export function teamLogo(team?: MatchTeam) {
  return typeof team?.logo === "string" ? team.logo : team?.logo?.url || "";
}

export function formatDate(value?: string | number) {
  if (!value) return "Date not listed";
  const numeric = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  const date = new Date(numeric);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function displayStatus(value?: string) {
  const normalized = (value || "Scheduled").toUpperCase().replace(/[\s_-]+/g, "");
  if (normalized.includes("LIVE")) return "Live now";
  if (normalized.includes("END") || normalized.includes("FINISH")) return "Final";
  if (normalized.includes("NOTSTART") || normalized === "SCHEDULED") return "Scheduled";
  return value ? value.toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase()) : "Scheduled";
}
