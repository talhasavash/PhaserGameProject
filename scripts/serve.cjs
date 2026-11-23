// Oyunu yerelde çalıştırmak için HTML, JavaScript ve oyun dosyalarını sunan HTTP sunucusunu başlatır.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', process.env.PREVIEW_DIST === '1' ? 'dist' : '.');
const port = Number(process.env.PORT || 8095);
const preview = process.env.PREVIEW_DIST === '1';
if (!preview) {
    require('./compile.cjs').compileProject();
    let rebuild;
    for (const folder of ['src', 'examples']) fs.watch(path.join(root, folder), { recursive: true }, (event, file) => {
        if (!file?.endsWith('.ts')) return;
        clearTimeout(rebuild);
        rebuild = setTimeout(() => {
            try { require('./compile.cjs').compileProject(); console.log('TypeScript güncellendi; tarayıcıyı yenileyebilirsin.'); }
            catch (error) { console.error(error.message); }
        }, 250);
    });
}
const publicFolders = new Set(['assets', 'css', 'lib', 'src']);
const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.mpeg': 'audio/mpeg',
    '.aac': 'audio/aac',
    '.wav': 'audio/wav',
    '.ttf': 'font/ttf',
    '.webmanifest': 'application/manifest+json'
};

const server = http.createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, { Allow: 'GET, HEAD' });
        response.end();
        return;
    }

    let relativePath;
    let developmentExample = false;
    try {
        const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
        relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
        developmentExample = !preview && relativePath.startsWith('examples/matter-lab/');
        const segments = relativePath.split(/[\\/]/);
        if (segments.some(segment => segment.startsWith('.')) ||
            (!developmentExample && !['index.html', 'manifest.webmanifest', 'sw.js'].includes(relativePath) && !publicFolders.has(segments[0]))) {
            response.writeHead(404);
            response.end('Not found');
            return;
        }
    } catch {
        response.writeHead(400);
        response.end('Bad request');
        return;
    }

    // HTML aynı src/*.js adreslerini kullanır; geliştirmede bunlar derlenmiş dosyalardır.
    const compiled = !preview && (relativePath.startsWith('src/') || (developmentExample && relativePath.endsWith('.js')));
    const filePath = path.resolve(root, compiled ? '.build/' + relativePath : relativePath);
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
