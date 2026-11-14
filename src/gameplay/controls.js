// Her parmağın kimliği ayrı tutulur. İkinci parmak yön tuşunu bırakmış sayılmaz.
export function bindTouchControls(root = document, page = window) {
    const keys = {};
    const buttons = {};
    const fingers = {};
    const owners = new Map();
    const cleanup = [];
    const nativeTouch = (page.navigator?.maxTouchPoints || 0) > 0 && 'ontouchstart' in page;
    for (const [action, id] of [['left', 'move-left'], ['right', 'move-right'], ['up', 'jump']]) {
        keys[action] = { isDown: false, timeDown: 0, justPressed: false };
        buttons[action] = root.getElementById(id);
        fingers[action] = new Set();
    }
    function show(action) {
        keys[action].isDown = fingers[action].size > 0;
        buttons[action].classList.toggle('pressed', keys[action].isDown);
    }
    function release(id, cancelled = false) {
        const action = owners.get(id);
        if (!action) return;
        fingers[action].delete(id);
        owners.delete(id);
        if (cancelled && fingers[action].size === 0) keys[action].justPressed = false;
        show(action);
    }
    function press(id, action) {
        if (owners.get(id) === action) return;
        release(id);
        owners.set(id, action);
        fingers[action].add(id);
        keys[action].timeDown = performance.now();
        keys[action].justPressed = true;
        show(action);
    }
    function slide(id, x, y) {
        const action = owners.get(id);
        if (!action || action === 'up') return;
        const other = action === 'left' ? 'right' : 'left';
        const box = buttons[other].getBoundingClientRect();
        if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
            press(id, other);
            if (!nativeTouch) buttons[other].setPointerCapture(id);
        }
    }
    function listen(target, type, handler, options) {
        target.addEventListener(type, handler, options);
        cleanup.push(() => target.removeEventListener(type, handler, options));
    }
    for (const action of ['left', 'right', 'up']) {
        const button = buttons[action];
        if (nativeTouch) {
            // Dokunmatik ekranı olan bir bilgisayarda fare de kullanılabilir.
            listen(button, 'mousedown', event => {
                if (event.button !== 0) return;
                event.preventDefault();
                press('mouse', action);
            });
            // Android/iOS: yalnızca bu olayda değişen parmakları işle.
            listen(button, 'touchstart', event => {
                event.preventDefault();
                for (const touch of event.changedTouches) press(touch.identifier, action);
            }, { passive: false });
            listen(button, 'touchmove', event => {
                event.preventDefault();
                for (const touch of event.changedTouches) slide(touch.identifier, touch.clientX, touch.clientY);
            }, { passive: false });
            for (const type of ['touchend', 'touchcancel']) {
                listen(button, type, event => {
                    event.preventDefault();
                    for (const touch of event.changedTouches) release(touch.identifier, type === 'touchcancel');
                }, { passive: false });
            }
        } else {
            listen(button, 'pointerdown', event => {
                // Dokunmada ikinci parmağı mouse düğmesi filtresiyle eleme.
                if (event.pointerType !== 'touch' && event.button !== 0) return;
                event.preventDefault();
                press(event.pointerId, action);
                button.setPointerCapture(event.pointerId);
            });
            listen(button, 'pointermove', event => slide(event.pointerId, event.clientX, event.clientY));
            for (const type of ['pointerup', 'pointercancel']) {
                listen(button, type, event => release(event.pointerId, type === 'pointercancel'));
            }
            listen(button, 'lostpointercapture', event => {
                if (owners.get(event.pointerId) === action) release(event.pointerId);
            });
        }
    }
    if (nativeTouch) {
        listen(page, 'mousemove', event => slide('mouse', event.clientX, event.clientY));
        listen(page, 'mouseup', () => release('mouse'));
    }
    function reset() {
        for (const id of owners.keys()) release(id);
        for (const key of Object.values(keys)) key.justPressed = false;
    }
    listen(page, 'blur', reset);
    listen(root, 'visibilitychange', () => { if (root.hidden) reset(); });
    return { keys, reset, destroy() { reset(); for (const remove of cleanup) remove(); } };
}
