// Dünya sayfalarının gezinmesini, başlıklarını ve kilitli bölüm seçiminin engellenmesini doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorldMenu, createLevelMenu, refreshLevelLocks } from '../src/ui/levelMenu.js';

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
        selectWorld(1);
        assert.equal(nodes.get('world-name').textContent, 'Bahçeler ve Geçitler');
        assert.equal(nodes.get('world-number').textContent, '1.');
        assert.equal(nodes.get('previous-world').disabled, true);
        assert.equal(grid.querySelectorAll('button').filter(button => !button.disabled).length, 1);
        grid.querySelectorAll('button')[0].onclick();
        assert.deepEqual(started, [0]);
        nodes.get('next-world').onclick();
        assert.equal(selected, 2);
        assert.equal(grid.children[0].children[0].children[0].textContent, 12);
        assert.equal(nodes.get('world-name').textContent, 'Gölge Diyarları');
        assert.equal(nodes.get('world-number').textContent, '2.');
        assert.ok(grid.querySelectorAll('button').every(button => button.disabled && button.attributes['aria-current'] === 'false'));
        grid.querySelectorAll('button')[0].onclick();
        assert.deepEqual(started, [0], 'Locked chapters must not start');
        tabs.querySelectorAll('button')[2].onclick();
        assert.equal(selected, 3);
        assert.equal(nodes.get('next-world').disabled, true);
        saved = '16';
        selectWorld(3);
        assert.equal(grid.querySelectorAll('button')[0].disabled, false);
        assert.equal(grid.querySelectorAll('button')[0].attributes['aria-current'], 'true');
        grid.querySelectorAll('button')[0].onclick();
        assert.deepEqual(started, [0, 15]);
        nodes.get('previous-world').onclick();
        assert.equal(selected, 2);
        assert.equal(grid.children[0].children[0].children[0].textContent, 12);
        assert.equal(tabs.querySelectorAll('button')[1].attributes['aria-pressed'], 'true');
    } finally {
        globalThis.document = previousDocument;
        globalThis.window = previousWindow;
    }
});
