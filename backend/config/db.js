const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/erp_system';
  
  try {
    // Attempt local connection with a 3-second timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[MongoDB] Connected to database at: ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
  } catch (err) {
    console.warn(`[MongoDB] Local MongoDB connection failed (${err.message}).`);
    console.log('[MongoDB] Starting embedded in-memory MongoDB server for zero-configuration execution...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();
      
      await mongoose.connect(memoryUri);
      console.log(`[MongoDB] Connected to embedded in-memory database: ${memoryUri}`);
    } catch (memErr) {
      console.error('[MongoDB] Failed to start in-memory MongoDB:', memErr.message);
      throw memErr;
    }
  }
};

const closeDB = async () => {
  await mongoose.connection.close();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, closeDB };
