// Kısa, özgün oyun seslerini üretir. Oyunda dosyaları Phaser çalar.
const fs = require('node:fs');
const path = require('node:path');
const folder = path.resolve(__dirname, '../assets/audio');
fs.mkdirSync(folder, { recursive: true });
const sampleRate = 22050;

function saveSound(name, notes) {
    const samples = [];
    for (const [start, end, seconds] of notes) {
        const count = Math.round(seconds * sampleRate);
        let phase = 0;
        for (let i = 0; i < count; i++) {
            const frequency = start + (end - start) * i / count;
            phase += 2 * Math.PI * frequency / sampleRate;
            // Kısa giriş/çıkış, patlama ve tıklama sesini önler.
            const envelope = Math.min(1, i / 130, (count - 1 - i) / 550);
            samples.push(Math.sin(phase) * envelope * 0.55);
        }
    }
    const dataSize = samples.length * 2;
    const wav = Buffer.alloc(44 + dataSize);
    wav.write('RIFF', 0); wav.writeUInt32LE(36 + dataSize, 4); wav.write('WAVE', 8);
    wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(1, 22); wav.writeUInt32LE(sampleRate, 24);
    wav.writeUInt32LE(sampleRate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
    wav.write('data', 36); wav.writeUInt32LE(dataSize, 40);
    samples.forEach((value, i) => wav.writeInt16LE(Math.round(value * 32767), 44 + i * 2));
    fs.writeFileSync(path.join(folder, `${name}.wav`), wav);
}

saveSound('jump', [[270, 600, 0.13]]);
saveSound('collect', [[660, 740, 0.06], [880, 880, 0.09]]);
saveSound('hurt', [[180, 85, 0.18]]);
saveSound('heal', [[523, 523, 0.07], [659, 659, 0.07], [784, 784, 0.10]]);
saveSound('key', [[784, 784, 0.08], [1047, 1047, 0.13]]);
console.log('5 kısa oyun sesi üretildi.');
