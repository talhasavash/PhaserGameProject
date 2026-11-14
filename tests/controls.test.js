import test from 'node:test';
import assert from 'node:assert/strict';
import { bindTouchControls } from '../src/gameplay/controls.js';

function fixture(nativeTouch = false) {
    const root = new EventTarget();
    const page = new EventTarget();
    page.navigator = { maxTouchPoints: nativeTouch ? 5 : 0 };
    if (nativeTouch) page.ontouchstart = null;
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
    function touch(id, type, changedTouches, touches = []) {
        const event = new Event(type, { cancelable: true });
        Object.assign(event, { changedTouches, touches });
        buttons[id].dispatchEvent(event);
    }
    return { controls, send, touch, root, page };
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

test('Native phone touches keep direction held through repeated jump presses and releases', () => {
    const { controls, touch } = fixture(true);
    const direction = { identifier: 10 };
    const jump = { identifier: 20 };
    touch('move-right', 'touchstart', [direction], [direction]);
    for (let attempt = 0; attempt < 8; attempt++) {
        touch('jump', 'touchstart', [jump], [direction, jump]);
        assert.equal(controls.keys.right.isDown, true);
        assert.equal(controls.keys.up.isDown, true);
        assert.equal(controls.keys.up.justPressed, true);
        controls.keys.up.justPressed = false;
        touch('jump', 'touchend', [jump], [direction]);
        assert.equal(controls.keys.up.isDown, false);
        assert.equal(controls.keys.right.isDown, true);
    }
    touch('move-right', 'touchend', [direction]);
    assert.equal(controls.keys.right.isDown, false);
    controls.destroy();
});

test('Native touch direction can slide, while another finger remains on jump', () => {
    const { controls, touch } = fixture(true);
    touch('move-left', 'touchstart', [{ identifier: 1 }]);
    touch('jump', 'touchstart', [{ identifier: 2 }]);
    touch('move-left', 'touchmove', [{ identifier: 1, clientX: 120, clientY: 40 }]);
    assert.equal(controls.keys.right.isDown, true);
    assert.equal(controls.keys.left.isDown, false);
    touch('move-left', 'touchend', [{ identifier: 1 }]);
    assert.equal(controls.keys.right.isDown, false);
    assert.equal(controls.keys.up.isDown, true);
    touch('jump', 'touchcancel', [{ identifier: 2 }]);
    assert.equal(controls.keys.up.isDown, false);
    controls.destroy();
});

test('A non-primary touch pointer is accepted even with button -1', () => {
    const { controls, send } = fixture();
    send('move-right', 'pointerdown', 1);
    send('jump', 'pointerdown', 2, { pointerType: 'touch', isPrimary: false, button: -1 });
    assert.equal(controls.keys.up.isDown, true);
    assert.equal(controls.keys.right.isDown, true);
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
