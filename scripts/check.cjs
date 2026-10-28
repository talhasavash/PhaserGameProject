const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
function checkDirectory(directory) {
    for (const file of fs.readdirSync(directory, { withFileTypes: true })) {
        const full = path.join(directory, file.name);
        if (file.isDirectory()) checkDirectory(full);
        else if (/\.(cjs|js)$/.test(file.name)) {
            const result = spawnSync(process.execPath, ['--check', full], { stdio: 'inherit' });
            if (result.status !== 0) process.exit(result.status || 1);
        }
    }
}
for (const directory of ['src', 'scripts', 'tests']) checkDirectory(path.join(root, directory));
console.log('JavaScript syntax checks passed.');
