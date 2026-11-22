// GitHub Pages için yayın dosyalarını dist klasörüne kopyalar; sürüm ve önbellek bilgilerini hazırlar.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
require('./compile.cjs').compileProject();
const output = path.join(root, 'dist');
const version = (process.env.GITHUB_SHA || 'local').slice(0, 7);
const suffix = `?v=${version}`;

// Önceki klasör düzeninden kalan JS'ler yayın kopyasında bulunmasın.
const sourceOutput = path.resolve(output, 'src');
if (path.dirname(output) !== root || path.dirname(sourceOutput) !== output) {
    throw new Error('Yayın kaynak klasörü proje içindeki dist/src olmalı.');
}
fs.rmSync(sourceOutput, { recursive: true, force: true });

for (const directory of ['css', 'lib', 'assets/images', 'assets/audio', 'assets/icons', 'assets/fonts']) {
    fs.cpSync(path.join(root, directory), path.join(output, directory), { recursive: true });
}
fs.cpSync(path.join(root, '.build/src'), sourceOutput, { recursive: true });

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace('<head>', `<head>\n    <meta name="game-release" content="${version}">`);
html = html.replace(/((?:src|href)="(?:css|src|lib|assets)\/[^"?]+)(")/g, `$1${suffix}$2`);
html = html.replace('Demo · yerel', `Demo · ${version}`);
fs.writeFileSync(path.join(output, 'index.html'), html);
fs.writeFileSync(path.join(output, '.nojekyll'), '');

// Hem aynı klasördeki ./ hem de üst klasördeki ../ modüllere sürüm ekle.
function versionModules(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const target = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            versionModules(target);
        } else if (entry.name.endsWith('.js')) {
            let code = fs.readFileSync(target, 'utf8');
            code = code.replace(/(\b(?:from|import)\s*['"]\.\.?\/[^'"?]+)(['"])/g, `$1${suffix}$2`);
            code = code.replace(/(assets\/(?:images|audio)\/[^'"`]+\.(?:svg|wav|mp3|mpeg|aac))(['"`])/g, `$1${suffix}$2`);
            fs.writeFileSync(target, code);
        }
    }
}
versionModules(sourceOutput);
fs.copyFileSync(path.join(root, 'manifest.webmanifest'), path.join(output, 'manifest.webmanifest'));

// Bütün oyun kaynakları ilk bağlantıda saklanır; GitHub Pages alt dizini de desteklenir.
function publicFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const target = path.join(directory, entry.name);
        if (entry.isDirectory()) return publicFiles(target);
        if (!/\.(js|css|svg|wav|mp3|mpeg|aac|png|ttf|html|webmanifest)$/.test(entry.name) || entry.name === 'sw.js') return [];
        return ['./' + path.relative(output, target).replaceAll(path.sep, '/')];
    });
}
const resources = publicFiles(output);
const precache = [...resources, ...resources.filter(file => !file.endsWith('.html')).map(file => file + suffix)];
const worker = fs.readFileSync(path.join(__dirname, 'service-worker.js'), 'utf8')
    .replace('__VERSION__', version).replace('__PRECACHE__', JSON.stringify(precache));
fs.writeFileSync(path.join(output, 'sw.js'), worker);
console.log(`Yayın hazır: dist / ${version}`);
