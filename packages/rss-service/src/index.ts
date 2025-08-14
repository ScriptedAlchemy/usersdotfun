import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { cache } from 'hono/cache';
import { Effect, Context, Layer, ManagedRuntime, Data } from 'effect';
import { v4 as uuidv4 } from 'uuid';
import { Feed } from 'feed';
import { 
  addItemValidator, 
  createFeedValidator, 
  type RssItem, 
  type FeedConfig 
} from './api.js';

// =============================================================================
// STRUCTURED ERRORS
// =============================================================================
class RedisError extends Data.TaggedError("RedisError")<{
  cause: unknown;
  message: string;
}> {}

class FeedNotFoundError extends Data.TaggedError("FeedNotFoundError")<{
  feedId: string;
}> {
  override get message() {
    return `Feed with ID '${this.feedId}' not found`;
  }
}

// =============================================================================
// REDIS SERVICE - Only methods we actually use
// =============================================================================
class Redis extends Context.Tag("Redis")<Redis, {
  get: (key: string) => Effect.Effect<string | null, RedisError>;
  set: (key: string, value: string) => Effect.Effect<void, RedisError>;
  exists: (key: string) => Effect.Effect<boolean, RedisError>;
  lpush: (key: string, value: string) => Effect.Effect<number, RedisError>;
  lrange: (key: string, start: number, end: number) => Effect.Effect<string[], RedisError>;
  ltrim: (key: string, start: number, end: number) => Effect.Effect<void, RedisError>;
  llen: (key: string) => Effect.Effect<number, RedisError>;
  hset: (hash: string, field: string, value: string) => Effect.Effect<void, RedisError>;
  hgetall: (hash: string) => Effect.Effect<Record<string, string>, RedisError>;
  sadd: (key: string, member: string) => Effect.Effect<number, RedisError>;
  sismember: (key: string, member: string) => Effect.Effect<boolean, RedisError>;
  publish: (channel: string, message: string) => Effect.Effect<void, RedisError>;
}>() {}

// Production Redis implementation - ioredis only
const RedisLive = Layer.effect(
  Redis,
  Effect.gen(function* () {
    const redisClient = yield* Effect.tryPromise({
      try: async () => {
        const Redis = (await import('ioredis')).default;
        return new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
      },
      catch: (cause) => new RedisError({ cause, message: "Redis connection failed" }),
    });

    return {
      get: (key: string) => 
        Effect.tryPromise({
          try: () => redisClient.get(key),
          catch: (cause) => new RedisError({ cause, message: `get ${key}` }),
        }),
      
      set: (key: string, value: string) => 
        Effect.tryPromise({
          try: () => redisClient.set(key, value),
          catch: (cause) => new RedisError({ cause, message: `set ${key}` }),
        }).pipe(Effect.asVoid),
      
      exists: (key: string) => 
        Effect.tryPromise({
          try: () => redisClient.exists(key),
          catch: (cause) => new RedisError({ cause, message: `exists ${key}` }),
        }).pipe(Effect.map((n) => n > 0)),
      
      lpush: (key: string, value: string) => 
        Effect.tryPromise({
          try: () => redisClient.lpush(key, value),
          catch: (cause) => new RedisError({ cause, message: `lpush ${key}` }),
        }),
      
      lrange: (key: string, start: number, end: number) => 
        Effect.tryPromise({
          try: () => redisClient.lrange(key, start, end),
          catch: (cause) => new RedisError({ cause, message: `lrange ${key}` }),
        }),
      
      ltrim: (key: string, start: number, end: number) => 
        Effect.tryPromise({
          try: () => redisClient.ltrim(key, start, end),
          catch: (cause) => new RedisError({ cause, message: `ltrim ${key}` }),
        }).pipe(Effect.asVoid),
      
      llen: (key: string) => 
        Effect.tryPromise({
          try: () => redisClient.llen(key),
          catch: (cause) => new RedisError({ cause, message: `llen ${key}` }),
        }),
      
      hset: (hash: string, field: string, value: string) => 
        Effect.tryPromise({
          try: () => redisClient.hset(hash, field, value),
          catch: (cause) => new RedisError({ cause, message: `hset ${hash}` }),
        }).pipe(Effect.asVoid),
      
      hgetall: (hash: string) => 
        Effect.tryPromise({
          try: async () => {
            const result = await redisClient.hgetall(hash);
            return result || {};
          },
          catch: (cause) => new RedisError({ cause, message: `hgetall ${hash}` }),
        }),
      
      sadd: (key: string, member: string) => 
        Effect.tryPromise({
          try: () => redisClient.sadd(key, member),
          catch: (cause) => new RedisError({ cause, message: `sadd ${key}` }),
        }),
      
      sismember: (key: string, member: string) => 
        Effect.tryPromise({
          try: () => redisClient.sismember(key, member),
          catch: (cause) => new RedisError({ cause, message: `sismember ${key}` }),
        }).pipe(Effect.map((n) => n > 0)),
      
      publish: (channel: string, message: string) => 
        Effect.tryPromise({
          try: () => redisClient.publish(channel, message),
          catch: (cause) => new RedisError({ cause, message: `publish ${channel}` }),
        }).pipe(Effect.asVoid),
    };
  })
);

// Development mock - only implement methods we use
const RedisMock = Layer.succeed(Redis, {
  storage: new Map<string, string>(),
  lists: new Map<string, string[]>(),
  hashes: new Map<string, Map<string, string>>(),
  sets: new Map<string, Set<string>>(),
  
  get: function(key: string) { 
    return Effect.succeed(this.storage.get(key) || null); 
  },
  set: function(key: string, value: string) { 
    this.storage.set(key, value); 
    return Effect.void; 
  },
  exists: function(key: string) { 
    return Effect.succeed(this.storage.has(key)); 
  },
  
  lpush: function(key: string, value: string) {
    if (!this.lists.has(key)) this.lists.set(key, []);
    return Effect.succeed(this.lists.get(key)!.unshift(value));
  },
  lrange: function(key: string, start: number, end: number) {
    const list = this.lists.get(key) || [];
    return Effect.succeed(list.slice(start, end === -1 ? undefined : end + 1));
  },
  ltrim: function(key: string, start: number, end: number) {
    if (this.lists.has(key)) {
      const list = this.lists.get(key)!;
      this.lists.set(key, list.slice(start, end === -1 ? undefined : end + 1));
    }
    return Effect.void;
  },
  llen: function(key: string) {
    return Effect.succeed(this.lists.get(key)?.length || 0);
  },
  
  hset: function(hash: string, field: string, value: string) {
    if (!this.hashes.has(hash)) this.hashes.set(hash, new Map());
    this.hashes.get(hash)!.set(field, value);
    return Effect.void;
  },
  hgetall: function(hash: string) {
    const map = this.hashes.get(hash) || new Map();
    return Effect.succeed(Object.fromEntries(map));
  },
  
  sadd: function(key: string, member: string) {
    if (!this.sets.has(key)) this.sets.set(key, new Set());
    const set = this.sets.get(key)!;
    const had = set.has(member);
    set.add(member);
    return Effect.succeed(had ? 0 : 1);
  },
  sismember: function(key: string, member: string) {
    return Effect.succeed(this.sets.get(key)?.has(member) || false);
  },
  
  publish: function(channel: string, message: string) {
    console.log(`[MOCK REDIS] Published to ${channel}:`, message);
    return Effect.void;
  },
} as any);

const RedisLayer = process.env.USE_REDIS_MOCK === 'true' ? RedisMock : RedisLive;
const AppRuntime = ManagedRuntime.make(RedisLayer);

// The runEffect helper handles structured errors
const runEffect = <A, E>(c: any, effect: Effect.Effect<A, E, Redis>) =>
  AppRuntime.runPromise(
    effect.pipe(
      Effect.catchAll((error) => {
        // Pattern match on our tagged errors
        if (error instanceof FeedNotFoundError) {
          return Effect.succeed(c.json({ error: error.message }, 404));
        }
        if (error instanceof RedisError) {
          console.error("Redis Error:", error.cause);
          return Effect.succeed(c.json({ error: "A storage error occurred" }, 500));
        }
        // Handle unexpected errors
        console.error("Unhandled Effect Error:", error);
        return Effect.succeed(c.json({ error: "An internal server error occurred" }, 500));
      })
    )
  );

// =============================================================================
// HONO APP
// =============================================================================
const app = new Hono();

// Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Authorization', 'Content-Type'],
}));

// Auth middleware for API routes
app.use('/api/*', async (c, next) => {
  const auth = c.req.header('Authorization');
  const apiSecret = process.env.API_SECRET;
  
  if (!auth?.startsWith('Bearer ') || auth.substring(7) !== apiSecret) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  await next();
});

// Error handler
app.onError((err: any, c) => {
  console.error('HTTP Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  return c.json({ error: message }, status);
});

// =============================================================================
// API ROUTES
// =============================================================================

// Health check
app.get('/health', (c) => c.json({ 
  status: 'ok', 
  timestamp: new Date().toISOString(),
  service: 'rss-service',
}));

// Create/update feed
app.post('/api/feeds', createFeedValidator, async (c) => {
  const config = c.req.valid('json');
  
  const effect = Effect.gen(function* () {
    const redis = yield* Redis;
    
    // Store feed configuration
    yield* redis.set(`feed:${config.id}`, JSON.stringify(config));
    
    // Initialize stats
    const now = new Date().toISOString();
    yield* redis.hset(`feed:${config.id}:stats`, 'created', now);
    yield* redis.hset(`feed:${config.id}:stats`, 'updated', now);
    yield* redis.hset(`feed:${config.id}:stats`, 'itemCount', '0');
    
    // Publish event
    yield* redis.publish('feed:created', JSON.stringify({ 
      feedId: config.id, 
      title: config.title 
    }));
    
    return { feedId: config.id, message: 'Feed ready', created: now };
  }).pipe(
    Effect.map((result) => c.json(result))
  );

  return runEffect(c, effect);
});

// Add item to feed
app.post('/api/feeds/:feedId/items', addItemValidator, async (c) => {
  const feedId = c.req.param('feedId');
  const item = c.req.valid('json');

  const effect = Effect.gen(function* () {
    const redis = yield* Redis;

    const feedExists = yield* redis.exists(`feed:${feedId}`);
    if (!feedExists) {
      return yield* Effect.fail(new FeedNotFoundError({ feedId }));
    }

    const guid = item.guid || item.link || uuidv4();
    const isDuplicate = yield* redis.sismember(`feed:${feedId}:guids`, guid);

    if (isDuplicate) {
      return { status: 409 as const, id: guid, feedId, message: 'Item already exists (skipped)' };
    }

    const id = uuidv4();
    const fullItem: RssItem = {
      ...item,
      id,
      guid,
      publishedAt: item.publishedAt || new Date().toISOString(),
    };

    yield* redis.lpush(`feed:${feedId}:items`, JSON.stringify(fullItem));
    yield* redis.sadd(`feed:${feedId}:guids`, guid);

    // Update stats
    const itemCount = yield* redis.llen(`feed:${feedId}:items`);
    yield* redis.hset(`feed:${feedId}:stats`, 'itemCount', itemCount.toString());
    yield* redis.hset(`feed:${feedId}:stats`, 'lastItemAdded', new Date().toISOString());

    // Trim to max items
    const feedConfig = JSON.parse((yield* redis.get(`feed:${feedId}`)) || '{}');
    const maxItems = feedConfig.maxItems || 100;
    yield* redis.ltrim(`feed:${feedId}:items`, 0, maxItems - 1);

    // Publish real-time event
    yield* redis.publish(`feed:${feedId}:items`, JSON.stringify({
      action: 'added',
      itemId: id,
      title: fullItem.title,
      count: itemCount,
    }));

    return { status: 200 as const, id, feedId, message: 'Item added successfully' };
  }).pipe(
    Effect.map((result) => c.json({ id: result.id, feedId: result.feedId, message: result.message }, result.status))
  );

  return runEffect(c, effect);
});

// Get feed stats
app.get('/api/feeds/:feedId/stats', async (c) => {
  const feedId = c.req.param('feedId');
  
  const effect = Effect.gen(function* () {
    const redis = yield* Redis;
    
    const feedExists = yield* redis.exists(`feed:${feedId}`);
    if (!feedExists) {
      return yield* Effect.fail(new FeedNotFoundError({ feedId }));
    }
    
    const stats = yield* redis.hgetall(`feed:${feedId}:stats`);
    return stats;
  }).pipe(
    Effect.map((result) => c.json(result))
  );

  return runEffect(c, effect);
});

// Get feed items
app.get('/api/feeds/:feedId/items', async (c) => {
  const feedId = c.req.param('feedId');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  
  const effect = Effect.gen(function* () {
    const redis = yield* Redis;
    
    const feedExists = yield* redis.exists(`feed:${feedId}`);
    if (!feedExists) {
      return yield* Effect.fail(new FeedNotFoundError({ feedId }));
    }
    
    const itemsData = yield* redis.lrange(`feed:${feedId}:items`, 0, limit - 1);
    const items = itemsData.map(data => JSON.parse(data));
    
    return { items, feedId, count: items.length };
  }).pipe(
    Effect.map((result) => c.json(result))
  );

  return runEffect(c, effect);
});

// =============================================================================
// FEED SERVING ROUTES (with caching)
// =============================================================================

// JSON Feed format
app.get('/:feedId/feed.json', cache({ cacheName: 'feeds', cacheControl: 'public, max-age=300' }), async (c) => {
  const feedId = c.req.param('feedId');
  
  const effect = Effect.gen(function* () {
    const redis = yield* Redis;
    
    const [configData, itemsData] = yield* Effect.all([
      redis.get(`feed:${feedId}`),
      redis.lrange(`feed:${feedId}:items`, 0, 49) // Last 50 items
    ]);
    
    if (!configData) {
      return yield* Effect.fail(new FeedNotFoundError({ feedId }));
    }
    
    const config: FeedConfig = JSON.parse(configData);
    const items: RssItem[] = itemsData.map(data => JSON.parse(data));
    
    const jsonFeed = {
      version: "https://jsonfeed.org/version/1.1",
      title: config.title,
      description: config.description,
      home_page_url: config.siteUrl,
      feed_url: c.req.url,
      language: config.language || 'en',
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        content_html: item.content,
        content_text: item.description,
        url: item.link,
        date_published: item.publishedAt,
        authors: item.author ? [{ name: item.author }] : undefined,
        tags: item.categories,
      }))
    };
    
    return jsonFeed;
  }).pipe(
    Effect.map((result) => c.json(result, 200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    }))
  );

  return runEffect(c, effect);
});

// RSS 2.0 format
app.get('/:feedId/rss.xml', cache({ cacheName: 'feeds', cacheControl: 'public, max-age=300' }), async (c) => {
  const feedId = c.req.param('feedId');
  
  const effect = Effect.gen(function* () {
    const redis = yield* Redis;
    
    const [configData, itemsData] = yield* Effect.all([
      redis.get(`feed:${feedId}`),
      redis.lrange(`feed:${feedId}:items`, 0, 49)
    ]);
    
    if (!configData) {
      return yield* Effect.fail(new FeedNotFoundError({ feedId }));
    }
    
    const config: FeedConfig = JSON.parse(configData);
    const items: RssItem[] = itemsData.map(data => JSON.parse(data));
    
    // Use 'feed' package to generate RSS
    const feed = new Feed({
      title: config.title,
      description: config.description,
      id: config.siteUrl,
      link: config.siteUrl,
      language: config.language || 'en',
      image: config.image,
      author: config.author,
      updated: new Date(),
      generator: 'RSS Service',
      copyright: config.author?.name || config.title,
    });
    
    items.forEach(item => {
      feed.addItem({
        title: item.title,
        id: item.id!,
        link: item.link,
        description: item.description || item.content,
        content: item.content,
        author: item.author ? [{ name: item.author }] : undefined,
        date: new Date(item.publishedAt!),
        category: item.categories?.map(cat => ({ name: cat })),
      });
    });
    
    return feed.rss2();
  }).pipe(
    Effect.map((result) => new Response(result, {
      headers: {
        'Content-Type': 'application/rss+xml',
        'Cache-Control': 'public, max-age=300',
      },
    }))
  );

  return runEffect(c, effect);
});

export default app;

// For development/production server
if (import.meta.main) {
  const port = parseInt(process.env.PORT || '4001');
  
  console.log(`🚀 RSS Service starting on port ${port}`);
  console.log('📋 Available endpoints:');
  console.log('   POST /api/feeds - Create/update feed');
  console.log('   POST /api/feeds/:id/items - Add item');
  console.log('   GET /api/feeds/:id/stats - Get feed statistics');  
  console.log('   GET /:id/feed.json - JSON Feed format');
  console.log('   GET /:id/rss.xml - RSS 2.0 format');
  
  Bun.serve({
    port,
    fetch: app.fetch,
  });
}
