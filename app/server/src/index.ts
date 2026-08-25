import { createApp } from './app.js';
import { config } from './config.js';
import { startReminderScheduler, stopReminderScheduler } from './reminders.js';
import { db } from './db.js';

const server = createApp().listen(config.port, () => {
  console.log(`Winterwork listening on :${config.port}`);
});

startReminderScheduler();

/**
 * Finish in-flight requests and close the database cleanly, so a deploy or
 * container stop can't truncate a write mid-transaction.
 */
let shuttingDown = false;
function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down.`);

  stopReminderScheduler();

  // A reverse proxy holds keep-alive sockets open indefinitely; without this
  // server.close() would wait on them and every deploy would hit the timeout.
  // Idle sockets go now, in-flight requests still get to finish.
  server.closeIdleConnections();

  server.close(() => {
    try {
      db.close();
    } catch {
      /* already closed */
    }
    process.exit(0);
  });

  // Don't hang forever on a stuck connection.
  setTimeout(() => {
    console.error('Shutdown timed out, exiting.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
