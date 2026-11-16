// Dünya ve bölüm seçim düğmelerini oluşturur; açılan ve kilitli bölümlerin görünümünü günceller.
import { levels, worlds, chapterNumber, LEVEL_SLOT_COUNT } from '../world/levels/level.js';
import { unlockedLevels } from '../data/progress.js';

// Bu dosya yalnızca HTML seçimlerini kurar; seçilen dünya game.js içinde tutulur.
export function createWorldMenu(worldTabs, selectWorld) {
    for (const world of worlds) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.world = world.id;
        button.onclick = () => selectWorld(world.id);
        worldTabs.append(button);
    }
    for (const [id, direction] of [['previous-world', -1], ['next-world', 1]]) {
        document.getElementById(id).onclick = () => {
            const index = worlds.findIndex(world => world.id === Number(worldTabs.dataset.selected));
            const next = worlds[index + direction];
            if (next) selectWorld(next.id);
        };
    }
}

export function createLevelMenu(levelGrid, worldId, preferredIndex, startLevel = () => {}) {
    const world = worlds.find(world => world.id === worldId);
    levelGrid.replaceChildren();
    levelGrid.dataset.world = world.id;
    levelGrid.style.setProperty('--level-columns', Math.min(5, world.count));
    for (let localIndex = 0; localIndex < world.count; localIndex++) {
        const index = world.start + localIndex;
        const level = levels[index];
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'level-option';
        button.dataset.theme = level?.theme || '';
        button.value = index;
        button.disabled = !level;
        button.setAttribute('aria-current', String(index === (preferredIndex ?? world.start)));
        button.onclick = () => { if (!button.disabled) startLevel(index); };
        if (level?.boss) button.classList.add('boss-level');
        const card = document.createElement('span');
        card.className = 'level-card';
        const number = document.createElement('strong');
        number.textContent = chapterNumber(index);
        card.append(number);
        button.append(card);
        levelGrid.append(button);
    }
}

export function refreshLevelLocks(worldTabs, levelGrid, worldId) {
    const unlocked = unlockedLevels(LEVEL_SLOT_COUNT);
    const selectedWorld = worlds.find(world => world.id === worldId);
    const selectedIndex = worlds.indexOf(selectedWorld);
    worldTabs.dataset.selected = worldId;
    document.getElementById('character-select').dataset.world = worldId;
    document.getElementById('world-number').textContent = `${worldId}.`;
    document.getElementById('world-name').textContent = " "+selectedWorld.title;
    document.getElementById('previous-world').disabled = selectedIndex === 0;
    document.getElementById('next-world').disabled = selectedIndex === worlds.length - 1;
    for (const button of worldTabs.querySelectorAll('button')) {
        const world = worlds.find(world => world.id === Number(button.dataset.world));
        const worldLocked = !levels[world.start] || world.start >= unlocked;
        button.setAttribute('aria-pressed', String(world.id === worldId));
        button.classList.toggle('locked', worldLocked);
        button.setAttribute('aria-label', `Dünya ${world.id}: ${world.title}${worldLocked ? ' · Kilitli' : ''}`);
    }
    for (const button of levelGrid.querySelectorAll('button')) {
        const index = Number(button.value);
        const ready = Boolean(levels[index]);
        button.disabled = !ready || index >= unlocked;
        if (button.disabled) button.setAttribute('aria-current', 'false');
        button.classList.toggle('locked', button.disabled);
        button.classList.toggle('completed', ready && index < unlocked - 1);
        const bossLabel = levels[index]?.boss ? ' · Boss' : '';
        const lockLabel = !ready ? ' · Hazırlanıyor · Kilitli' : button.disabled ? ' · Kilitli' : '';
        button.setAttribute('aria-label', `${chapterNumber(index)}. bölüm${bossLabel}${lockLabel}`);
    }
}
