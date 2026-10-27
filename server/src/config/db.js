import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// keep a handle on the temp server so we can stop it later
let memoryServer = null;
let activeMode = 'none';

// connect to mongo. if it is missing use the in memory one so it still runs on
// a machine without mongodb (viva pc)
export async function connectDb(uri) {
  mongoose.set('strictQuery', true);

  if (uri && uri.trim() !== '') {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
      activeMode = 'mongo';
      console.log('[db] connected to MongoDB');
      return activeMode;
    } catch (err) {
      console.log('[db] could not reach MONGO_URI, using in-memory database instead');
      console.log('[db] reason:', err.message);
    }
  }

  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri());
  activeMode = 'memory';
  console.log('[db] connected to a temporary in-memory MongoDB (data resets on restart)');
  return activeMode;
}

export async function disconnectDb() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

// used by the health endpoint
export function getDbMode() {
  return activeMode;
}
