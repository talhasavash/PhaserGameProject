// Ekran düğmeleri klavye gibi isDown ve timeDown değerleri taşır.
// Her parmağın pointerId'si ayrıdır: yürürken başka parmakla zıplanabilir.
export function bindTouchControls(root = document, page = window) {
    const keys = {};
    const cleanup = [];
    const releases = [];
    for (const [name, id] of [['left', 'move-left'], ['right', 'move-right'], ['up', 'jump']]) {
        const button = root.getElementById(id);
        const key = { isDown: false, timeDown: 0 };
        keys[name] = key;
        const fingers = new Set();
        function release(event) {
            if (event) fingers.delete(event.pointerId);
            else fingers.clear();
            key.isDown = fingers.size > 0;
            button.classList.toggle('pressed', key.isDown);
        }
        function press(event) {
            if (event.button !== 0) return;
            event.preventDefault();
            fingers.add(event.pointerId);
            key.isDown = true;
            key.timeDown = performance.now();
            button.classList.add('pressed');
            // Parmak dışarı kaysa da bırakma olayını al.
            button.setPointerCapture(event.pointerId);
        }
        button.addEventListener('pointerdown', press);
        for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, release);
        releases.push(() => release());
        cleanup.push(() => {
            button.removeEventListener('pointerdown', press);
            for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.removeEventListener(type, release);
        });
    }
    function reset() { for (const release of releases) release(); }
    function visibilityChanged() { if (root.hidden) reset(); }
    page.addEventListener('blur', reset);
    root.addEventListener('visibilitychange', visibilityChanged);
    return {
        keys, reset,
        destroy() {
            reset();
            for (const remove of cleanup) remove();
            page.removeEventListener('blur', reset);
            root.removeEventListener('visibilitychange', visibilityChanged);
        }
    };
}
