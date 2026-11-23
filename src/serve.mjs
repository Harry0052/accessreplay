import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

export function startShopServer(rootDir) {
  const root = path.resolve(rootDir);
  const server = createServer(async (request, response) => {
    try {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405).end();
        return;
      }
      const rawUrl = request.url || '';
      if (rawUrl.includes('\0') || /(^|\/)\.\.(\/|$)|%2e%2e/i.test(rawUrl)) {
        response.writeHead(403).end('forbidden');
        return;
      }
      const url = new URL(rawUrl, 'http://127.0.0.1');
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.includes('\0') || pathname.split('/').includes('..')) {
        response.writeHead(403).end('forbidden');
        return;
      }
      if (pathname.endsWith('/')) pathname += 'index.html';
      const absolute = path.resolve(root, `.${pathname}`);
      if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) {
        response.writeHead(403).end('forbidden');
        return;
      }
      const info = await stat(absolute);
      if (!info.isFile()) {
        response.writeHead(404).end('not found');
        return;
      }
      response.writeHead(200, {
        'content-type': TYPES[path.extname(absolute)] || 'application/octet-stream',
        'cache-control': 'no-store',
      });
      if (request.method === 'HEAD') {
        response.end();
        return;
      }
      createReadStream(absolute).pipe(response);
    } catch {
      response.writeHead(404).end('not found');
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        origin: `http://127.0.0.1:${port}`,
        close() {
          return new Promise((done) => server.close(() => done()));
        },
      });
    });
  });
}
