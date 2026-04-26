import type {
  ApiUnit,
  ApiWave,
  ApiLegion,
  ApiAbility,
  ApiMatch,
  ApiPlayer,
  Unit,
  Wave,
  Legion,
  Ability,
  Match,
  Player,
} from './types.js';
import {
  parseApiUnit,
  parseApiWave,
  parseApiLegion,
  parseApiAbility,
  parseApiMatch,
  parseApiPlayer,
} from './types.js';

export class Ltd2ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'Ltd2ApiError';
  }
}

// Token bucket rate limiter: 5 req/sec refill, 100 burst capacity.
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly capacity: number,
    private readonly refillPerMs: number,
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  // Returns ms to wait (0 = proceed immediately). Throws Ltd2ApiError(429)
  // if the required wait exceeds maxWaitMs.
  acquire(maxWaitMs: number): number {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerMs);
    this.lastRefill = now;

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return 0;
    }

    const waitMs = Math.ceil((1 - this.tokens) / this.refillPerMs);
    if (waitMs > maxWaitMs) {
      throw new Ltd2ApiError(
        429,
        `Rate limit exceeded: request would wait ${Math.ceil(waitMs / 1_000)}s (max ${Math.ceil(maxWaitMs / 1_000)}s allowed)`,
      );
    }
    this.tokens = 0;
    return waitMs;
  }
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

export interface Ltd2ClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxRateWaitMs?: number;
  rateLimiter?: TokenBucket;
}

const DEFAULT_BASE_URL = 'https://apiv2.legiontd2.com';
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RATE_WAIT_MS = 5_000;
const TTL_24H_MS = 24 * 60 * 60 * 1_000;

const RETRY_DELAY_MS = [1_000, 2_000, 4_000] as const;
const MAX_ATTEMPTS = RETRY_DELAY_MS.length + 1;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class Ltd2Client {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRateWaitMs: number;
  private readonly rateLimiter: TokenBucket;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly cache = new Map<string, CacheEntry<any>>();

  constructor({
    apiKey,
    baseUrl = DEFAULT_BASE_URL,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxRateWaitMs = DEFAULT_MAX_RATE_WAIT_MS,
    rateLimiter,
  }: Ltd2ClientOptions) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
    this.maxRateWaitMs = maxRateWaitMs;
    this.rateLimiter = rateLimiter ?? new TokenBucket(100, 5 / 1_000);
  }

  private getCached<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  private setCached<T>(key: string, value: T, ttlMs: number | null): void {
    this.cache.set(key, {
      value,
      expiresAt: ttlMs === null ? null : Date.now() + ttlMs,
    });
  }

  private async fetchWithRetry<T>(path: string): Promise<T> {
    const waitMs = this.rateLimiter.acquire(this.maxRateWaitMs);
    if (waitMs > 0) await sleep(waitMs);

    const url = `${this.baseUrl}${path}`;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, {
          headers: { 'x-api-key': this.apiKey },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.status === 429) {
          if (attempt >= MAX_ATTEMPTS - 1) {
            throw new Ltd2ApiError(429, 'Rate limited by server — no retries remaining');
          }
          const retryAfter = response.headers.get('Retry-After');
          const delayMs = retryAfter
            ? Math.ceil(parseFloat(retryAfter)) * 1_000
            : (RETRY_DELAY_MS[attempt] ?? 4_000);
          await sleep(delayMs);
          continue;
        }

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          throw new Ltd2ApiError(response.status, `HTTP ${response.status}: ${body}`);
        }

        return response.json() as Promise<T>;
      } catch (err) {
        clearTimeout(timeoutId);

        if (err instanceof Ltd2ApiError) throw err;

        if (err instanceof Error && err.name === 'AbortError') {
          throw new Ltd2ApiError(0, `Request timed out after ${this.timeoutMs}ms`);
        }

        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt < MAX_ATTEMPTS - 1) {
          await sleep(RETRY_DELAY_MS[attempt] ?? 1_000);
        }
      }
    }

    throw lastError ?? new Ltd2ApiError(0, 'Request failed after retries');
  }

  // ── Units ─────────────────────────────────────────────────────────────────

  async getUnitById(id: string): Promise<Unit> {
    const cacheKey = `unit:${id}`;
    const cached = this.getCached<Unit>(cacheKey);
    if (cached) return cached;
    const data = await this.fetchWithRetry<ApiUnit>(`/units/byId/${encodeURIComponent(id)}`);
    const unit = parseApiUnit(data);
    this.setCached(cacheKey, unit, TTL_24H_MS);
    return unit;
  }

  async getUnitByName(name: string): Promise<Unit> {
    const cacheKey = `unit:name:${name}`;
    const cached = this.getCached<Unit>(cacheKey);
    if (cached) return cached;
    const data = await this.fetchWithRetry<ApiUnit>(`/units/byName/${encodeURIComponent(name)}`);
    const unit = parseApiUnit(data);
    this.setCached(cacheKey, unit, TTL_24H_MS);
    return unit;
  }

  async getUnitsByVersion(version: string, offset = 0, limit = 50): Promise<Unit[]> {
    const cacheKey = `units:version:${version}:${offset}:${limit}`;
    const cached = this.getCached<Unit[]>(cacheKey);
    if (cached) return cached;
    const data = await this.fetchWithRetry<ApiUnit[]>(
      `/units/byVersion/${encodeURIComponent(version)}?offset=${offset}&limit=${limit}`,
    );
    const units = data.map(parseApiUnit);
    this.setCached(cacheKey, units, TTL_24H_MS);
    return units;
  }

  // ── Waves ─────────────────────────────────────────────────────────────────

  async getWaves(offset = 0, limit = 22): Promise<Wave[]> {
    const cacheKey = `waves:${offset}:${limit}`;
    const cached = this.getCached<Wave[]>(cacheKey);
    if (cached) return cached;
    const data = await this.fetchWithRetry<ApiWave[]>(`/info/waves/${offset}/${limit}`);
    const waves = data.map(parseApiWave);
    this.setCached(cacheKey, waves, TTL_24H_MS);
    return waves;
  }

  async getWaveById(id: string): Promise<Wave> {
    const cacheKey = `wave:${id}`;
    const cached = this.getCached<Wave>(cacheKey);
    if (cached) return cached;
    const data = await this.fetchWithRetry<ApiWave>(`/info/waves/byId/${encodeURIComponent(id)}`);
    const wave = parseApiWave(data);
    this.setCached(cacheKey, wave, TTL_24H_MS);
    return wave;
  }

  // ── Legions ───────────────────────────────────────────────────────────────

  async getLegions(offset = 0, limit = 20): Promise<Legion[]> {
    const cacheKey = `legions:${offset}:${limit}`;
    const cached = this.getCached<Legion[]>(cacheKey);
    if (cached) return cached;
    const data = await this.fetchWithRetry<ApiLegion[]>(`/info/legions/${offset}/${limit}`);
    const legions = data.map(parseApiLegion);
    this.setCached(cacheKey, legions, TTL_24H_MS);
    return legions;
  }

  async getLegionById(id: string): Promise<Legion> {
    const cacheKey = `legion:${id}`;
    const cached = this.getCached<Legion>(cacheKey);
    if (cached) return cached;
    const data = await this.fetchWithRetry<ApiLegion>(
      `/info/legions/byId/${encodeURIComponent(id)}`,
    );
    const legion = parseApiLegion(data);
    this.setCached(cacheKey, legion, TTL_24H_MS);
    return legion;
  }

  // ── Abilities ─────────────────────────────────────────────────────────────

  async getAbilities(offset = 0, limit = 50): Promise<Ability[]> {
    const cacheKey = `abilities:${offset}:${limit}`;
    const cached = this.getCached<Ability[]>(cacheKey);
    if (cached) return cached;
    const data = await this.fetchWithRetry<ApiAbility[]>(`/info/abilities/${offset}/${limit}`);
    const abilities = data.map(parseApiAbility);
    this.setCached(cacheKey, abilities, TTL_24H_MS);
    return abilities;
  }

  // ── Games ─────────────────────────────────────────────────────────────────

  async getMatch(id: string): Promise<Match> {
    const cacheKey = `match:${id}`;
    const cached = this.getCached<Match>(cacheKey);
    if (cached) return cached;
    const data = await this.fetchWithRetry<ApiMatch>(`/games/byId/${encodeURIComponent(id)}`);
    const match = parseApiMatch(data);
    this.setCached(cacheKey, match, null);
    return match;
  }

  // ── Players ───────────────────────────────────────────────────────────────

  async getPlayerById(id: string): Promise<Player> {
    return parseApiPlayer(
      await this.fetchWithRetry<ApiPlayer>(`/players/byId/${encodeURIComponent(id)}`),
    );
  }

  async getPlayerByName(name: string): Promise<Player> {
    return parseApiPlayer(
      await this.fetchWithRetry<ApiPlayer>(`/players/byName/${encodeURIComponent(name)}`),
    );
  }

  async getPlayerMatches(id: string, limit = 10): Promise<Match[]> {
    const data = await this.fetchWithRetry<ApiMatch[]>(
      `/players/matchHistory/${encodeURIComponent(id)}?limit=${limit}`,
    );
    return data.map(parseApiMatch);
  }
}
