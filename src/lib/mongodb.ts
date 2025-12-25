import { MongoClient, Db } from 'mongodb';

if (!process.env.MDB_MCP_CONNECTION_STRING) {
  throw new Error('MDB_MCP_CONNECTION_STRING is not defined in environment variables');
}

const uri = process.env.MDB_MCP_CONNECTION_STRING;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the connection
  // across hot reloads
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, create a new client
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise
export default clientPromise;

// Helper function to get database
export async function getDatabase(dbName: string = 'payment_system'): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

// Collection names
export const COLLECTIONS = {
  PAYMENTS: 'payments',
  SUBSCRIPTIONS: 'subscriptions',
  CUSTOMERS: 'customers',
};
