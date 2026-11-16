// Dünya sayfalarının gezinmesini, başlıklarını ve kilitli bölüm seçiminin engellenmesini doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorldMenu, createLevelMenu, refreshLevelLocks, slideWorld } from '../src/ui/levelMenu.js';
import { levels, worlds } from '../src/world/levels/level.js';

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
        assert.equal(tabs.querySelectorAll('button').length, 5);
        selectWorld(1);
        assert.equal(nodes.get('world-name').textContent.trim(), 'Meyve Rüyası');
        assert.equal(nodes.get('world-number').textContent, '1.');
        assert.equal(nodes.get('previous-world').disabled, true);
        assert.equal(grid.querySelectorAll('button').filter(button => !button.disabled).length, 1);
        grid.querySelectorAll('button')[0].onclick();
        assert.deepEqual(started, [0]);
        nodes.get('next-world').onclick();
        assert.equal(selected, 2);
        assert.equal(grid.children[0].children[0].children[0].textContent, 16);
        assert.equal(nodes.get('world-name').textContent.trim(), 'Gece Karanlığı');
        assert.equal(nodes.get('world-number').textContent, '2.');
        assert.ok(grid.querySelectorAll('button').every(button => button.disabled && button.attributes['aria-current'] === 'false'));
        grid.querySelectorAll('button')[0].onclick();
        assert.deepEqual(started, [0], 'Locked chapters must not start');
        tabs.querySelectorAll('button')[4].onclick();
        assert.equal(selected, 5);
        assert.equal(nodes.get('next-world').disabled, true);
        saved = '16';
        selectWorld(2);
        assert.equal(grid.querySelectorAll('button')[0].disabled, false);
        assert.equal(grid.querySelectorAll('button')[0].attributes['aria-current'], 'true');
        grid.querySelectorAll('button')[0].onclick();
        assert.deepEqual(started, [0, 15]);
        nodes.get('previous-world').onclick();
        assert.equal(selected, 1);
        assert.equal(tabs.querySelectorAll('button')[0].attributes['aria-pressed'], 'true');
        // Eski kayıt yüksek olsa da henüz yazılmayan bölümler açılamaz.
        saved = '75';
        for (const world of worlds) {
            selectWorld(world.id);
            const buttons = grid.querySelectorAll('button');
            assert.equal(buttons.length, 15);
            assert.deepEqual(buttons.map(button => Number(button.value)), Array.from({ length: 15 }, (_, i) => world.start + i));
            for (const button of buttons) {
                if (Number(button.value) >= levels.length) {
                    assert.equal(button.disabled, true);
                    assert.match(button.attributes['aria-label'], /Hazırlanıyor/);
                    button.onclick();
                }
            }
        }
        assert.deepEqual(started, [0, 15], 'Placeholder buttons cannot start scenes');
        // Sonraki bölüm eklendiğinde aynı menü yeri otomatik olarak oynanabilir olur.
        levels.push(levels[0]);
        try {
            selectWorld(2);
            assert.equal(grid.querySelectorAll('button')[1].disabled, false);
            grid.querySelectorAll('button')[1].onclick();
            assert.deepEqual(started, [0, 15, 16]);
        } finally { levels.pop(); }
    } finally {
        globalThis.document = previousDocument;
        globalThis.window = previousWindow;
    }
});

test('World pages slide in opposite directions, block overlapping transitions and release temporary content', async () => {
    const previousDocument = globalThis.document;
    const previousWindow = globalThis.window;
    const previousMatchMedia = globalThis.matchMedia;
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
    viewport.append(grid);
    globalThis.document = { createElement: animatedElement };
    globalThis.window = { localStorage: { getItem: () => '1' } };
    globalThis.matchMedia = () => ({ matches: reducedMotion });
    let displayedWorld = 1;
    try {
        const moving = slideWorld(grid, 1, 2, () => { displayedWorld = 2; });
        assert.equal(displayedWorld, 1, 'Keep the old heading until the slide finishes');
        assert.equal(grid.inert, true);
        assert.equal(viewport.children.length, 2);
        const preview = viewport.children[1];
        assert.equal(preview.inert, true);
        assert.equal(preview.attributes['aria-hidden'], 'true');
        assert.equal(preview.querySelectorAll('button').length, 15);
        assert.equal(animations[0].frames[1].transform, 'translateX(-100%)');
        assert.equal(animations[1].frames[0].transform, 'translateX(100%)');
        await slideWorld(grid, 1, 3, () => { throw new Error('Cannot start two transitions together'); });
        animations.forEach(animation => animation.finish());
        await moving;
        assert.equal(displayedWorld, 2);
        assert.equal(grid.inert, false);
        assert.equal(grid.dataset.sliding, undefined);
        assert.equal(viewport.children.length, 1);
        assert.ok(animations.every(({ animation }) => animation.cancelled));
        const returning = slideWorld(grid, 2, 1, () => { displayedWorld = 1; });
        assert.equal(animations[2].frames[1].transform, 'translateX(100%)');
        assert.equal(animations[3].frames[0].transform, 'translateX(-100%)');
        animations.slice(2).forEach(animation => animation.finish());
        await returning;
        reducedMotion = true;
        await slideWorld(grid, 1, 5, () => { displayedWorld = 5; });
        assert.equal(displayedWorld, 5);
        assert.equal(animations.length, 4, 'Reduced motion changes worlds immediately');
        assert.equal(viewport.children.length, 1);
    } finally {
        globalThis.document = previousDocument;
        globalThis.window = previousWindow;
        globalThis.matchMedia = previousMatchMedia;
    }
});
