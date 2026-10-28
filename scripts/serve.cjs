const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 8095);
const publicFolders = new Set(['assets', 'css', 'lib', 'src']);
const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg'
};

const server = http.createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, { Allow: 'GET, HEAD' });
        response.end();
        return;
    }

    let relativePath;
    try {
        const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
        relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
        const segments = relativePath.split(/[\\/]/);
        if (segments.some(segment => segment.startsWith('.')) ||
            (relativePath !== 'index.html' && !publicFolders.has(segments[0]))) {
            response.writeHead(404);
            response.end('Not found');
            return;
        }
    } catch {
        response.writeHead(400);
        response.end('Bad request');
        return;
    }

    const filePath = path.resolve(root, relativePath);
    if (!filePath.startsWith(root + path.sep)) {
        response.writeHead(404);
        response.end('Not found');
        return;
    }

    try {
        const contents = await fs.promises.readFile(filePath);
        response.writeHead(200, {
            'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
            'Cache-Control': 'no-store'
        });
        response.end(request.method === 'HEAD' ? undefined : contents);
    } catch {
        response.writeHead(404);
        response.end('Not found');
    }
});

server.on('error', error => {
    console.error(`Sunucu başlatılamadı: ${error.message}`);
    process.exitCode = 1;
});

server.listen(port, '127.0.0.1', () => {
    console.log(`Meyve Oyunu: http://localhost:${port}`);
    console.log('Durdurmak için Ctrl+C.');
});
