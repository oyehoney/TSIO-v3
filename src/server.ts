// TSIO Innovation Hub — HTTP server startup
// Binds to 0.0.0.0:3000 per docker-compose port mapping requirement

import app from './app';

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`[TSIO Hub] Server listening on ${HOST}:${PORT}`);
});
