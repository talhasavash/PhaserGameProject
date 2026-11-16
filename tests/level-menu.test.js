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
    Object.defineProperty(node, 'defaultChecked', { set(value) { this.checked = value; } });
    return node;
}

test('World pages show names, preserve locks, and navigate using arrows and dots', () => {
    const previousDocument = globalThis.document;
    const previousWindow = globalThis.window;
    const ids = ['character-select', 'world-number', 'world-name', 'world-lock', 'previous-world', 'next-world'];
    const nodes = new Map(ids.map(id => [id, element()]));
    const tabs = element();
    const grid = element();
    let saved = '1';
    let selected;
    globalThis.document = { createElement: element, getElementById: id => nodes.get(id) };
    globalThis.window = { localStorage: { getItem: () => saved } };
    const selectWorld = id => {
        selected = id;
        createLevelMenu(grid, id);
        refreshLevelLocks(tabs, grid, id);
    };
    try {
        createWorldMenu(tabs, selectWorld);
        selectWorld(1);
        assert.equal(nodes.get('world-name').textContent, 'Bahçeler ve Geçitler');
        assert.equal(nodes.get('previous-world').disabled, true);
        assert.equal(grid.querySelectorAll('input').filter(input => !input.disabled).length, 1);
        nodes.get('next-world').onclick();
        assert.equal(selected, 2);
        assert.equal(nodes.get('world-name').textContent, 'Gölge Diyarları');
        assert.equal(nodes.get('world-lock').hidden, false);
        assert.ok(grid.querySelectorAll('input').every(input => input.disabled && !input.checked));
        tabs.querySelectorAll('button')[2].onclick();
        assert.equal(selected, 3);
        assert.equal(nodes.get('next-world').disabled, true);
        saved = '16';
        selectWorld(3);
        assert.equal(nodes.get('world-lock').hidden, true);
        assert.equal(grid.querySelectorAll('input')[0].disabled, false);
        assert.equal(grid.querySelectorAll('input')[0].checked, true);
        nodes.get('previous-world').onclick();
        assert.equal(selected, 2);
        assert.equal(tabs.querySelectorAll('button')[1].attributes['aria-pressed'], 'true');
    } finally {
        globalThis.document = previousDocument;
        globalThis.window = previousWindow;
    }
});
