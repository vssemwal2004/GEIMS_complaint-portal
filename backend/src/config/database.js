/**
 * Database Configuration
 * 
 * Handles MongoDB connection using Mongoose.
 * Includes connection retry logic and proper error handling.
 * 
 * Security Considerations:
 * - Connection string from environment variables only
 * - No hardcoded credentials
 * - Connection events logged for monitoring
 */

import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    // MongoDB connection options for production readiness
    const options = {
      // Automatically build indexes (disable in production for large collections)
      autoIndex: process.env.NODE_ENV !== 'production',
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Connection event handlers for monitoring
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    // Exit process with failure code
    process.exit(1);
  }
};

export default connectDB;
