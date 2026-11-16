// Dünya ve bölüm seçim düğmelerini oluşturur; açılan ve kilitli bölümlerin görünümünü günceller.
import { levels, worlds } from '../world/levels/level.js';
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
    levels.slice(world.start, world.start + world.count).forEach((level, localIndex) => {
        const index = world.start + localIndex;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'level-option';
        button.dataset.theme = level.theme;
        button.value = index;
        button.setAttribute('aria-current', String(index === (preferredIndex ?? world.start)));
        button.onclick = () => { if (!button.disabled) startLevel(index); };
        if (level.boss) button.classList.add('boss-level');
        const card = document.createElement('span');
        card.className = 'level-card';
        const number = document.createElement('strong');
        number.textContent = localIndex + 1;
        card.append(number);
        button.append(card);
        levelGrid.append(button);
    });
}

export function refreshLevelLocks(worldTabs, levelGrid, worldId) {
    const unlocked = unlockedLevels(levels.length);
    const selectedWorld = worlds.find(world => world.id === worldId);
    const selectedIndex = worlds.indexOf(selectedWorld);
    const locked = selectedWorld.start >= unlocked;
    worldTabs.dataset.selected = worldId;
    document.getElementById('character-select').dataset.world = worldId;
    document.getElementById('world-number').textContent = `${worldId}.`;
    document.getElementById('world-name').textContent = selectedWorld.title;
    document.getElementById('world-lock').hidden = !locked;
    document.getElementById('world-lock').textContent = locked ? `Önce Dünya ${worlds[selectedIndex - 1].id}'i tamamla` : '';
    document.getElementById('previous-world').disabled = selectedIndex === 0;
    document.getElementById('next-world').disabled = selectedIndex === worlds.length - 1;
    for (const button of worldTabs.querySelectorAll('button')) {
        const world = worlds.find(world => world.id === Number(button.dataset.world));
        const worldLocked = world.start >= unlocked;
        button.setAttribute('aria-pressed', String(world.id === worldId));
        button.classList.toggle('locked', worldLocked);
        button.setAttribute('aria-label', `Dünya ${world.id}: ${world.title}${worldLocked ? ' · Kilitli' : ''}`);
    }
    for (const button of levelGrid.querySelectorAll('button')) {
        const index = Number(button.value);
        button.disabled = index >= unlocked;
        if (button.disabled) button.setAttribute('aria-current', 'false');
        button.classList.toggle('locked', button.disabled);
        button.classList.toggle('completed', index < unlocked - 1);
        const bossLabel = levels[index].boss ? ' · Boss' : '';
        const lockLabel = button.disabled ? ' · Kilitli' : '';
        const localNumber = index - selectedWorld.start + 1;
        button.setAttribute('aria-label', `${localNumber}. bölüm${bossLabel}${lockLabel}`);
    }
}
