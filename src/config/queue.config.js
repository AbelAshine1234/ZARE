const Queue = require('bull');
const Redis = require('redis');

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
};

// Create Redis client
const redisClient = Redis.createClient(redisConfig);

// Handle Redis connection events
redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

redisClient.on('ready', () => {
  console.log('🚀 Redis is ready');
});

// Create queues
const imageUploadQueue = new Queue('image-upload', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

const videoUploadQueue = new Queue('video-upload', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Queue event handlers
imageUploadQueue.on('completed', (job, result) => {
  console.log(`✅ Image upload job ${job.id} completed:`, result);
});

imageUploadQueue.on('failed', (job, err) => {
  console.error(`❌ Image upload job ${job.id} failed:`, err);
});

videoUploadQueue.on('completed', (job, result) => {
  console.log(`✅ Video upload job ${job.id} completed:`, result);
});

videoUploadQueue.on('failed', (job, err) => {
  console.error(`❌ Video upload job ${job.id} failed:`, err);
});

module.exports = {
  redisClient,
  imageUploadQueue,
  videoUploadQueue,
}; 