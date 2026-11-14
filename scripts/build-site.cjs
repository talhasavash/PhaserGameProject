// Yalnızca yayın için bir kopya üretir; src dosyalarımızı değiştirmez.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const version = (process.env.GITHUB_SHA || 'local').slice(0, 7);
const suffix = `?v=${version}`;

// Önceki klasör düzeninden kalan JS'ler yayın kopyasında bulunmasın.
const sourceOutput = path.resolve(output, 'src');
if (path.dirname(output) !== root || path.dirname(sourceOutput) !== output) {
    throw new Error('Yayın kaynak klasörü proje içindeki dist/src olmalı.');
}
fs.rmSync(sourceOutput, { recursive: true, force: true });

for (const directory of ['css', 'src', 'lib', 'assets/images', 'assets/audio']) {
    fs.cpSync(path.join(root, directory), path.join(output, directory), { recursive: true });
}

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
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
            code = code.replace(/(from ['"]\.\.?\/[^'"?]+)(['"])/g, `$1${suffix}$2`);
            code = code.replace(/(assets\/(?:images|audio)\/[^'"`]+\.(?:svg|wav))(['"`])/g, `$1${suffix}$2`);
            fs.writeFileSync(target, code);
        }
    }
}
versionModules(sourceOutput);
console.log(`Yayın hazır: dist / ${version}`);
