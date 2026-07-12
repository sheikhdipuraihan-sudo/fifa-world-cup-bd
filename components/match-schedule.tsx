'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { getCountryFlag } from '@/lib/country-flags';

// TheSportsDB free public API (key "123") — FIFA World Cup league id 4429
const SPORTSDB_KEY = '123';
const WORLD_CUP_LEAGUE_ID = '4429';
const NEXT_URL = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/eventsnextleague.php?id=${WORLD_CUP_LEAGUE_ID}`;
const PAST_URL = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/eventspastleague.php?id=${WORLD_CUP_LEAGUE_ID}`;

// Statuses TheSportsDB uses for soccer events that are actually in progress
const LIVE_STATUSES = new Set(['1H', '2H', 'HT', 'ET', 'P', 'BT']);
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN', 'CANC', 'ABD', 'AWD', 'WO']);

interface RawEvent {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strHomeTeamBadge?: string | null;
  strAwayTeamBadge?: string | null;
  dateEvent: string;
  strTime: string | null;
  strTimestamp: string | null;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string | null;
  strGroup?: string | null;
  strVenue?: string | null;
}

type MatchState = 'live' | 'upcoming' | 'finished';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeBadge?: string | null;
  awayBadge?: string | null;
  kickoff: Date | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  state: MatchState;
  group?: string | null;
}

function classify(ev: RawEvent, now: Date): MatchState {
  const status = (ev.strStatus || 'NS').toUpperCase();

  if (LIVE_STATUSES.has(status)) return 'live';
  if (FINISHED_STATUSES.has(status)) return 'finished';

  // Status is NS/TBD/unknown — fall back to comparing kickoff time to now,
  // since the free tier doesn't always update strStatus in real time.
  const kickoff = ev.strTimestamp ? new Date(`${ev.strTimestamp}Z`) : null;
  if (!kickoff || isNaN(kickoff.getTime())) return 'upcoming';

  const msSinceKickoff = now.getTime() - kickoff.getTime();
  const twoAndHalfHours = 2.5 * 60 * 60 * 1000;

  if (msSinceKickoff < 0) return 'upcoming';
  if (msSinceKickoff < twoAndHalfHours) return 'live';
  return 'finished';
}

function toMatch(ev: RawEvent, now: Date): Match {
  return {
    id: ev.idEvent,
    homeTeam: ev.strHomeTeam,
    awayTeam: ev.strAwayTeam,
    homeBadge: ev.strHomeTeamBadge,
    awayBadge: ev.strAwayTeamBadge,
    kickoff: ev.strTimestamp ? new Date(`${ev.strTimestamp}Z`) : null,
    homeScore: ev.intHomeScore !== null ? Number(ev.intHomeScore) : null,
    awayScore: ev.intAwayScore !== null ? Number(ev.intAwayScore) : null,
    status: ev.strStatus || 'NS',
    state: classify(ev, now),
    group: ev.strGroup,
  };
}

function formatDate(d: Date | null) {
  if (!d) return 'TBD';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTime(d: Date | null) {
  if (!d) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function MatchSchedule() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mounted = useRef(true);

  const fetchMatches = useCallback(async () => {
    try {
      const [nextRes, pastRes] = await Promise.all([
        fetch(NEXT_URL),
        fetch(PAST_URL),
      ]);

      if (!nextRes.ok || !pastRes.ok) {
        throw new Error('Failed to reach the World Cup schedule API');
      }

      const [nextData, pastData] = await Promise.all([nextRes.json(), pastRes.json()]);

      const rawEvents: RawEvent[] = [
        ...(nextData?.events ?? []),
        ...(pastData?.events ?? []),
      ];

      // Dedupe by event id (an event can show up in both calls near kickoff time)
      const byId = new Map<string, RawEvent>();
      for (const ev of rawEvents) {
        if (ev && ev.idEvent) byId.set(ev.idEvent, ev);
      }

      const now = new Date();
      const classified = Array.from(byId.values()).map((ev) => toMatch(ev, now));

      if (mounted.current) {
        setMatches(classified);
        setError(null);
        setLastUpdated(now);
      }
    } catch (err) {
      if (mounted.current) {
        setError('Could not load live match data right now.');
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    fetchMatches();

    // Re-fetch from the API periodically to pick up new scores/status
    const fetchInterval = setInterval(fetchMatches, 60_000);
    // Re-classify locally every 30s too, so a match flips from "upcoming"
    // to "live" (and eventually "finished") even between API refreshes.
    const tickInterval = setInterval(() => {
      setMatches((prev) => {
        const now = new Date();
        return prev.map((m) => ({
          ...m,
          state:
            m.state === 'finished'
              ? 'finished'
              : classify(
                  {
                    idEvent: m.id,
                    strEvent: '',
                    strHomeTeam: m.homeTeam,
                    strAwayTeam: m.awayTeam,
                    dateEvent: '',
                    strTime: null,
                    strTimestamp: m.kickoff ? m.kickoff.toISOString().replace('Z', '') : null,
                    intHomeScore: m.homeScore !== null ? String(m.homeScore) : null,
                    intAwayScore: m.awayScore !== null ? String(m.awayScore) : null,
                    strStatus: m.status,
                  },
                  now
                ),
        }));
      });
    }, 30_000);

    return () => {
      mounted.current = false;
      clearInterval(fetchInterval);
      clearInterval(tickInterval);
    };
  }, [fetchMatches]);

  const liveMatches = matches
    .filter((m) => m.state === 'live')
    .sort((a, b) => (a.kickoff?.getTime() ?? 0) - (b.kickoff?.getTime() ?? 0));

  const upcomingMatches = matches
    .filter((m) => m.state === 'upcoming')
    .sort((a, b) => (a.kickoff?.getTime() ?? 0) - (b.kickoff?.getTime() ?? 0))
    .slice(0, 8);

  return (
    <div className="bg-card rounded-lg p-5 sticky top-20 border border-border">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-foreground">Matches</h2>
        {lastUpdated && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <RefreshCw className="w-3 h-3" />
            {formatTime(lastUpdated)}
          </span>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-background rounded p-3 animate-pulse">
              <div className="h-2 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-2 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-muted rounded w-2/3"></div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && matches.length === 0 && (
        <p className="text-xs text-muted-foreground">{error}</p>
      )}

      {!loading && !error && liveMatches.length === 0 && upcomingMatches.length === 0 && (
        <p className="text-xs text-muted-foreground">No matches scheduled right now. Check back soon!</p>
      )}

      {!loading && liveMatches.length > 0 && (
        <div className="space-y-3 mb-5">
          <p className="text-[10px] font-semibold tracking-wide text-red-500 uppercase">● Live now</p>
          {liveMatches.map((match) => (
            <div
              key={match.id}
              className="bg-background rounded p-3 border-2 border-red-500/60 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="flex items-center gap-1.5 text-red-500 font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  LIVE
                </span>
                <span className="text-muted-foreground">{match.status}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-base">{getCountryFlag(match.homeTeam)}</span>
                  <p className="text-xs font-medium text-foreground truncate">{match.homeTeam}</p>
                </div>
                <span className="text-sm font-bold text-foreground shrink-0">
                  {match.homeScore ?? 0} - {match.awayScore ?? 0}
                </span>
                <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                  <p className="text-xs font-medium text-foreground truncate text-right">{match.awayTeam}</p>
                  <span className="text-base">{getCountryFlag(match.awayTeam)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && upcomingMatches.length > 0 && (
        <div className="space-y-3">
          {liveMatches.length > 0 && (
            <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Upcoming</p>
          )}
          {upcomingMatches.map((match) => (
            <div
              key={match.id}
              className="bg-background rounded p-3 border border-border hover:border-foreground/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                <span>{formatDate(match.kickoff)}{match.group ? ` · ${match.group}` : ''}</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(match.kickoff)}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{getCountryFlag(match.homeTeam)}</span>
                  <p className="text-xs font-medium text-foreground truncate flex-1">{match.homeTeam}</p>
                </div>
                <div className="text-center">
                  <span className="text-xs text-muted-foreground font-medium">vs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{getCountryFlag(match.awayTeam)}</span>
                  <p className="text-xs font-medium text-foreground truncate flex-1">{match.awayTeam}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-gradient-to-br from-accent/10 to-secondary/10 rounded-lg border border-accent/20">
        <p className="text-xs text-foreground font-medium mb-2">💡 Pro Tip</p>
        <p className="text-xs text-muted-foreground">
          Switch channels to find the best commentators and enjoy the match!
        </p>
      </div>
    </div>
  );
}
