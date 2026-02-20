// src/config/cache.config.ts
// All cache durations in one place — edit here to tune caching behaviour.
// staleTime: how long cached data is considered fresh (no refetch while fresh)
// gcTime:    how long inactive cache entries stay in memory before being discarded

const MINUTE = 60 * 1000;
const HOUR   = 60 * MINUTE;

export const CACHE_CONFIG = {
  // ── QueryClient defaults ────────────────────────────────────────────────────
  // Applied to any query that does not override staleTime / gcTime explicitly.
  DEFAULT_STALE_TIME:    5 * MINUTE,   // 5 min
  DEFAULT_GC_TIME:      10 * MINUTE,   // 10 min

  // ── Per-query stale times ───────────────────────────────────────────────────
  NEARBY_RESTAURANTS:   10 * MINUTE,   // location-sensitive, refresh often
  FEATURED_RESTAURANTS:  4 * HOUR,     // curated list, changes rarely
  TOP_RESTAURANTS:       HOUR,     // leaderboard updated weekly
  CUISINES:              HOUR,     // extremely stable
  RESTAURANT_DETAIL:    24 * HOUR,     // name / address / images very stable

  // ── Location name (Nominatim reverse-geocode) ───────────────────────────────
  // Only re-geocode when the device has moved more than this many degrees.
  // 0.005 degrees ≈ 550 m
  GEOCODE_THRESHOLD_DEGREES: 0.005,
};
