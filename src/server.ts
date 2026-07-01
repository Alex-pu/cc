import { buildApp } from './app.js';
import { env } from './config/env.js';

const app = await buildApp();

const close = async (signal: string) => {
  app.log.info({ signal }, 'shutting down');
  await app.close();
  process.exit(0);
};

process.on('SIGINT', () => {
  void close('SIGINT');
});

process.on('SIGTERM', () => {
  void close('SIGTERM');
});

await app.listen({
  host: env.HOST,
  port: env.PORT,
});
