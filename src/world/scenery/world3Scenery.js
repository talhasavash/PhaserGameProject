// Dünya 3'e özel arka plan tasarımının paletini ve çizim girişini içerir.


const palettes = {
    journey: { sky: 0xcbe8f6, far: 0xa6bddb, near: 0x708fb3, earth: 0x92715d, edge: 0x9fc67b, trunk:0x80634f, leaf:0x5c9575 },
};

export function createWorldThreeScenery(scene, width, theme) {

    const p = palettes[theme];
    if (!p) return false;

    scene.cameras.main.setBackgroundColor(p.sky);
    scene.add.rectangle(width / 2, 560, width, 80, p.earth).setDepth(-5);
    scene.add.rectangle(width / 2, 524, width, 8, p.edge).setDepth(-4);

    //Güneş
    scene.add.circle(650, 150, 60, 0xffdf87).setDepth(-90).setScrollFactor(0.08);

    // Bulutlar
    for (let x = 200; x < width; x += 500) {
        createCloud(scene, x, 150);
    }

    // Uzak tepeler
    for (let x = 0; x < width + 1200; x += 900) {
        scene.add.ellipse(x, 520, 1200, 440, p.far).setDepth(-70).setScrollFactor(0.3);
    }

    // Yakın tepeler
    for (let x = 200; x < width + 900; x += 700) {
        scene.add.ellipse(x, 560, 900, 280, p.near).setDepth(-60).setScrollFactor(0.5);
    }

    // Ağaçlar
    for (let x = 250; x < width+600; x += 600) {
        createTree(scene, x, 520, p);
    }

    return true;
}

function createCloud(scene, x, y) {
    const cloud = scene.add.container(x, y);
    cloud.setDepth(-80).setScrollFactor(0.18);
    cloud.add(scene.add.ellipse(0, 15, 120, 30, 0xf5faf3));
    cloud.add(scene.add.ellipse(-25, 0, 55, 45, 0xf5faf3));
    cloud.add(scene.add.ellipse(20,	-5,	65,	50, 0xf5faf3));
}

function createTree(scene, x, y, p) {
    const tree = scene.add.container(x, y).setDepth(-40).setScrollFactor(0.75, 1);
    tree.add(scene.add.rectangle(0, -60, 16, 120, p.trunk));
    tree.add(scene.add.ellipse(0, -150, 110,130, p.leaf));
    tree.add(scene.add.ellipse(-35, -120, 85,95, p.leaf));
    tree.add(scene.add.ellipse(35, -120, 85,95, p.leaf));

}









