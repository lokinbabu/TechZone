const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not defined. Copy server/.env.example to server/.env and set it.');
  }

  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`✔ MongoDB connected → ${conn.connection.host}/${conn.connection.name}`);
  return conn;
};

module.exports = connectDB;
