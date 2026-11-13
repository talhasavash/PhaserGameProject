import test from 'node:test';
import assert from 'node:assert/strict';
import { bindTouchControls } from '../src/controls.js';

function fixture() {
    const root = new EventTarget();
    const page = new EventTarget();
    const buttons = {};
    for (const id of ['move-left', 'move-right', 'jump']) {
        const button = new EventTarget();
        button.classList = { add() {}, toggle() {} };
        button.setPointerCapture = () => {};
        button.getBoundingClientRect = () => id === 'move-left'
            ? { left: 0, right: 80, top: 0, bottom: 80 }
            : { left: 100, right: 180, top: 0, bottom: 80 };
        buttons[id] = button;
    }
    root.getElementById = id => buttons[id];
    const controls = bindTouchControls(root, page);
    function send(id, type, pointerId, position = {}) {
        const event = new Event(type, { cancelable: true });
        Object.assign(event, { pointerId, button: 0, ...position });
        buttons[id].dispatchEvent(event);
    }
    return { controls, send, root, page };
}

test('Two fingers can walk and jump independently; cancelling one does not release the other', () => {
    const { controls, send } = fixture();
    send('move-right', 'pointerdown', 1);
    send('jump', 'pointerdown', 2);
    assert.equal(controls.keys.right.isDown, true);
    assert.equal(controls.keys.up.isDown, true);
    send('jump', 'pointercancel', 2);
    assert.equal(controls.keys.up.isDown, false);
    assert.equal(controls.keys.right.isDown, true);
    send('move-right', 'lostpointercapture', 1);
    assert.equal(controls.keys.right.isDown, false);
    controls.destroy();
});

test('A quick jump tap is remembered even when released before the next frame', () => {
    const { controls, send } = fixture();
    send('move-right', 'pointerdown', 1);
    send('jump', 'pointerdown', 2);
    send('jump', 'pointerup', 2);
    send('jump', 'lostpointercapture', 2);
    assert.equal(controls.keys.up.isDown, false);
    assert.equal(controls.keys.up.justPressed, true);
    assert.equal(controls.keys.right.isDown, true);
    controls.reset();
    assert.equal(controls.keys.up.justPressed, false);
    controls.destroy();
});

test('Sliding a direction finger reverses direction without releasing a held jump', () => {
    const { controls, send } = fixture();
    send('move-left', 'pointerdown', 1);
    send('jump', 'pointerdown', 2);
    send('move-left', 'pointermove', 1, { clientX: 130, clientY: 40, button: -1 });
    send('move-left', 'lostpointercapture', 1);
    assert.equal(controls.keys.left.isDown, false);
    assert.equal(controls.keys.right.isDown, true);
    assert.equal(controls.keys.up.isDown, true);
    send('move-right', 'pointerup', 1);
    assert.equal(controls.keys.right.isDown, false);
    assert.equal(controls.keys.up.isDown, true);
    controls.destroy();
});

test('Losing focus, hiding the page, and restarting cannot leave a direction stuck', () => {
    const { controls, send, page, root } = fixture();
    send('move-left', 'pointerdown', 1);
    page.dispatchEvent(new Event('blur'));
    assert.equal(controls.keys.left.isDown, false);
    send('move-right', 'pointerdown', 2);
    root.hidden = true;
    root.dispatchEvent(new Event('visibilitychange'));
    assert.equal(controls.keys.right.isDown, false);
    controls.destroy();
    send('move-left', 'pointerdown', 3);
    assert.equal(controls.keys.left.isDown, false);
});
