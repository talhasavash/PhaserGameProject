// Yerel Matter atölyesini başlatır; üretim menüsüne veya kayıtlı ilerlemeye bağlanmaz.
import {MatterLabScene} from './MatterLabScene.js';
import {matterLab} from './definition.js';
import {labMotion} from './movement.js';
import {labPhysics} from './simulation.js';
import {enterGameDisplay} from '../../src/ui/browser.js';

const start = document.getElementById('lab-start') as HTMLButtonElement;
const character = document.getElementById('lab-character') as HTMLSelectElement;
const restart = document.getElementById('lab-restart') as HTMLButtonElement;
const pause = document.getElementById('lab-pause') as HTMLButtonElement;
const debug = document.getElementById('lab-debug') as HTMLInputElement;
const area = document.getElementById('lab-game')!;
const station = document.getElementById('lab-station') as HTMLSelectElement;
matterLab.stations.forEach((area, index) => station.add(new Option(area.name, String(index))));
let game: Phaser.Game | undefined;

start.onclick = () => {
    if (game) return;
    start.disabled = true;
    character.disabled = true;
    document.getElementById('lab-intro')!.hidden = true;
    document.getElementById('lab-loading')!.hidden = false;
    void enterGameDisplay();
    const view = () => {
        const height = matchMedia('(max-height: 500px) and (orientation: landscape)').matches ? 420 : 600;
        return {height, width: Math.max(600, Math.round(height * area.clientWidth / Math.max(1, area.clientHeight)))};
    };
    const size = view();
    game = new Phaser.Game({
        type: Phaser.AUTO, parent: area, width: size.width, height: size.height,
        backgroundColor: '#c9e6eb', title: 'Matter Fizik Atölyesi',
        scale: {mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH},
        physics: {default: 'matter', matter: {...labPhysics, gravity: {x: 0, y: labMotion.gravity},
            autoUpdate: false, debug: true}},
        scene: []
    });
    game.scene.add('MatterLab', MatterLabScene, true, {character: character.value, station: Number(station.value)});
    restart.disabled = pause.disabled = debug.disabled = false;
    const resize = new ResizeObserver(() => {
        const next = view();
        if (game && (game.scale.width !== next.width || game.scale.height !== next.height)) game.scale.setGameSize(next.width, next.height);
    });
    resize.observe(area);
    game.events.once('destroy', () => resize.disconnect());
};

const scene = () => game?.scene.getScene('MatterLab') as MatterLabScene | undefined;
restart.onclick = () => scene()?.restart();
pause.onclick = () => scene()?.togglePause();
debug.onchange = () => scene()?.setDebug(debug.checked);
(document.getElementById('lab-release') as HTMLButtonElement).onclick = () => scene()?.releaseObjects();
station.onchange = () => scene()?.goToStation(Number(station.value));
window.addEventListener('pagehide', () => game?.destroy(true), {once: true});
