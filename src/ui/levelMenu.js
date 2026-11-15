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
}

export function createLevelMenu(levelGrid, worldId, preferredIndex) {
    const world = worlds[worldId];
    levelGrid.replaceChildren();
    levelGrid.dataset.world = world.id;
    levels.slice(world.start, world.start + world.count).forEach((level, localIndex) => {
        const index = world.start + localIndex;
        const label = document.createElement('label');
        label.className = 'level-option';
        label.dataset.theme = level.theme;
        if (level.boss) label.classList.add('boss-level');
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'level';
        input.value = index;
        input.required = true;
        input.defaultChecked = index === (preferredIndex ?? world.start);
        const card = document.createElement('span');
        card.className = 'level-card';
        const number = document.createElement('strong');
        number.textContent = localIndex + 1;
        card.append(number);
        label.append(input, card);
        levelGrid.append(label);
    });
}

export function refreshLevelLocks(worldTabs, levelGrid, worldId) {
    const unlocked = unlockedLevels(levels.length);
    for (const button of worldTabs.querySelectorAll('button')) {
        const world = worlds[Number(button.dataset.world)];
        button.disabled = world.start >= unlocked;
        button.setAttribute('aria-pressed', String(world.id === worldId));
        button.textContent = `Dünya ${world.id}${button.disabled ? ' 🔒' : ''}`;
        button.setAttribute('aria-label', `Dünya ${world.id}${button.disabled ? ' · Dünya 0 tamamlanınca açılır' : ''}`);
    }
    for (const input of levelGrid.querySelectorAll('input')) {
        const index = Number(input.value);
        input.disabled = index >= unlocked;
        input.parentElement.classList.toggle('locked', input.disabled);
        const bossLabel = levels[index].boss ? ' · Boss' : '';
        const lockLabel = input.disabled ? ' · Kilitli' : '';
        const localNumber = index - worlds[worldId].start + 1;
        input.setAttribute('aria-label', `${localNumber}. bölüm${bossLabel}${lockLabel}`);
    }
}
