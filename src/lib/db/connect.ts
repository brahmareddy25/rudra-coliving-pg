import mongoose from "mongoose";

interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  memoryServer?: any;
  seedPromise?: Promise<void> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: GlobalMongoose | undefined;
}

let cached: GlobalMongoose = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    if (cached.seedPromise) {
      await cached.seedPromise;
    }
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    };

    const uri = process.env.MONGODB_URI;
    if (!uri && process.env.NODE_ENV === "production") {
      throw new Error("MONGODB_URI environment variable is missing on the server. Please check AWS Amplify Environment variables.");
    }

    const effectiveUri = uri || "mongodb://127.0.0.1:27017/rudra-coliving";

    cached.promise = mongoose
      .connect(effectiveUri, opts)
      .then((m) => {
        console.log(`[Database] Connected to MongoDB at ${effectiveUri.replace(/:([^:@]{3,})@/, ":***@")}`);
        return m;
      })
      .catch(async (err) => {
        cached.promise = null;
        if (process.env.NODE_ENV === "production" || effectiveUri.startsWith("mongodb+srv://")) {
          console.error(`[Database] MongoDB connection failed: ${err.message}`);
          throw new Error(`Database connection failed: ${err.message}. If using MongoDB Atlas, verify 0.0.0.0/0 is whitelisted in Network Access.`);
        }
        console.warn(`[Database] Direct MongoDB connection failed (${err.message}). Starting MongoMemoryServer fallback...`);
        try {
          const { MongoMemoryServer } = await import("mongodb-memory-server");
          if (!cached.memoryServer) {
            cached.memoryServer = await MongoMemoryServer.create({
              instance: {
                dbName: "rudra-coliving",
              },
            });
          }
          const memoryUri = cached.memoryServer.getUri();
          console.log(`[Database] In-memory MongoDB started at ${memoryUri}`);
          return mongoose.connect(memoryUri, opts);
        } catch (memErr: any) {
          console.error("[Database] Failed to initialize MongoMemoryServer fallback:", memErr);
          throw err;
        }
      });
  }

  try {
    cached.conn = await cached.promise;

    if (!cached.seedPromise) {
      cached.seedPromise = (async () => {
        try {
          const { User } = await import("@/models/User");
          const adminExists = await User.exists({ role: "admin" });
          if (!adminExists) {
            console.log("[Database] Empty database detected. Auto-seeding initial data...");
            const { seedDatabase } = await import("@/lib/db/seed");
            await seedDatabase();
          }
        } catch (seedErr) {
          console.error("[Database] Auto-seed check error:", seedErr);
        }
      })();
    }
    await cached.seedPromise;
  } catch (e) {
    cached.promise = null;
    cached.seedPromise = null;
    throw e;
  }

  return cached.conn;
}
