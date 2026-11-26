// Dünya sayfalarının gezinmesini, başlıklarını ve kilitli bölüm seçiminin engellenmesini doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorldMenu, createLevelMenu, refreshLevelLocks, slideWorld } from '../.build/src/ui/levelMenu.js';
import { levels, worlds, worldForLevel } from '../.build/src/world/levels/level.js';

function element(tag = 'div') {
    const node = {
        tag, children: [], dataset: {}, attributes: {},
        style: { setProperty() {} }, classList: { toggle() {}, add() {} },
        append(...children) { for (const child of children) { child.parentElement = this; this.children.push(child); } },
        replaceChildren() { this.children = []; },
        setAttribute(name, value) { this.attributes[name] = value; },
        querySelectorAll(tag) { return this.children.flatMap(child => [...(child.tag === tag ? [child] : []), ...child.querySelectorAll(tag)]); }
    };
    return node;
}

test('World pages show names, preserve locks, and navigate using arrows and dots', () => {
    const previousDocument = globalThis.document;
    const previousWindow = globalThis.window;
    const ids = ['character-select', 'world-number', 'world-name', 'previous-world', 'next-world'];
    const nodes = new Map(ids.map(id => [id, element()]));
    const tabs = element();
    const grid = element();
    let saved = '1';
    let selected;
    const started = [];
    globalThis.document = { createElement: element, getElementById: id => nodes.get(id) };
    globalThis.window = { localStorage: { getItem: () => saved } };
    const selectWorld = id => {
        selected = id;
        createLevelMenu(grid, id, undefined, index => started.push(index));
        refreshLevelLocks(tabs, grid, id);
    };
    try {
        createWorldMenu(tabs, selectWorld);
        assert.equal(tabs.querySelectorAll('button').length, 6);
        selectWorld(1);
        assert.equal(nodes.get('world-name').textContent.trim(), 'Meyve Rüyası');
        assert.equal(nodes.get('world-number').textContent, '1.');
        assert.equal(nodes.get('previous-world').disabled, true);
        assert.equal(grid.querySelectorAll('button').filter(button => !button.disabled).length, 1);
        grid.querySelectorAll('button')[0].onclick();
        assert.deepEqual(started, [0]);
        nodes.get('next-world').onclick();
        assert.equal(selected, 2);
        assert.equal(grid.children[0].children[0].children[0].textContent, '16');
        assert.equal(nodes.get('world-name').textContent.trim(), 'Gece Karanlığı');
        assert.equal(nodes.get('world-number').textContent, '2.');
        assert.ok(grid.querySelectorAll('button').every(button => button.disabled && button.attributes['aria-current'] === 'false'));
        grid.querySelectorAll('button')[0].onclick();
        assert.deepEqual(started, [0], 'Locked chapters must not start');
        tabs.querySelectorAll('button')[5].onclick();
        assert.equal(selected, 6);
        assert.equal(nodes.get('next-world').disabled, true);
        saved = '16';
        selectWorld(2);
        assert.equal(grid.querySelectorAll('button')[0].disabled, false);
        assert.equal(grid.querySelectorAll('button')[0].attributes['aria-current'], 'true');
        grid.querySelectorAll('button')[0].onclick();
        assert.deepEqual(started, [0, 15]);
        saved = '17';
        selectWorld(2);
        assert.equal(grid.querySelectorAll('button')[1].disabled, false, 'Completing 16 unlocks 17');
        assert.equal(grid.querySelectorAll('button')[2].disabled, true, '18 remains locked until 17 is complete');
        nodes.get('previous-world').onclick();
        assert.equal(selected, 1);
        assert.equal(tabs.querySelectorAll('button')[0].attributes['aria-pressed'], 'true');
        // Eski kayıt yüksek olsa da henüz yazılmayan bölümler açılamaz.
        saved = '90';
        // Gerçek bölümün yayın durumundan bağımsız olarak taslak kilidini doğrula.
        const draftIndex = levels.length - 1;
        const publishedLevel = levels[draftIndex];
        levels[draftIndex] = { ...publishedLevel, draft: true };
        try {
            selectWorld(worldForLevel(draftIndex).id);
            const draftButton = grid.querySelectorAll('button').find(button => Number(button.value) === draftIndex);
            assert.equal(draftButton.disabled, true, 'Draft chapters stay locked even with maximum saved progress');
            assert.match(draftButton.attributes['aria-label'], /Hazırlanıyor/);
            draftButton.onclick();
            assert.deepEqual(started, [0, 15], 'Draft chapters cannot start scenes');
        } finally { levels[draftIndex] = publishedLevel; }
        for (const world of worlds) {
            selectWorld(world.id);
            const buttons = grid.querySelectorAll('button');
            assert.equal(buttons.length, 15);
            assert.deepEqual(buttons.map(button => Number(button.value)), Array.from({ length: 15 }, (_, i) => world.start + i));
            for (const button of buttons) {
                if (!levels[Number(button.value)]) {
                    assert.equal(button.disabled, true);
                    assert.match(button.attributes['aria-label'], /Hazırlanıyor/);
                    button.onclick();
                }
            }
        }
        assert.deepEqual(started, [0, 15], 'Placeholder buttons cannot start scenes');
        // Sonraki bölüm eklendiğinde aynı menü yeri otomatik olarak oynanabilir olur.
        const nextIndex = 60;
        levels[nextIndex] = levels[0];
        try {
            selectWorld(worldForLevel(nextIndex).id);
            const nextButton = grid.querySelectorAll('button').find(button => Number(button.value) === nextIndex);
            assert.equal(nextButton.disabled, false);
            nextButton.onclick();
            assert.deepEqual(started, [0, 15, nextIndex]);
        } finally { delete levels[nextIndex]; }
    } finally {
        globalThis.document = previousDocument;
        globalThis.window = previousWindow;
    }
});

test('A tapped chapter finishes its press animation before starting and ignores repeated taps', async () => {
    const previousDocument = globalThis.document;
    const previousWindow = globalThis.window;
    globalThis.document = { createElement: element };
    globalThis.window = { localStorage: { getItem: () => '1' } };
    try {
        const grid = element();
        const started = [];
        createLevelMenu(grid, 1, undefined, index => started.push(index));
        const button = grid.querySelectorAll('button')[0];
        let finish;
        const finished = new Promise(resolve => { finish = resolve; });
        button.getAnimations = () => [{ playState: 'running', finished }];
        button.onclick();
        button.onclick();
        assert.deepEqual(started, []);
        finish();
        await finished;
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(started, [0]);
    } finally {
        globalThis.document = previousDocument;
        globalThis.window = previousWindow;
    }
});

test('World pages slide in opposite directions, block overlapping transitions and release temporary content', async () => {
    const previousDocument = globalThis.document;
    const previousWindow = globalThis.window;
    const previousMatchMedia = globalThis.matchMedia;
    const previousGetComputedStyle = globalThis.getComputedStyle;
    const animations = [];
    const viewport = element();
    let reducedMotion = false;
    function animatedElement(tag) {
        const node = element(tag);
        node.remove = () => { node.parentElement.children = node.parentElement.children.filter(child => child !== node); };
        node.animate = frames => {
            let finish;
            const animation = { finished: new Promise(resolve => { finish = resolve; }), cancel() { this.cancelled = true; } };
            animations.push({ frames, finish, animation });
            return animation;
        };
        return node;
    }
    const grid = animatedElement();
    const panel = animatedElement();
    viewport.append(grid);
    globalThis.document = { createElement: animatedElement, getElementById: () => panel };
    globalThis.getComputedStyle = () => ({ background: 'old-world-background' });
    globalThis.window = { localStorage: { getItem: () => '1' } };
    globalThis.matchMedia = () => ({ matches: reducedMotion });
    let displayedWorld = 1;
    try {
        const moving = slideWorld(grid, 1, 2, () => { displayedWorld = 2; });
        assert.equal(displayedWorld, 2, 'Update heading and background as the new buttons start sliding in');
        assert.equal(grid.inert, true);
        assert.equal(viewport.children.length, 2);
        const preview = viewport.children[1];
        assert.equal(preview.inert, true);
        assert.equal(preview.attributes['aria-hidden'], 'true');
        assert.equal(preview.querySelectorAll('button').length, 15);
        assert.equal(preview.querySelectorAll('button')[0].value, '0', 'The outgoing preview keeps the previous world buttons');
        assert.equal(animations[0].frames[1].transform, 'translateX(-100%)');
        assert.equal(animations[1].frames[0].transform, 'translateX(100%)');
        assert.equal(panel.children[0].style.background, 'old-world-background');
        assert.deepEqual(animations[2].frames, [{ opacity: 1 }, { opacity: 0 }]);
        await slideWorld(grid, 1, 3, () => { throw new Error('Cannot start two transitions together'); });
        animations.forEach(animation => animation.finish());
        await moving;
        assert.equal(displayedWorld, 2);
        assert.equal(grid.inert, false);
        assert.equal(grid.dataset.sliding, undefined);
        assert.equal(viewport.children.length, 1);
        assert.equal(panel.children.length, 0, 'Remove the old background after fading');
        assert.ok(animations.every(({ animation }) => animation.cancelled));
        const returning = slideWorld(grid, 2, 1, () => { displayedWorld = 1; });
        assert.equal(animations[3].frames[1].transform, 'translateX(100%)');
        assert.equal(animations[4].frames[0].transform, 'translateX(-100%)');
        animations.slice(3).forEach(animation => animation.finish());
        await returning;
        reducedMotion = true;
        await slideWorld(grid, 1, 5, () => { displayedWorld = 5; });
        assert.equal(displayedWorld, 5);
        assert.equal(animations.length, 6, 'Reduced motion changes worlds immediately');
        assert.equal(viewport.children.length, 1);
    } finally {
        globalThis.document = previousDocument;
        globalThis.window = previousWindow;
        globalThis.matchMedia = previousMatchMedia;
        globalThis.getComputedStyle = previousGetComputedStyle;
    }
});
