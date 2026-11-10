const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dist = path.join(__dirname, 'dist');
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.png': 'image/png'
};

const server = http.createServer((req, res) => {
  let file = path.join(dist, req.url.split('?')[0]);
  if (file.endsWith(path.sep) || req.url === '/') file = path.join(dist, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  const ext = path.extname(file);
  res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(4173, () => {
  const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const ss1280 = path.join(__dirname, 'screenshot-1280.png');
  const ss390 = path.join(__dirname, 'screenshot-390.png');

  try {
    execSync(`"${edge}" --headless --disable-gpu --window-size=1280,800 --screenshot="${ss1280}" http://localhost:4173`);
    execSync(`"${edge}" --headless --disable-gpu --window-size=390,844 --screenshot="${ss390}" http://localhost:4173`);
    console.log('Screenshots saved successfully');
  } catch (err) {
    console.error('Error taking screenshot:', err.message);
  } finally {
    server.close();
    process.exit(0);
  }
});
