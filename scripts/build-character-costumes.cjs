// Mevcut yüzleri ve hareket pozlarını korur; dünyalara özel kıyafetleri ayrı çizicilerle üretir.
const fs = require('node:fs');
const path = require('node:path');
const folder = path.resolve(__dirname, '../assets/images/hero');
const poses = [[25, 36], [17, 44], [43, 19], [17, 43], [28, 33], [32, 28]];

function head(source, girl, theme) {
    const start = source.indexOf(girl ? '<path d="M13 25' : '<ellipse cx="32" cy="22"');
    if (start < 0) throw new Error('Karakterin yüz çizimi bulunamadı.');
    let drawing = source.slice(start).replace(/<\/g>|<\/svg>/g, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<path\b[^>]*d="M(?:18\.5 12\.5|19 11\.5|25 5\.5|39 41)[^"]*"[^>]*\/>/g, '');
    // Başlık ve örtü rengi kıyafete göre seçilir; mevcut yüz ve ifadesi aynı kalır.
    if (girl) {
        const colors = theme === 'lava'
            ? {'#b990c0': '#963f55', '#785780': '#5c2d43', '#aa7db2': '#79364d', '#a177ab': '#79364d',
                '#ead3e9': '#f2bd9a', '#d6b4d8': '#cd8290', '#ead19a': '#f5cc85'}
            : theme === 'workshop'
            ? {'#b990c0': '#4e8685', '#785780': '#315d67', '#aa7db2': '#3c6b72', '#a177ab': '#3c6b72',
                '#ead3e9': '#b0d7c8', '#d6b4d8': '#8fb9ae', '#ead19a': '#f0d18b'}
            : {'#b990c0': '#303744', '#785780': '#747f8d', '#aa7db2': '#252c38', '#a177ab': '#252c38',
                '#ead3e9': '#939ca8', '#d6b4d8': '#697586', '#ead19a': '#c6bfae'};
        for (const [from, to] of Object.entries(colors)) {
            drawing = drawing.replaceAll(from, to);
        }
    } else if (theme === 'lava') {
        drawing += `<g data-headwear="explorer-goggles">
            <path d="M15 14Q14 2 31 2Q48 1 50 14L48 18Q32 14 16 18Z" fill="#774b42" stroke="#493b40" stroke-width="1.3"/>
            <path d="M16 12Q33 9 49 12" fill="none" stroke="#d88b58" stroke-width="4"/>
            <rect x="20" y="7" width="11" height="9" rx="3" fill="#d9b17b" stroke="#39464e" stroke-width="1.6"/>
            <rect x="33" y="7" width="11" height="9" rx="3" fill="#d9b17b" stroke="#39464e" stroke-width="1.6"/>
            <path d="M23 9L27 12M36 9L40 12" stroke="#fff0cc" stroke-width="1.7"/>
        </g>`;
    } else if (theme === 'workshop') {
        drawing += `<g data-headwear="hardhat">
            <path d="M14 14Q14 1 32 1Q50 1 50 14Z" fill="#efbc51" stroke="#a57b38" stroke-width="1.3"/>
            <path d="M28 3L28 12M36 3L36 12" fill="none" stroke="#ffdd80" stroke-width="2.5"/>
            <path d="M12 14Q32 11 52 14L52 17Q32 20 12 17Z" fill="#fbd16b" stroke="#a57b38" stroke-width="1.2"/>
            <rect x="29" y="10" width="6" height="5" rx="1" fill="#f8eee0"/>
        </g>`;
    } else {
        drawing += `<g data-headwear="turban">
            <path d="M16 11L13 24Q16 28 19 24L20 12Z" fill="#e6ebe7" stroke="#adb7b1" stroke-width="1"/>
            <path d="M15 14Q12 3 27 2Q42 -1 49 8L49 15Q32 21 15 14Z" fill="#fffef8" stroke="#aab6af" stroke-width="1.3"/>
            <path d="M17 7Q32 15 47 11M16 11Q28 20 47 14M23 4Q36 5 44 10" fill="none" stroke="#c9d4cd" stroke-width="1.7"/>
            <path d="M18 5Q30 7 38 4" fill="none" stroke="#ffffff" stroke-width="2"/>
        </g>`;
    }
    return drawing.trim();
}

function pilgrimageCostume(frame, girl) {
    const [left, right] = poses[frame], feet = frame === 3 ? 65 : 74;
    const legs = `<path d="M28 57L${left} ${feet - 4}M35 57L${right} ${feet - 4}" stroke="${girl ? '#303744' : '#efbb8b'}" stroke-width="6"/>`;
    const shoes = `<path d="M${left - 3} ${feet}h9M${right - 2} ${feet}h9" stroke="${girl ? '#444756' : '#8e6a45'}" stroke-width="5"/>
        <path d="M${left - 1} ${feet - 3}l4 3M${right} ${feet - 3}l4 3" stroke="${girl ? '#838a96' : '#d1ad78'}" stroke-width="2"/>`;
    const hem = frame === 3 ? 62 : 72;
    const wrapHem = frame === 3 ? 62 : 71;
    const robe = girl
        ? `<path d="M21 34Q32 29 43 34L${frame === 1 ? 52 : 49} ${hem - 2}Q33 ${hem + 4} 14 ${hem - 1}L18 47Z" fill="#303744" stroke="#747f8d" stroke-width="1.4"/>
            <path d="M25 45Q24 58 21 ${hem - 3}M37 44Q40 57 43 ${hem - 3}M32 49L31 ${hem}" fill="none" stroke="#566171" stroke-width="1.3"/>`
        : `<rect x="28" y="28" width="10" height="11" rx="4" fill="#e6a777"/>
            <path d="M21 35Q26 32 30 35L35 37Q39 32 44 36L47 47Q34 55 19 49Z" fill="#fffef8" stroke="#a8b5ad" stroke-width="1.4"/>
            <path d="M22 36Q31 43 45 40L45 46Q32 51 20 44Z" fill="#e4eae4"/>
            <path d="M22 38Q32 45 44 43M22 45Q30 49 40 47" fill="none" stroke="#bdccc1" stroke-width="1.2"/>
            <path d="M21 50L43 50L${frame === 1 ? 46 : 44} ${wrapHem}Q33 ${wrapHem + 1} 19 ${wrapHem}Z" fill="#fffef8" stroke="#a8b5ad" stroke-width="1.4"/>
            <path d="M35 51L42 52L40 ${wrapHem - 1}L31 ${wrapHem}Z" fill="#e6ece6"/>
            <path d="M35 53L32 ${wrapHem - 2}M24 55L23 ${wrapHem - 3}" fill="none" stroke="#bccbc0" stroke-width="1.2"/>
            <path d="M21 51Q32 54 43 51" fill="none" stroke="#ccd7ce" stroke-width="3"/>`;
    const leftArm = girl
        ? '<path d="M22 40L19 51" stroke="#252c38" stroke-width="9"/><circle cx="18.5" cy="53" r="3" fill="#f5cda7"/>'
        : '<path d="M23 39L19 52" stroke="#efbb8b" stroke-width="6"/>';
    const rightArm = frame === 3
        ? `<path d="M40 41Q48 44 50 38L52 33" fill="none" stroke="${girl ? '#252c38' : '#efbb8b'}" stroke-width="${girl ? 8 : 6}"/>
            ${girl ? '<circle cx="52" cy="32" r="3" fill="#f5cda7"/>' : ''}`
        : `<path d="M40 40L45 50" stroke="${girl ? '#252c38' : '#efbb8b'}" stroke-width="${girl ? 9 : 6}"/>
            ${girl ? '<circle cx="45" cy="52" r="3" fill="#f5cda7"/>' : ''}`;
    return {legs, shoes, robe, leftArm, rightArm};
}

function workshopCostume(frame, girl) {
    const [left, right] = poses[frame], feet = frame === 3 ? 65 : 74;
    const shirt = girl ? '#e7d5b3' : '#d3a554', sleeve = girl ? '#e5cbaa' : '#c29148';
    const cloth = girl ? '#388c91' : '#4c7197', seam = girl ? '#245f69' : '#2f506f';
    const legs = `<path d="M27 54L${left} ${feet - 5}M36 54L${right} ${feet - 5}" stroke="${seam}" stroke-width="9"/>`;
    const shoes = `<path d="M${left - 4} ${feet - 1}h11M${right - 3} ${feet - 1}h11" stroke="#665747" stroke-width="7"/>
        <path d="M${left - 4} ${feet + 2}h11M${right - 3} ${feet + 2}h11" stroke="#c7b489" stroke-width="2"/>`;
    const robe = girl
        ? `<path d="M22 40L41 40Q43 55 48 ${feet - 3}Q32 ${feet + 1} 15 ${feet - 3}Q18 52 22 40Z" fill="#69658b" stroke="#46465f" stroke-width="1.4"/>
            <path d="M23 53L20 ${feet - 5}M31 53L30 ${feet - 3}M39 53L43 ${feet - 5}" fill="none" stroke="#9187a4" stroke-width="1.3"/>
            <path d="M23 37L40 37L43 52L20 52Z" fill="#f0dfbd" stroke="#a89174" stroke-width="1.2"/>
            <path d="M25 42L38 42L42 ${feet - 10}Q32 ${feet - 7} 22 ${feet - 10}Z" fill="#d3b17d" stroke="#9d7c58" stroke-width="1.1"/>
            <path d="M27 54H37L36 60H28Z" fill="#e5c794" stroke="#9d7c58" stroke-width="1"/>
            <path d="M23 51Q31 53 41 51" fill="none" stroke="#a27d57" stroke-width="2"/>
            <path d="M39 55V49M37 48V51H41V48" fill="none" stroke="#bfc9cd" stroke-width="1.7"/>`
        : `<rect x="28" y="28" width="10" height="12" rx="4" fill="#e6a777"/>
        <path d="M23 35Q32 32 42 36L44 55L20 55Z" fill="${shirt}" stroke="${seam}" stroke-width="1.3"/>
        <path d="M25 37L25 45M39 37L39 45" stroke="${cloth}" stroke-width="5"/>
        <path d="M24 44L40 44L${girl ? 45 : 43} ${girl ? 62 : 58}L${girl ? 18 : 21} ${girl ? 62 : 58}Z" fill="${cloth}" stroke="${seam}" stroke-width="1.4"/>
        <path d="M28 46L36 46L35 52L29 52Z" fill="${girl ? '#6eb1b0' : '#7496b8'}" stroke="${seam}" stroke-width="1"/>
        <circle cx="25" cy="44" r="1.3" fill="#efd78e"/><circle cx="39" cy="44" r="1.3" fill="#efd78e"/>
        <path d="M21 54L43 54" stroke="#bd945f" stroke-width="3"/>
        <rect x="37" y="54" width="8" height="8" rx="1.5" fill="#c49b63" stroke="#865f3c" stroke-width="1"/>
        <path d="M40 56V49M38 48L38 51L42 51L42 48" fill="none" stroke="#c8d2d4" stroke-width="1.8"/>
        <path d="M24 57L24 59M32 56L32 60" stroke="${seam}" stroke-width="1"/>`;
    const leftArm = `<path d="M22 39L18 49" stroke="${sleeve}" stroke-width="8"/>
        <path d="M18 47L17 51" stroke="#f0d990" stroke-width="8"/><circle cx="17" cy="53" r="3" fill="#efbb8b"/>`;
    const rightArm = frame === 3
        ? `<path d="M41 40Q48 43 50 38L52 34" fill="none" stroke="${sleeve}" stroke-width="7"/>
            <circle cx="52" cy="32" r="3" fill="#efbb8b"/>`
        : `<path d="M41 39L46 49" stroke="${sleeve}" stroke-width="8"/>
            <path d="M45 47L47 51" stroke="#f0d990" stroke-width="8"/><circle cx="47" cy="53" r="3" fill="#efbb8b"/>`;
    return {legs, shoes, robe, leftArm, rightArm};
}

const outfits = [['child', 'ihram_boy', false, 'pilgrimage'], ['girl', 'chador_girl', true, 'pilgrimage'],
    ['child', 'workshop_boy', false, 'workshop'], ['girl', 'workshop_girl', true, 'workshop'],
    ['child', 'lava_boy', false, 'lava'], ['girl', 'lava_girl', true, 'lava']];
const costumeBuilders = {pilgrimage: pilgrimageCostume, workshop: workshopCostume, lava: lavaCostume};
let written = 0;
for (const [base, prefix, girl, theme] of outfits) {
    if (process.argv[2] && theme !== process.argv[2]) continue;
    for (const expression of ['', 'sad-', 'happy-', 'blink']) {
        for (let frame = 0; frame < (expression === 'blink' ? 1 : 6); frame++) {
            const suffix = expression === 'blink' ? 'blink' : `${expression}${frame}`;
            const source = fs.readFileSync(path.join(folder, `${base}-${suffix}.svg`), 'utf8');
            const c = costumeBuilders[theme](frame, girl), lift = frame >= 4 ? -2 : 0;
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="80" viewBox="0 0 64 80" data-costume="${theme === 'pilgrimage' ? girl ? 'chador' : 'ihram' : theme}">
<g stroke-linecap="round" stroke-linejoin="round">${c.legs}${c.shoes}
<g transform="translate(0 ${lift})">${c.robe}${c.leftArm}${c.rightArm}${head(source, girl, theme)}</g></g></svg>\n`;
            fs.writeFileSync(path.join(folder, `${prefix}-${suffix}.svg`), svg.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n'));
            written++;
        }
    }
}
console.log(`${written} kıyafet SVG'si üretildi.`);

function lavaCostume(frame, girl) {
    const [left, right] = poses[frame], feet = frame === 3 ? 65 : 74;
    const cloth = girl ? '#4d465c' : '#435565', seam = '#2b3545', trim = '#db8a58';
    const legs = `<path d="M27 55L${left} ${feet - 5}M36 55L${right} ${feet - 5}" stroke="${seam}" stroke-width="8"/>`;
    const shoes = `<path d="M${left - 3} ${feet - 1}h10M${right - 2} ${feet - 1}h10" stroke="#394047" stroke-width="7"/>
        <path d="M${left - 3} ${feet + 2}h10M${right - 2} ${feet + 2}h10" stroke="${trim}" stroke-width="2"/>`;
    const hem = girl ? feet - 3 : 58;
    const robe = `<rect x="28" y="28" width="10" height="12" rx="4" fill="#e6a777"/>
        <path d="M22 35Q32 32 42 36L${girl ? 48 : 44} ${hem}Q33 ${hem + 2} ${girl ? 15 : 20} ${hem}Z" fill="${cloth}" stroke="${seam}" stroke-width="1.5"/>
        <path d="M23 38Q32 42 42 38M21 51H44" fill="none" stroke="${trim}" stroke-width="4"/>
        <path d="M24 37Q32 41 41 37" fill="none" stroke="#ffedbc" stroke-width="1.5"/>
        <path d="M32 40V${hem - 2}" stroke="#89959d" stroke-width="1.5"/>
        <path d="M23 55L21 ${hem - 2}M40 55L43 ${hem - 2}" fill="none" stroke="${girl ? '#837287' : '#768693'}" stroke-width="1.2"/>
        <rect x="22" y="46" width="6" height="4" rx="1" fill="#b5c1c0"/>
        <rect x="37" y="55" width="7" height="6" rx="1" fill="${trim}" stroke="#9c5f42" stroke-width="1"/>`;
    const leftArm = `<path d="M22 39L18 49" stroke="${cloth}" stroke-width="8"/>
        <path d="M18 47L17 51" stroke="${trim}" stroke-width="8"/><circle cx="17" cy="53" r="3.5" fill="#b5c1c0"/>`;
    const rightArm = frame === 3
        ? `<path d="M41 40Q48 43 50 38L52 34" fill="none" stroke="${cloth}" stroke-width="7"/>
            <circle cx="52" cy="32" r="3.5" fill="#b5c1c0"/>`
        : `<path d="M41 39L46 49" stroke="${cloth}" stroke-width="8"/>
            <path d="M45 47L47 51" stroke="${trim}" stroke-width="8"/><circle cx="47" cy="53" r="3.5" fill="#b5c1c0"/>`;
    return {legs, shoes, robe, leftArm, rightArm};
}
