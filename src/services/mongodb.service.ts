import { MongoClient } from "mongodb";

const mongoClient = new MongoClient("mongodb://huna-mongodb:27017", {
  appName: "huna-notifications",
  auth: {
    username: "admin",
    password: process.env.MONGODB_PASSWORD!
  }
});
export const db = mongoClient.db('huna-notifications');
export default db;