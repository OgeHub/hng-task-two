import 'dotenv/config';
import app from './app';
import { connectDatabase } from './utils/db';

const PORT = Number(process.env.PORT) || 3009;

async function startServer() {
  await connectDatabase();
  console.log('PostgreSQL connected successfully');

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});