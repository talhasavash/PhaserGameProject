const fs = require('node:fs');
const path = require('node:path');
const target = path.resolve(__dirname, '../assets/images');
fs.mkdirSync(target, { recursive: true });
const save = (name, width, height, body) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>\n`;
    fs.writeFileSync(path.join(target, name + '.svg'), svg.replace(/[ \t]+$/gm, ''));
};

const child = (frame, expression = 'normal', character = 'boy') => {
    const legPositions = [[25, 36], [17, 44], [43, 19], [17, 43], [28, 33], [32, 28]];
    const legs = legPositions[frame];
    const feetY = frame === 3 ? 65 : 74;
    let bodyLift = 0;
    if (frame === 4 || frame === 5) bodyLift = -2;
    const leftHandX = 19;
    const rightHandX = 45;
    let mouth = '<path d="M29.5 31q4.5 4 9 0" fill="none" stroke="#8f5f4c" stroke-width="1.6"/>';
    let eyebrows = '<path d="M26 17.5q3-1 5 0 M36.5 17.5q3-1 5 0" fill="none" stroke="#543e34" stroke-width="1.5"/>';
    if (expression === 'sad') {
        mouth = '<path d="M29 34q5-6 10 0" fill="none" stroke="#8f5f4c" stroke-width="1.9"/>';
        eyebrows = '<path d="M26 18l5-2 M37 16l5 2" fill="none" stroke="#543e34" stroke-width="1.5"/>';
    }
    if (expression === 'happy') {
        mouth = '<path d="M28.5 30q5.5 2 11 0q-1 8-5.5 8q-4.5 0-5.5-8Z" fill="#805b4c"/><path d="M30 31q4 1.5 8 0" fill="none" stroke="#fff9ed" stroke-width="2"/>';
    }
    let headCover = '';
    let hair = '<path d="M17 22Q11 4 31 3Q50 1 49 19L41 14L34 15L28 11L24 18L21 18L21 25Z" fill="#543e34"/><path d="M23 8Q35 1 43 9" fill="none" stroke="#7a5740" stroke-width="3"/>';
    let ear = '<circle cx="17" cy="24" r="4" fill="#efbb8b"/>';
    let face = '<ellipse cx="32" cy="22" rx="16" ry="17" fill="#f2c697" stroke="#a66e4c" stroke-width="1.5"/>';
    let shirt = '<path d="M24 36Q32 32 40 37L42 55Q32 61 21 54Z" fill="#267d85" stroke="#245e66" stroke-width="2"/>';
    if (character === 'girl') {
        shirt = '<path d="M23 36Q32 33 41 37L45 60Q32 65 18 59Z" fill="#418e91" stroke="#2d6971" stroke-width="2"/>';
        // Yuvarlak yüzü çevreleyen geniş başörtüsü ve omuzlara inen iki kat.
        headCover = '<path d="M13 25Q10 1 31 1Q54 0 53 26L50 47Q34 55 15 47Z" fill="#b990c0" stroke="#785780" stroke-width="1.5"/><path d="M15 34L12 49L23 54L28 43Z" fill="#aa7db2" stroke="#785780" stroke-width="1"/>';
        face = '<ellipse cx="33" cy="22.5" rx="14.5" ry="16" fill="#f5cda7" stroke="#b48160" stroke-width="1.2"/>';
        hair = '<path d="M17 20Q16 5 32 4Q49 4 50 21L46 16Q34 9 21 16Z" fill="#b990c0"/><path d="M19 16Q32 6 46 16" fill="none" stroke="#ead3e9" stroke-width="1.5"/><path d="M17 27Q17 37 31 42L23 49L16 44Z" fill="#a177ab"/><path d="M48 27Q47 39 31 42L39 50L49 45Z" fill="#a177ab"/><path d="M19 32Q22 39 32 42M45 33Q41 39 34 42" fill="none" stroke="#d6b4d8" stroke-width="1.3"/><circle cx="39" cy="43" r="1.7" fill="#ead19a"/>';
        ear = '';
    }
    // Normal kol ilk tasarımdaki gibi gövdenin yanında, başın arkasındaki katmanda.
    let rightArm = `<path d="M39 39L${rightHandX} 49" stroke="#efbb8b" stroke-width="7"/><path d="M39 39L42 44" stroke="#328e95" stroke-width="9"/>`;
    let jumpingArm = '';
    if (frame === 3) {
        rightArm = '';
        jumpingArm = '<path d="M39 41Q47 44 50 39L52 33" fill="none" stroke="#efbb8b" stroke-width="7"/><path d="M39 41L44 42" stroke="#328e95" stroke-width="9"/>';
    }
    return `<g transform="translate(${frame * 64} 0)" stroke-linecap="round" stroke-linejoin="round">
      <path d="M28 54 L${legs[0]} ${feetY - 5} M35 54 L${legs[1]} ${feetY - 5}" stroke="#263e50" stroke-width="9"/>
      <path d="M${legs[0] - 3} ${feetY}h9 M${legs[1] - 2} ${feetY}h9" stroke="#e9b754" stroke-width="7"/>
      <g transform="translate(0 ${bodyLift})">
      <rect x="10" y="34" width="18" height="22" rx="6" fill="#d29240" stroke="#8d653e" stroke-width="2"/>
      ${shirt}
      <path d="M23 39L${leftHandX} 52" stroke="#efbb8b" stroke-width="7"/>
      <path d="M23 38L20 45" stroke="#328e95" stroke-width="9"/>
      ${rightArm}
      <rect x="28" y="28" width="10" height="10" rx="4" fill="#e6a777"/>
      ${headCover}
      ${face}
      ${ear}
      ${hair}
      <ellipse cx="28.5" cy="23" rx="3.4" ry="4.2" fill="#fff9ed"/>
      <ellipse cx="39" cy="23" rx="3.4" ry="4.2" fill="#fff9ed"/>
      <ellipse cx="29.3" cy="23.4" rx="1.9" ry="2.8" fill="#273d42"/>
      <ellipse cx="39.8" cy="23.4" rx="1.9" ry="2.8" fill="#273d42"/>
      <circle cx="29.7" cy="22.4" r="0.7" fill="#fff"/>
      <circle cx="40.2" cy="22.4" r="0.7" fill="#fff"/>
      ${eyebrows}
      <path d="M33.5 26v2h2" fill="none" stroke="#c18d65" stroke-width="1.2"/>
      ${mouth}
      ${jumpingArm}
      </g>
    </g>`;
};
for (const character of ['boy', 'girl']) {
    let base = 'child';
    if (character === 'girl') base = 'girl';
    for (const expression of ['normal', 'sad', 'happy']) {
        let prefix = `${base}-`;
        if (expression !== 'normal') prefix = `${base}-${expression}-`;
        for (let frame = 0; frame < 6; frame++) {
            save(`${prefix}${frame}`, 64, 80, child(frame, expression, character).replace(`translate(${frame * 64} 0)`, 'translate(0 0)'));
        }
    }
}
save('apple', 40, 44, `<path d="M21 12q-4-10 2-10" fill="none" stroke="#785331" stroke-width="4"/><path d="M23 9Q29 0 36 5Q33 14 23 9" fill="#51834d"/><path d="M20 14C1 4 -4 31 12 40Q19 43 21 39Q31 45 37 30C44 14 31 8 20 14" fill="#df6950" stroke="#b64d3e" stroke-width="2"/><path d="M10 20q-4 6 0 12" fill="none" stroke="#ffc3a1" stroke-width="3" stroke-linecap="round"/>`);
save('berry', 32, 36, `<path d="M16 10L9 2L8 11L2 7L6 16" fill="#608c50"/><circle cx="12" cy="21" r="10" fill="#53669c" stroke="#3b5279" stroke-width="2"/><circle cx="23" cy="19" r="8" fill="#6a7aad" stroke="#3b5279" stroke-width="2"/><circle cx="9" cy="18" r="2.5" fill="#a5b4d3"/>`);
save('hedgehog', 76, 52, `<path d="M9 38L3 28L13 26L9 14L21 17L23 4L32 13L41 3L46 14L58 9L57 23L65 27L58 41Z" fill="#79634f" stroke="#514b40" stroke-width="2"/><ellipse cx="36" cy="35" rx="25" ry="13" fill="#b49473"/><path d="M51 27Q64 27 71 37Q61 46 50 43" fill="#e6bc8e"/><circle cx="71" cy="37" r="3" fill="#38494b"/><circle cx="60" cy="32" r="2.5" fill="#38494b"/><path d="M21 45h9m12 0h8" stroke="#514b40" stroke-width="5" stroke-linecap="round"/>`);
save('snail', 76, 52, `<path d="M8 44Q32 34 59 35L65 25Q71 24 71 32L69 42Q63 49 13 49Z" fill="#b8ad70" stroke="#6f7654" stroke-width="2"/><circle cx="30" cy="27" r="21" fill="#b38db6" stroke="#7f6488" stroke-width="3"/><path d="M38 31c10-15-15-24-19-9s17 20 17 9-12-7-9-1" fill="none" stroke="#7f6488" stroke-width="3"/><path d="M63 28L61 16m8 13 3-14" stroke="#6f7654" stroke-width="3"/><circle cx="61" cy="15" r="3" fill="#324c48"/><circle cx="72" cy="14" r="3" fill="#324c48"/>`);
save('ball', 52, 52, `<circle cx="26" cy="26" r="24" fill="#c88858" stroke="#815b45" stroke-width="3"/><path d="M7 23L19 11L34 13L42 28L30 42L15 37Z" fill="#e1a974" stroke="#a56e4e" stroke-width="3"/><path d="M19 11L22 27L42 28M22 27L15 37" fill="none" stroke="#a56e4e" stroke-width="3"/>`);
save('key', 64, 40, `<circle cx="18" cy="19" r="13" fill="#f6cf65" stroke="#a47a32" stroke-width="3"/><circle cx="18" cy="19" r="5" fill="#c6edef"/><path d="M30 19h27v10h-7v-6h-8v6h-7V19" fill="#f6cf65" stroke="#a47a32" stroke-width="3" stroke-linejoin="round"/>`);
// Tesbih taneleri: ip üzerindeki küçük turkuaz boncuklar.
save('bead', 40, 44, `<path d="M8 10Q1 25 20 29Q36 32 32 8M20 29v10" fill="none" stroke="#ad955e" stroke-width="2"/><g fill="#3c9995" stroke="#286867" stroke-width="1.5"><circle cx="8" cy="13" r="5"/><circle cx="8" cy="24" r="5"/><circle cx="18" cy="29" r="5"/><circle cx="29" cy="25" r="5"/><circle cx="32" cy="14" r="5"/></g><path d="M16 41l4-8 4 8" fill="#d4b261"/><g fill="#c1e7d4"><circle cx="7" cy="11" r="1.5"/><circle cx="17" cy="27" r="1.5"/><circle cx="31" cy="12" r="1.5"/></g>`);
save('mat', 36, 52, `<rect x="4" y="5" width="28" height="42" rx="2" fill="#3e8378" stroke="#285e59" stroke-width="2"/><path d="M8 10h20v32H8Z" fill="none" stroke="#e6c57e" stroke-width="1.5"/><path d="M12 35V24q0-7 6-10 6 3 6 10v11Z" fill="none" stroke="#e6c57e" stroke-width="1.5"/><path d="M8 3V0m5 3V0m5 3V0m5 3V0m5 3V0M8 49v3m5-3v3m5-3v3m5-3v3m5-3v3" stroke="#d5b77e" stroke-width="2"/>`);
console.log('Vector game assets created in assets/images.');
