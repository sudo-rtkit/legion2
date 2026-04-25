# @ltd2-coach/ltd2-client

Typed Node.js client for the official [Legion TD 2 API](https://apiv2.legiontd2.com).

## Authentication

The LTD2 API authenticates via an `x-api-key` header. Request an API key at
https://developer.legiontd2.com/.

## Usage

```ts
import { Ltd2Client } from '@ltd2-coach/ltd2-client';

const client = new Ltd2Client({
  apiKey: process.env.LTD2_API_KEY!,
  // baseUrl?:        defaults to 'https://apiv2.legiontd2.com'
  // timeoutMs?:      defaults to 15000
  // maxRateWaitMs?:  defaults to 5000 (throw if wait > 5 s)
});
```

## API

### Units

```ts
const unit = await client.getUnitById('crab_unit_id');
const unit2 = await client.getUnitByName('Crab');
const units = await client.getUnitsByVersion('v12.08.1.hf1'); // full patch dump
```

### Waves

```ts
const waves = await client.getWaves(); // defaults offset=0, limit=22
const wave = await client.getWaveById('level1_wave_id');
```

### Legions

```ts
const legions = await client.getLegions(); // defaults offset=0, limit=20
const legion = await client.getLegionById('element_legion_id');
```

### Abilities

```ts
const abilities = await client.getAbilities(); // defaults offset=0, limit=50
```

### Games

```ts
const match = await client.getMatch('game-id'); // cached indefinitely
```

### Players

```ts
const player = await client.getPlayerById('player-id');
const player2 = await client.getPlayerByName('Nickname');
const history = await client.getPlayerMatches('player-id', 20);
```

## Features

- **Zero runtime dependencies** — uses native `fetch` (Node 20+)
- **Token-bucket rate limiter** — 5 req/s, 100-token burst; throws `Ltd2ApiError(429)` instead of silently queuing > `maxRateWaitMs`
- **Automatic retries** — up to 3 retries with exponential backoff (1 s → 2 s → 4 s)
- **Server 429 handling** — respects `Retry-After` header
- **Configurable timeout** — `AbortController`-based, default 15 s
- **In-memory cache** — units/waves/legions/abilities: 24 h TTL; matches: no expiry
- **Strict TypeScript** — numeric API fields parsed to `number | null` (raw values are `""` not `null`)

## Type notes

All numeric fields in the raw LTD2 API response are **strings** (Mongo export).
The client converts them to `number | null` on the way out — `null` means the
field was empty (`""`) in the original response, which is normal for creeps
(`goldCost`) or fighters (`mythiumCost`).

Parser functions are exported for advanced usage:

```ts
import { parseApiUnit, parseApiWave, parseApiLegion, parseApiMatch } from '@ltd2-coach/ltd2-client';
```

## Error handling

```ts
import { Ltd2ApiError } from '@ltd2-coach/ltd2-client';

try {
  const unit = await client.getUnitById('unknown');
} catch (err) {
  if (err instanceof Ltd2ApiError) {
    console.error(err.statusCode, err.message);
    // statusCode === 0   → network error or timeout
    // statusCode === 429 → rate limited (client-side bucket or server response)
    // statusCode === 404 → not found
  }
}
```
