// Dünya 3 için melodili, hafif ritimli ve döngüye uygun kış masalı müziğini sentezler.
const fs = require('node:fs');
const path = require('node:path');
const rate = 32000;
const beat = 60 / 108;
const bar = beat * 4;
const frames = Math.round(16 * bar * rate);
const channels = [new Float32Array(frames), new Float32Array(frames)];
const frequency = midi => 440 * 2 ** ((midi - 69) / 12);

function note(start, duration, midi, volume, pan, voice) {
    const count = Math.round(duration * rate);
    const offset = Math.round(start * rate);
    const hz = frequency(midi);
    const gains = [Math.cos((pan + 1) * Math.PI / 4), Math.sin((pan + 1) * Math.PI / 4)];
    for (let i = 0; i < count; i++) {
        const t = i / rate;
        const phase = 2 * Math.PI * hz * t;
        const release = Math.min(1, (count - 1 - i) / (rate * 0.5));
        let wave;
        if (voice === 'pad') {
            const envelope = Math.sin(Math.PI * i / (count - 1)) ** 2;
            wave = envelope * (Math.sin(phase) + 0.12 * Math.sin(phase * 2));
        } else if (voice === 'flute') {
            const envelope = Math.min(1, t / 0.025, (duration - t) / 0.08);
            const vibrato = Math.sin(2 * Math.PI * 4.5 * t) * 0.012;
            wave = envelope * (Math.sin(phase + vibrato) + 0.18 * Math.sin(phase * 2)
                + 0.035 * Math.sin(phase * 3));
        } else if (voice === 'pluck') {
            wave = Math.min(1, t / 0.008) * release * Math.exp(-t / 0.18)
                * (Math.sin(phase) + 0.22 * Math.sin(phase * 2) + 0.06 * Math.sin(phase * 3));
        } else {
            const attack = 1 - Math.exp(-t / 0.035);
            wave = attack * release * (Math.sin(phase) * Math.exp(-t / 1.4)
                + 0.16 * Math.sin(phase * 2) * Math.exp(-t / 0.5)
                + 0.04 * Math.sin(phase * 3) * Math.exp(-t / 0.2));
        }
        const index = (offset + i) % frames;
        for (let c = 0; c < 2; c++) channels[c][index] += wave * volume * gains[c];
    }
}

// Dört ölçülük cümleler: soru, cevap, yükseliş ve başlangıca dönen kapanış.
const chords = [
    [55, 59, 62], [50, 57, 62], [52, 55, 59], [48, 55, 60],
    [55, 59, 62], [48, 55, 60], [50, 57, 62], [55, 59, 62],
    [52, 55, 59], [48, 55, 60], [55, 59, 62], [50, 57, 62],
    [48, 55, 60], [55, 59, 62], [50, 57, 62], [50, 57, 62]
];
// Her satır bir ölçü; sekizlik adımlar, 0 kısa bir nefes boşluğu.
const melody = [
    [71, 0, 74, 71, 69, 67, 69, 0], [69, 0, 66, 69, 74, 0, 0, 0],
    [71, 0, 74, 71, 76, 74, 71, 0], [72, 71, 69, 67, 69, 0, 0, 0],
    [67, 69, 71, 74, 71, 0, 69, 0], [67, 0, 72, 71, 69, 67, 64, 0],
    [66, 69, 74, 0, 72, 71, 69, 66], [67, 0, 71, 0, 67, 0, 0, 0],
    [76, 0, 74, 71, 67, 71, 74, 0], [76, 74, 72, 0, 71, 69, 67, 0],
    [74, 0, 71, 67, 69, 71, 74, 0], [78, 76, 74, 0, 69, 0, 0, 0],
    [76, 0, 72, 69, 67, 69, 72, 0], [74, 71, 67, 0, 71, 0, 69, 67],
    [69, 0, 74, 72, 71, 69, 66, 0], [69, 0, 66, 0, 62, 0, 66, 69]
];
for (let b = 0; b < 16; b++) {
    const chord = chords[b];
    chord.forEach((pitch, n) => note(b * bar - 0.4 + bar * 16, bar + 0.8,
        pitch, 0.026, (n - 1) * 0.5, 'pad'));
    // Yumuşak bas ve karşı vuruşlardaki pizzicato, hafif bir yürüme ritmi verir.
    for (let pulse = 0; pulse < 4; pulse++) {
        note(b * bar + pulse * beat, 0.48, chord[pulse % 2 ? 2 : 0] - 12, 0.12, 0, 'pluck');
        chord.forEach((pitch, n) => note(b * bar + (pulse + 0.5) * beat + n * 0.012,
            0.5, pitch + 12, 0.037, (n - 1) * 0.4, 'pluck'));
    }
    melody[b].forEach((pitch, step) => {
        if (!pitch) return;
        const time = b * bar + step * beat / 2;
        const length = melody[b][step + 1] === 0 ? beat * 0.83 : beat * 0.41;
        note(time, length, pitch, 0.105, -0.12, 'flute');
        note(time, 1.2, pitch, 0.07, 0.3, 'bell');
    });
    if (b % 4 === 3) note(b * bar + 3 * beat, 1.6, chord[2] + 12, 0.045, -0.55, 'bell');
}

// Yankının sonunu başlangıca sararak tekrar noktasında kesilmeyi önler.
const dry = channels.map(channel => channel.slice());
for (const [seconds, gain] of [[0.19, 0.16], [0.37, 0.11], [0.61, 0.07], [0.93, 0.04]]) {
    const delay = Math.round(seconds * rate);
    for (let c = 0; c < 2; c++) for (let i = 0; i < frames; i++) {
        channels[c][(i + delay) % frames] += dry[1 - c][i] * gain;
    }
}
let peak = 0;
let energy = 0;
for (const channel of channels) for (const sample of channel) {
    peak = Math.max(peak, Math.abs(sample)); energy += sample * sample;
}
const scale = 0.68 / peak;
const wav = Buffer.alloc(44 + frames * 4);
wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVE', 8);
wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(2, 22); wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 4, 28);
wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36);
wav.writeUInt32LE(frames * 4, 40);
for (let i = 0; i < frames; i++) for (let c = 0; c < 2; c++) {
    wav.writeInt16LE(Math.round(channels[c][i] * scale * 32767), 44 + (i * 2 + c) * 2);
}
// Deneme üretimi, kullanıcının eklediği world3.mp3 dosyasının üzerine yazmaz.
const output = path.resolve(__dirname, '../assets/audio/music/winter-preview.wav');
fs.writeFileSync(output, wav);
console.log(JSON.stringify({ output, seconds: frames / rate, bytes: wav.length,
    peak: 0.68, rms: Math.sqrt(energy / (frames * 2)) * scale }));
