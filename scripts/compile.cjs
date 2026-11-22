// TypeScript kaynaklarını .build içine derler; tarayıcı ve testler üretilen JavaScript'i kullanır.
const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
function compileProject(checkOnly = false) {
    const compiler = require.resolve('typescript/bin/tsc');
    const args = [compiler, '--project', path.join(root, 'tsconfig.json'), '--pretty', 'false'];
    if (checkOnly) args.push('--noEmit');
    const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
    if (result.status !== 0) throw new Error('TypeScript kontrolü başarısız. Yukarıdaki hataları düzelt.');
    if (!checkOnly) removeObsoleteOutput(path.resolve(root, '.build'));
}

// Kaynağı taşınan/silinen modüller sonraki yayına yanlışlıkla girmesin.
function removeObsoleteOutput(directory) {
    const output = path.resolve(root, '.build');
    const target = path.resolve(directory);
    if (target !== output && !target.startsWith(output + path.sep)) throw new Error('Derleme çıktısı proje içinde olmalı.');
    for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
        const file = path.join(target, entry.name);
        if (entry.isDirectory()) removeObsoleteOutput(file);
        else if (/\.js(?:\.map)?$/.test(entry.name)) {
            const source = path.join(root, path.relative(output, file).replace(/\.js(?:\.map)?$/, '.ts'));
            if (!fs.existsSync(source)) fs.unlinkSync(file);
        }
    }
}
module.exports = { compileProject };
if (require.main === module) compileProject(process.argv.includes('--check'));
