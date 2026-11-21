import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initCronJobs } from './services/cron.service.js';
import { pdfService } from './services/pdf/pdf.service.js';

async function startServer(): Promise<void> {
  // Connect to Database
  await connectDB();

  // Initialize Cron Jobs
  initCronJobs();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Invoizmo API Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    console.log(`📡 Healthcheck: http://localhost:${env.PORT}/health`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      await pdfService.closeBrowser();
      await disconnectDB();
      process.exit(0);
    });

    // Force close after 10s if graceful shutdown hangs
    setTimeout(() => {
      console.error('Forcing shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
