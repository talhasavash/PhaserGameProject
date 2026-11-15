// Erkek ve kız karakterlerin mevcut SVG yüzlerini birleştirerek oyunun simge görselini üretir.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function head(file, start) {
    const svg = fs.readFileSync(path.join(root, 'assets/images', file), 'utf8');
    return svg.slice(svg.indexOf(start)).replace(/<\/g>\s*<\/g><\/svg>\s*$/, '');
}
const boy = head('child-0.svg', '<ellipse cx="32" cy="22"');
const girl = head('girl-0.svg', '<path d="M13 25');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<rect width="512" height="512" fill="#183c36"/>
<circle cx="256" cy="256" r="198" fill="#ffdc82"/>
<circle cx="256" cy="256" r="183" fill="#497d65"/>
<g stroke-linecap="round" stroke-linejoin="round">
<g transform="translate(25 155) scale(4.3)">${boy}</g>
<g transform="translate(214 140) scale(4.3)">${girl}</g>
</g></svg>`;
fs.writeFileSync(path.join(root, 'assets/icons/icon.svg'), svg);
console.log('Simge SVG hazır: assets/icons/icon.svg');
