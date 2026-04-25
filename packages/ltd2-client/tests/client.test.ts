import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Ltd2Client, Ltd2ApiError, TokenBucket } from '../src/client.js';
import { parseApiUnit, parseApiWave, parseApiLegion } from '../src/types.js';
import type { ApiUnit, ApiWave, ApiLegion } from '../src/types.js';
import crabFixture from './__fixtures__/unit-crab.json';
import wavesFixture from './__fixtures__/waves.json';
import legionsFixture from './__fixtures__/legions.json';

const TEST_API_KEY = 'test-key-123';
const BASE_URL = 'https://apiv2.legiontd2.com';

function makeResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

function makeClient(overrides?: Partial<ConstructorParameters<typeof Ltd2Client>[0]>) {
  return new Ltd2Client({ apiKey: TEST_API_KEY, baseUrl: BASE_URL, ...overrides });
}

// Inject a single-token bucket so rate-limit tests don't require 100+ calls.
function makeRateLimitedClient(maxRateWaitMs: number) {
  return makeClient({
    maxRateWaitMs,
    rateLimiter: new TokenBucket(1, 5 / 1_000),
  });
}

describe('Ltd2Client', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ── authentication ────────────────────────────────────────────────────────

  it('sends x-api-key header on every request', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse(crabFixture));
    await makeClient().getUnitById('crab_unit_id');
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/units/byId/crab_unit_id`,
      expect.objectContaining({ headers: { 'x-api-key': TEST_API_KEY } }),
    );
  });

  // ── parseApiUnit ──────────────────────────────────────────────────────────

  describe('parseApiUnit()', () => {
    it('converts numeric strings to numbers', () => {
      const unit = parseApiUnit(crabFixture as ApiUnit);
      expect(unit.hp).toBe(120);
      expect(unit.dps).toBe(5.22);
      expect(unit.moveSpeed).toBe(300);
      expect(unit.attackSpeed).toBe(1.15);
      expect(unit.avgHp).toBe(7320.2);
      expect(unit.avgCost).toBe(9.65);
    });

    it('converts empty string to null', () => {
      const unit = parseApiUnit(crabFixture as ApiUnit);
      expect(unit.goldCost).toBeNull();
      expect(unit.mythiumCost).toBeNull();
      expect(unit.totalValue).toBeNull();
      expect(unit.incomeBonus).toBeNull();
    });

    it('maps _id to id', () => {
      const unit = parseApiUnit(crabFixture as ApiUnit);
      expect(unit.id).toBe('68caa7f486308ea2b130b1a3');
    });

    it('preserves isEnabled boolean', () => {
      const unit = parseApiUnit(crabFixture as ApiUnit);
      expect(unit.isEnabled).toBe(true);
    });

    it('preserves abilities array', () => {
      const unit = parseApiUnit(crabFixture as ApiUnit);
      expect(unit.abilities).toEqual([]);
    });
  });

  // ── parseApiWave ──────────────────────────────────────────────────────────

  describe('parseApiWave()', () => {
    it('converts levelNum and amount strings to numbers', () => {
      const wave = parseApiWave(wavesFixture[1] as ApiWave);
      expect(wave.levelNum).toBe(1);
      expect(wave.amount).toBe(12);
      expect(wave.totalReward).toBe(72);
    });

    it('parses optional amount2 when present', () => {
      const wave = parseApiWave(wavesFixture[2] as ApiWave);
      expect(wave.amount2).toBe(1);
      expect(wave.spellUnit2Id).toBe('scorpion_king_unit_id');
    });

    it('sets amount2 and spellUnit2Id to null when absent', () => {
      const wave = parseApiWave(wavesFixture[1] as ApiWave);
      expect(wave.amount2).toBeNull();
      expect(wave.spellUnit2Id).toBeNull();
    });

    it('maps _id to id', () => {
      const wave = parseApiWave(wavesFixture[1] as ApiWave);
      expect(wave.id).toBe('level1_wave_id');
    });
  });

  // ── parseApiLegion ────────────────────────────────────────────────────────

  describe('parseApiLegion()', () => {
    it('preserves playable boolean', () => {
      const playable = parseApiLegion(legionsFixture[0] as ApiLegion);
      const creature = parseApiLegion(legionsFixture[1] as ApiLegion);
      expect(playable.playable).toBe(true);
      expect(creature.playable).toBe(false);
    });

    it('maps _id to id', () => {
      const legion = parseApiLegion(legionsFixture[0] as ApiLegion);
      expect(legion.id).toBe('element_legion_id');
    });
  });

  // ── getUnitById ───────────────────────────────────────────────────────────

  describe('getUnitById()', () => {
    it('hits /units/byId/{id} and returns parsed unit', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse(crabFixture));
      const unit = await makeClient().getUnitById('crab_unit_id');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/units/byId/crab_unit_id`,
        expect.anything(),
      );
      expect(unit.name).toBe('Crab');
      expect(unit.hp).toBe(120);
    });

    it('caches result for 24 h', async () => {
      fetchMock.mockResolvedValue(makeResponse(crabFixture));
      const client = makeClient();
      await client.getUnitById('crab_unit_id');
      await client.getUnitById('crab_unit_id');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('fetches again after 24 h cache expiry', async () => {
      vi.useFakeTimers();
      fetchMock.mockResolvedValue(makeResponse(crabFixture));
      const client = makeClient();
      await client.getUnitById('crab_unit_id');
      vi.advanceTimersByTime(25 * 60 * 60 * 1_000);
      await client.getUnitById('crab_unit_id');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('URL-encodes the id', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse(crabFixture));
      await makeClient().getUnitById('unit/with spaces');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/units/byId/unit%2Fwith%20spaces`,
        expect.anything(),
      );
    });
  });

  // ── getUnitByName ─────────────────────────────────────────────────────────

  it('getUnitByName() hits /units/byName/{name}', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse(crabFixture));
    const unit = await makeClient().getUnitByName('Crab');
    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/units/byName/Crab`, expect.anything());
    expect(unit.name).toBe('Crab');
  });

  // ── getUnitsByVersion ─────────────────────────────────────────────────────

  describe('getUnitsByVersion()', () => {
    it('hits /units/byVersion/{version} and returns array', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse([crabFixture]));
      const units = await makeClient().getUnitsByVersion('v12.08.1.hf1');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/units/byVersion/v12.08.1.hf1`,
        expect.anything(),
      );
      expect(units).toHaveLength(1);
      expect(units[0]?.name).toBe('Crab');
    });

    it('caches bulk result for 24 h', async () => {
      fetchMock.mockResolvedValue(makeResponse([crabFixture]));
      const client = makeClient();
      await client.getUnitsByVersion('v12.08.1.hf1');
      await client.getUnitsByVersion('v12.08.1.hf1');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  // ── getWaves ──────────────────────────────────────────────────────────────

  describe('getWaves()', () => {
    it('defaults to /info/waves/0/22', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse(wavesFixture));
      await makeClient().getWaves();
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/info/waves/0/22`, expect.anything());
    });

    it('accepts custom offset and limit', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse(wavesFixture));
      await makeClient().getWaves(5, 10);
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/info/waves/5/10`, expect.anything());
    });

    it('returns parsed waves array', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse(wavesFixture));
      const waves = await makeClient().getWaves();
      expect(waves).toHaveLength(3);
      expect(waves[1]?.levelNum).toBe(1);
      expect(waves[2]?.spellUnit2Id).toBe('scorpion_king_unit_id');
    });

    it('caches waves for 24 h', async () => {
      fetchMock.mockResolvedValue(makeResponse(wavesFixture));
      const client = makeClient();
      await client.getWaves();
      await client.getWaves();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  // ── getWaveById ───────────────────────────────────────────────────────────

  it('getWaveById() hits /info/waves/byId/{id}', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse(wavesFixture[1]));
    const wave = await makeClient().getWaveById('level1_wave_id');
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/info/waves/byId/level1_wave_id`,
      expect.anything(),
    );
    expect(wave.name).toBe('Crabs');
  });

  // ── getLegions ────────────────────────────────────────────────────────────

  describe('getLegions()', () => {
    it('defaults to /info/legions/0/20', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse(legionsFixture));
      await makeClient().getLegions();
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/info/legions/0/20`, expect.anything());
    });

    it('returns parsed legions array', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse(legionsFixture));
      const legions = await makeClient().getLegions();
      expect(legions).toHaveLength(3);
      expect(legions[0]?.name).toBe('Element');
      expect(legions[0]?.playable).toBe(true);
      expect(legions[1]?.playable).toBe(false);
    });

    it('caches legions for 24 h', async () => {
      fetchMock.mockResolvedValue(makeResponse(legionsFixture));
      const client = makeClient();
      await client.getLegions();
      await client.getLegions();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  // ── getLegionById ─────────────────────────────────────────────────────────

  it('getLegionById() hits /info/legions/byId/{id}', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse(legionsFixture[0]));
    const legion = await makeClient().getLegionById('element_legion_id');
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/info/legions/byId/element_legion_id`,
      expect.anything(),
    );
    expect(legion.name).toBe('Element');
  });

  // ── getAbilities ──────────────────────────────────────────────────────────

  it('getAbilities() defaults to /info/abilities/0/50', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse([]));
    await makeClient().getAbilities();
    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/info/abilities/0/50`, expect.anything());
  });

  it('getAbilities() accepts custom offset and limit', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse([]));
    await makeClient().getAbilities(10, 25);
    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/info/abilities/10/25`, expect.anything());
  });

  // ── getMatch ──────────────────────────────────────────────────────────────

  describe('getMatch()', () => {
    const matchFixture = {
      _id: 'game-abc123',
      date: '2024-01-01T00:00:00Z',
      queueType: 'Normal',
      gameLength: 900,
      endingWave: 15,
      leftTeam: [],
      rightTeam: [],
    };

    it('hits /games/byId/{id} and returns parsed match', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse(matchFixture));
      const match = await makeClient().getMatch('game-abc123');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/games/byId/game-abc123`,
        expect.anything(),
      );
      expect(match.id).toBe('game-abc123');
      expect(match.endingWave).toBe(15);
    });

    it('URL-encodes the match id', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse(matchFixture));
      await makeClient().getMatch('abc/def');
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/games/byId/abc%2Fdef`, expect.anything());
    });

    it('caches match forever (no expiry)', async () => {
      vi.useFakeTimers();
      fetchMock.mockResolvedValueOnce(makeResponse(matchFixture));
      const client = makeClient();
      await client.getMatch('game-abc123');
      vi.advanceTimersByTime(365 * 24 * 60 * 60 * 1_000);
      await client.getMatch('game-abc123');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  // ── getPlayerById ─────────────────────────────────────────────────────────

  it('getPlayerById() hits /players/byId/{id}', async () => {
    const playerFixture = {
      _id: 'player-xyz',
      playerName: 'TestPlayer',
      overallElo: 1800,
      gamesPlayed: 200,
      winRate: 0.55,
    };
    fetchMock.mockResolvedValueOnce(makeResponse(playerFixture));
    const player = await makeClient().getPlayerById('player-xyz');
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/players/byId/player-xyz`,
      expect.anything(),
    );
    expect(player.playerName).toBe('TestPlayer');
    expect(player.overallElo).toBe(1800);
  });

  // ── getPlayerByName ───────────────────────────────────────────────────────

  it('getPlayerByName() hits /players/byName/{name}', async () => {
    const playerFixture = {
      _id: 'player-xyz',
      playerName: 'TestPlayer',
    };
    fetchMock.mockResolvedValueOnce(makeResponse(playerFixture));
    await makeClient().getPlayerByName('TestPlayer');
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/players/byName/TestPlayer`,
      expect.anything(),
    );
  });

  // ── getPlayerMatches ──────────────────────────────────────────────────────

  describe('getPlayerMatches()', () => {
    it('hits /players/matchHistory/{id} with limit', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse([]));
      await makeClient().getPlayerMatches('player-xyz', 25);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/players/matchHistory/player-xyz?limit=25`,
        expect.anything(),
      );
    });

    it('defaults limit to 10', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse([]));
      await makeClient().getPlayerMatches('player-xyz');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/players/matchHistory/player-xyz?limit=10`,
        expect.anything(),
      );
    });
  });

  // ── TokenBucket ───────────────────────────────────────────────────────────

  describe('TokenBucket', () => {
    it('returns 0 when tokens are available', () => {
      const bucket = new TokenBucket(5, 5 / 1_000);
      expect(bucket.acquire(5_000)).toBe(0);
    });

    it('returns waitMs when tokens are exhausted', () => {
      vi.useFakeTimers();
      const bucket = new TokenBucket(1, 5 / 1_000);
      bucket.acquire(5_000); // consume the 1 token
      const waitMs = bucket.acquire(5_000);
      expect(waitMs).toBeGreaterThan(0);
    });

    it('throws Ltd2ApiError(429) when wait exceeds maxWaitMs', () => {
      vi.useFakeTimers();
      const bucket = new TokenBucket(1, 5 / 1_000);
      bucket.acquire(0); // consume
      expect(() => bucket.acquire(0)).toThrow(Ltd2ApiError);
      expect(() => bucket.acquire(0)).toThrow(/rate limit/i);
    });

    it('refills tokens as time advances', () => {
      vi.useFakeTimers();
      const bucket = new TokenBucket(1, 5 / 1_000);
      bucket.acquire(0); // consume
      vi.advanceTimersByTime(1_000); // 1s → 5 tokens refilled, capped at capacity 1
      expect(bucket.acquire(0)).toBe(0);
    });
  });

  // ── rate limiter integration ──────────────────────────────────────────────

  describe('rate limiter integration', () => {
    it('throws 429 immediately when bucket is empty and maxRateWaitMs=0', async () => {
      vi.useFakeTimers();
      const client = makeRateLimitedClient(0);
      fetchMock.mockResolvedValue(makeResponse(crabFixture));
      await client.getUnitById('id1'); // consumes the 1 token
      await expect(client.getUnitById('id2')).rejects.toMatchObject({ statusCode: 429 });
    });

    it('sleeps and succeeds when wait is under maxRateWaitMs', async () => {
      vi.useFakeTimers();
      const client = makeRateLimitedClient(5_000);
      fetchMock.mockResolvedValue(makeResponse(crabFixture));
      await client.getUnitById('id1'); // consume token

      const promise = client.getUnitById('id2');
      await vi.runAllTimersAsync();
      const unit = await promise;
      expect(unit.name).toBe('Crab');
    });
  });

  // ── retry logic ───────────────────────────────────────────────────────────

  describe('retry logic', () => {
    it('retries on network error and succeeds on 2nd attempt', async () => {
      vi.useFakeTimers();
      fetchMock
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValueOnce(makeResponse(crabFixture));

      const promise = makeClient().getUnitById('crab_unit_id');
      await vi.runAllTimersAsync();
      const unit = await promise;

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(unit.name).toBe('Crab');
    });

    it('retries up to 3 times then throws last error', async () => {
      vi.useFakeTimers();
      fetchMock.mockRejectedValue(new Error('fetch failed'));

      const promise = makeClient().getUnitById('crab_unit_id');
      const assertPromise = expect(promise).rejects.toThrow('fetch failed');

      await vi.runAllTimersAsync();
      await assertPromise;

      expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it('throws Ltd2ApiError immediately on non-retryable HTTP error', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse({ error: 'Not found' }, 404));
      await expect(makeClient().getUnitById('bad-id')).rejects.toBeInstanceOf(Ltd2ApiError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  // ── server 429 handling ───────────────────────────────────────────────────

  describe('server 429 handling', () => {
    it('respects Retry-After header and retries successfully', async () => {
      fetchMock
        .mockResolvedValueOnce(makeResponse(null, 429, { 'Retry-After': '2' }))
        .mockResolvedValueOnce(makeResponse(crabFixture));

      vi.useFakeTimers();

      const promise = makeClient().getUnitById('crab_unit_id');
      await vi.runAllTimersAsync();
      const unit = await promise;

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(unit.name).toBe('Crab');
    });

    it('throws Ltd2ApiError(429) after exhausting retries', async () => {
      fetchMock.mockResolvedValue(makeResponse(null, 429, { 'Retry-After': '1' }));

      vi.useFakeTimers();

      const promise = makeClient().getUnitById('crab_unit_id');
      const assertPromise = expect(promise).rejects.toMatchObject({ statusCode: 429 });

      await vi.runAllTimersAsync();
      await assertPromise;
    });
  });

  // ── timeout ───────────────────────────────────────────────────────────────

  it('throws Ltd2ApiError(statusCode=0) on timeout', async () => {
    fetchMock.mockImplementationOnce(
      (_url: string, options: RequestInit) =>
        new Promise((_resolve, reject) => {
          options.signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }),
    );

    await expect(makeClient({ timeoutMs: 100 }).getUnitById('crab_unit_id')).rejects.toMatchObject({
      statusCode: 0,
      message: expect.stringContaining('timed out'),
    });
  });

  // ── Ltd2ApiError ──────────────────────────────────────────────────────────

  describe('Ltd2ApiError', () => {
    it('includes status code from HTTP response', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse('Unauthorized', 401));
      const err = await makeClient()
        .getUnitById('any')
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(Ltd2ApiError);
      expect((err as Ltd2ApiError).statusCode).toBe(401);
    });

    it('has correct name and message', () => {
      const err = new Ltd2ApiError(500, 'server error');
      expect(err.name).toBe('Ltd2ApiError');
      expect(err.message).toBe('server error');
      expect(err).toBeInstanceOf(Error);
    });
  });
});
