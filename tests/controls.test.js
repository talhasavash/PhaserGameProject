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
        buttons[id] = button;
    }
    root.getElementById = id => buttons[id];
    const controls = bindTouchControls(root, page);
    function send(id, type, pointerId) {
        const event = new Event(type, { cancelable: true });
        Object.assign(event, { pointerId, button: 0 });
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
