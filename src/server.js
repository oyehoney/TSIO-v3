'use strict';
const { createApp } = require('./app');
const PORT = parseInt(process.env.PORT || '3000', 10);
const app = createApp();

// Store port on app so internal handlers (e.g. searchPageHandler) can use it
app.set('serverPort', PORT);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TSIO Innovation Hub listening on port ${PORT}`);
});
