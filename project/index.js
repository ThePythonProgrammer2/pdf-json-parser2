const server = require('./server/index.js');
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`PDF Parser server running on http://localhost:${PORT}`);
  });
}
