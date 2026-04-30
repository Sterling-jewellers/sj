import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI not defined in environment');

  const conn = await mongoose.connect(mongoUri);
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};

export default connectDB;
