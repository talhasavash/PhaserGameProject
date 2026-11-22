// Dünya ve bölüm seçim düğmelerini oluşturur; açılan ve kilitli bölümlerin görünümünü günceller.

import { element } from './dom.js';
import { levels, worlds, chapterNumber, LEVEL_SLOT_COUNT, isPlayableLevel } from '../world/levels/level.js';
import { unlockedLevels } from '../data/progress.js';

// Bu dosya yalnızca HTML seçimlerini kurar; seçilen dünya game.js içinde tutulur.
export function createWorldMenu(worldTabs, selectWorld) {
    for (const world of worlds) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.world = String(world.id);
        button.onclick = () => selectWorld(world.id);
        worldTabs.append(button);
    }
    for (const [id, direction] of [['previous-world', -1], ['next-world', 1]] as const) {
        element(id).onclick = () => {
            const index = worlds.findIndex(world => world.id === Number(worldTabs.dataset.selected));
            const next = worlds[index + direction];
            if (next) selectWorld(next.id);
        };
    }
}

export function createLevelMenu(levelGrid, worldId, preferredIndex?: number, startLevel: (index: number) => void = () => {}) {
    const world = worlds.find(world => world.id === worldId)!;
    levelGrid.replaceChildren();
    levelGrid.dataset.world = world.id;
    levelGrid.style.setProperty('--level-columns', String(Math.min(5, world.count)));
    for (let localIndex = 0; localIndex < world.count; localIndex++) {
        const index = world.start + localIndex;
        const level = levels[index];
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'level-option';
        button.dataset.theme = level?.theme || '';
        button.value = String(index);
        button.disabled = !isPlayableLevel(index);
        button.setAttribute('aria-current', String(index === (preferredIndex ?? world.start)));
        button.onclick = () => { if (!button.disabled) startLevel(index); };
        if (level?.boss) button.classList.add('boss-level');
        const card = document.createElement('span');
        card.className = 'level-card';
        const number = document.createElement('strong');
        number.textContent = String(chapterNumber(index));
        card.append(number);
        button.append(card);
        levelGrid.append(button);
    }
    updateLevelLocks(levelGrid, unlockedLevels(LEVEL_SLOT_COUNT));
}

// Başlık ve arka plan hemen yenilenir; eski liste çıkarken yeni liste karşıdan girer.
export async function slideWorld(levelGrid, fromWorld, toWorld, render) {
    if (fromWorld === toWorld || levelGrid.dataset.sliding === 'true') return;
    if (!levelGrid.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        render();
        return;
    }
    const direction = toWorld > fromWorld ? 1 : -1;
    const preview = document.createElement('div');
    preview.className = 'level-grid level-grid-preview';
    createLevelMenu(preview, fromWorld);
    preview.inert = true;
    preview.setAttribute('aria-hidden', 'true');
    levelGrid.dataset.sliding = 'true';
    levelGrid.inert = true;
    levelGrid.parentElement.append(preview);
    const panel = element('character-select');
    const background = document.createElement('div');
    background.className = 'world-background-fade';
    background.style.background = getComputedStyle(panel).background;
    background.setAttribute('aria-hidden', 'true');
    panel.append(background);
    render();
    const options: KeyframeAnimationOptions = { duration: 320, easing: 'cubic-bezier(.22,.65,.28,1)', fill: 'both' };
    const animations = [
        preview.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${-direction * 100}%)` }], options),
        levelGrid.animate([{ transform: `translateX(${direction * 100}%)` }, { transform: 'translateX(0)' }], options),
        background.animate([{ opacity: 1 }, { opacity: 0 }], { ...options, easing: 'ease-in-out' })
    ];
    try {
        await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
    } finally {
        for (const animation of animations) animation.cancel();
        preview.remove();
        background.remove();
        levelGrid.inert = false;
        delete levelGrid.dataset.sliding;
    }
}

export function refreshLevelLocks(worldTabs, levelGrid, worldId) {
    const unlocked = unlockedLevels(LEVEL_SLOT_COUNT);
    const selectedWorld = worlds.find(world => world.id === worldId)!;
    const selectedIndex = worlds.indexOf(selectedWorld);
    worldTabs.dataset.selected = worldId;
    element('character-select').dataset.world = worldId;
    const panel = element('character-select');
    panel.style.backgroundImage = `url("${selectedWorld.menu?.image || 'assets/images/scene/menu-world1.svg'}")`;
    panel.style.backgroundColor = selectedWorld.menu?.color || '#a6dcf0';
    for (const id of ['world-number', 'world-name']) {
        const style = element(id).style;
        style.color = selectedWorld.menu?.headingColor || '';
        style.webkitTextStroke = selectedWorld.menu?.headingStroke || '';
        style.textShadow = selectedWorld.menu?.headingShadow || '';
    }
    element('world-number').textContent = `${worldId}.`;
    element('world-name').textContent = " "+selectedWorld.title;
    element<HTMLButtonElement>('previous-world').disabled = selectedIndex === 0;
    element<HTMLButtonElement>('next-world').disabled = selectedIndex === worlds.length - 1;
    for (const button of worldTabs.querySelectorAll('button')) {
        const world = worlds.find(world => world.id === Number(button.dataset.world))!;
        const worldLocked = !levels[world.start] || world.start >= unlocked;
        button.setAttribute('aria-pressed', String(world.id === worldId));
        button.classList.toggle('locked', worldLocked);
        button.setAttribute('aria-label', `Dünya ${world.id}: ${world.title}${worldLocked ? ' · Kilitli' : ''}`);
    }
    updateLevelLocks(levelGrid, unlocked);
}

function updateLevelLocks(levelGrid, unlocked) {
    for (const button of levelGrid.querySelectorAll('button')) {
        const index = Number(button.value);
        const ready = isPlayableLevel(index);
        button.disabled = !ready || index >= unlocked;
        if (button.disabled) button.setAttribute('aria-current', 'false');
        button.classList.toggle('locked', button.disabled);
        button.classList.toggle('completed', ready && index < unlocked - 1);
        const bossLabel = levels[index]?.boss ? ' · Boss' : '';
        const lockLabel = !ready ? ' · Hazırlanıyor · Kilitli' : button.disabled ? ' · Kilitli' : '';
        button.setAttribute('aria-label', `${chapterNumber(index)}. bölüm${bossLabel}${lockLabel}`);
    }
}
