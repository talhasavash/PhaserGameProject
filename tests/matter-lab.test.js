// Gerçek Matter motoruyla itme, yığılma, dönme ve köprü fiziğini doğrular; Arcade bölümlerine dokunmaz.
import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from '../node_modules/phaser/src/physics/matter-js/CustomMain.js';
import {createLabWorld, wakeTouchedObjects} from '../.build/examples/matter-lab/MatterObjects.js';
import {matterLab} from '../.build/examples/matter-lab/definition.js';
import {labMotion, moveLabPlayer} from '../.build/examples/matter-lab/movement.js';
import {FixedStepSimulation, labPhysics} from '../.build/examples/matter-lab/simulation.js';
import {renderLabObjects} from '../.build/examples/matter-lab/MatterObjects.js';

function fixture(level = matterLab) {
    const engine = Matter.Engine.create({...labPhysics, gravity: {x: 0, y: labMotion.gravity}});
    const world = createLabWorld(Matter, level, objects => Matter.Composite.add(engine.world, objects));
    for (const event of ['collisionStart', 'collisionActive']) Matter.Events.on(engine, event,
        event => wakeTouchedObjects(Matter, world.player, event.pairs));
    const step = (count, before = () => {}) => {
        for (let i = 0; i < count * 2; i++) { before(i); Matter.Engine.update(engine, FixedStepSimulation.stepMs); }
    };
    return {engine, world, step};
}

test('Matter lab creates isolated worlds and restarting restores every body and hinge', () => {
    const original = JSON.stringify(matterLab);
    const first = fixture();
    first.step(120);
    const second = fixture();
    assert.notEqual(first.world.player, second.world.player);
    assert.equal(second.world.hinges.length, matterLab.hinges.length);
    for (const source of matterLab.objects) {
        const body = second.world.objects.get(source.id).body;
        assert.equal(body.position.x, source.x);
        assert.equal(body.position.y, source.y);
        assert.equal(body.angle, source.angle || 0);
    }
    assert.equal(JSON.stringify(matterLab), original);
});

test('Player contact pushes a crate while the crate and player remain supported by the ground', () => {
    const {world, step} = fixture();
    const crate = world.objects.get('step-crate').body;
    step(120, () => moveLabPlayer(Matter, world.player, 1, true, FixedStepSimulation.stepMs));
    assert.ok(crate.position.x > 520, `crate x=${crate.position.x}`);
    assert.ok(crate.position.x < 720);
    assert.ok(world.player.position.x < crate.position.x);
    assert.ok(crate.bounds.max.y < 523 && world.player.bounds.max.y < 525);
    assert.equal(crate.inertia, Infinity, 'Only the first teaching crate has rotation locked');
});

test('Stacked crates settle and the separate free crate rotates under an off-centre push', () => {
    const {world, step} = fixture();
    step(200);
    const bottom = world.objects.get('stack-bottom').body;
    const top = world.objects.get('stack-top').body;
    assert.ok(top.position.y < bottom.position.y - 60);
    assert.ok(Math.abs(top.position.x - bottom.position.x) < 15);
    const loose = world.objects.get('loose-crate').body;
    Matter.Sleeping.set(loose, false);
    Matter.Body.applyForce(loose, {x: loose.position.x, y: loose.position.y - 30}, {x: .06, y: 0});
    step(15);
    assert.ok(Math.abs(loose.angle) > .15, `angle=${loose.angle}`);
});

test('A pushed stone rolls down the incline instead of sliding as a fixed rectangle', () => {
    const {world, step} = fixture();
    const stone = world.objects.get('rolling-rock').body;
    Matter.Sleeping.set(stone, false);
    Matter.Body.applyForce(stone, stone.position, {x: .02, y: 0});
    step(100);
    assert.ok(stone.position.x > 2670, `stone x=${stone.position.x}`);
    assert.ok(Math.abs(stone.angle) > .3, `stone angle=${stone.angle}`);
});

test('Pushing the upright hinged plank makes a walkable bridge across the whole pit', () => {
    const {world, step} = fixture();
    const plank = world.objects.get('bridge').body;
    step(180);
    assert.equal(plank.isSleeping, true, 'The bridge waits upright until the player actually touches it');
    Matter.Body.setPosition(world.player, {x: 1800, y: 490});
    Matter.Sleeping.set(world.player, false);
    step(240, () => {
        if (world.player.position.x < 1880) moveLabPlayer(Matter, world.player, 1, true, FixedStepSimulation.stepMs);
        else Matter.Body.setVelocity(world.player, {x: 0, y: world.player.velocity.y});
    });
    step(400);
    assert.ok(plank.bounds.min.x < matterLab.gap.x, `left=${plank.bounds.min.x}`);
    assert.ok(plank.bounds.max.x > matterLab.gap.x + matterLab.gap.width, `right=${plank.bounds.max.x}`);
    assert.ok(plank.bounds.max.y - plank.bounds.min.y < 45, `angle=${plank.angle}`);
    assert.ok(plank.position.y < matterLab.groundY);
});

test('Player keeps the main game walking speed without force oscillation or sleeping at rest', () => {
    const {world, step} = fixture();
    step(600);
    assert.equal(world.player.isSleeping, false);
    step(20, () => moveLabPlayer(Matter, world.player, 1, true, FixedStepSimulation.stepMs));
    const start = world.player.position.x;
    step(20, () => {
        moveLabPlayer(Matter, world.player, 1, true, FixedStepSimulation.stepMs);
        assert.ok(Math.abs(world.player.velocity.x - 265 / 60) < .01);
    });
    assert.ok(Math.abs(world.player.position.x - start - 265 / 3) < 1);
});

test('A full jump returns to the floor within 0.8 seconds instead of floating', () => {
    const {world, step} = fixture();
    step(30);
    const start = world.player.position.y;
    let top = start;
    Matter.Body.setVelocity(world.player, {x: 0, y: -labMotion.jump});
    step(48, () => { top = Math.min(top, world.player.position.y); });
    assert.ok(start - top > 95 && start - top < 120, `height=${start - top}`);
    assert.ok(Math.abs(world.player.position.y - start) < 1);
    assert.ok(Math.abs(world.player.velocity.y) < .1);
});

test('Fixed physics steps stay continuous at 60, 90 and 120 Hz and cap catch-up after a stall', () => {
    for (const hz of [60, 90, 120]) {
        const simulation = new FixedStepSimulation();
        let steps = 0;
        for (let i = 0; i < hz * 10; i++) simulation.advance(1000 / hz, () => steps++);
        assert.equal(steps, 1200, `${hz} Hz must simulate ten seconds`);
    }
    const simulation = new FixedStepSimulation();
    let steps = 0;
    simulation.advance(5000, () => steps++);
    assert.equal(steps, 12, 'A long frame must not trigger a spiral of catch-up work');
    simulation.reset();
    assert.equal(simulation.advance(0, () => assert.fail('No paused time to replay')), 0);
});

test('Drawing between physics steps interpolates the image without moving its collision body', () => {
    const body = {position: {x: 20, y: 40}, angle: 1};
    let position, angle;
    const image = {setPosition(x, y) { position = {x, y}; }, setRotation(value) { angle = value; }};
    renderLabObjects([{body, image, previous: {x: 10, y: 20, angle: 0}}], .5);
    assert.deepEqual(position, {x: 15, y: 30});
    assert.equal(angle, .5);
    assert.deepEqual(body.position, {x: 20, y: 40});
});

test('A hill ball accelerates and rotates downhill using gravity after the initial push', () => {
    const {world, step} = fixture({...matterLab,
        objects: matterLab.objects.filter(object => object.id !== 'hill-crate')});
    const ball = world.objects.get('hill-ball').body;
    Matter.Sleeping.set(ball, false);
    Matter.Body.setVelocity(ball, {x: 2, y: 0});
    step(30);
    const upperSpeed = ball.velocity.x;
    step(90);
    assert.ok(ball.position.x > 4500, `ball x=${ball.position.x}`);
    assert.ok(ball.velocity.x > upperSpeed + 1.5);
    assert.ok(Math.abs(ball.angle) > 5);
});

const flatCrateLevel = {
    ...matterLab,
    surfaces: [{x: 2500, y: 570, width: 5000, height: 100}],
    objects: matterLab.objects.filter(object => object.id === 'step-crate'), hinges: [], links: []
};

test('A sustained crate push keeps its speed instead of losing motor strength over time', () => {
    const {world, step} = fixture(flatCrateLevel);
    const crate = world.objects.get('step-crate').body;
    const push = () => moveLabPlayer(Matter, world.player, 1, true, FixedStepSimulation.stepMs);
    step(120, push);
    const firstSpeed = crate.velocity.x;
    let slowest = firstSpeed;
    step(150, () => { push(); slowest = Math.min(slowest, crate.velocity.x); });
    assert.ok(slowest > labMotion.speed * .25, `minimum push speed=${slowest}`);
    assert.ok(Math.abs(crate.velocity.x - firstSpeed) < .15);
});

test('Turning away from a crate does not pull it back toward the player', () => {
    const {world, step} = fixture(flatCrateLevel);
    const crate = world.objects.get('step-crate').body;
    step(100, () => moveLabPlayer(Matter, world.player, 1, true, FixedStepSimulation.stepMs));
    const start = crate.position.x;
    let previous = start;
    let backwards = 0;
    step(120, () => {
        moveLabPlayer(Matter, world.player, -1, true, FixedStepSimulation.stepMs);
        backwards += Math.max(0, previous - crate.position.x);
        previous = crate.position.x;
    });
    assert.ok(backwards < .1, `backwards travel=${backwards}`);
    assert.ok(crate.position.x >= start);
    assert.ok(Math.abs(crate.velocity.x) < .1, 'The wooden crate settles after the push');
});

test('Station 2 crates remain free to tip and separate from the player when direction reverses', () => {
    for (const frames of [30, 45, 60, 90]) {
        const {world, step} = fixture({...matterLab, spawn: matterLab.stations[1].spawn});
        const boxes = ['stack-bottom', 'stack-top'].map(id => world.objects.get(id).body);
        step(frames, () => moveLabPlayer(Matter, world.player, 1, true, FixedStepSimulation.stepMs));
        step(90, () => {
            moveLabPlayer(Matter, world.player, -1, true, FixedStepSimulation.stepMs);
        });
        boxes.forEach(body => {
            assert.ok(Number.isFinite(body.inertia), 'Stacked crates must be allowed to tip');
            // Üst kutu karakterin arkasına düşebilir; geri yürüyen karakter bu kez
            // onu diğer tarafından itebilir. Hiçbir kutu karaktere yapışıp taşınmamalı.
            assert.ok(Math.abs(body.position.x - world.player.position.x) > 30,
                `Station 2, push ${frames} frames: crate overlaps the player`);
        });
        assert.ok(Number.isFinite(world.objects.get('loose-crate').body.inertia),
            'The separate rotation experiment must remain free to turn');
    }
});

test('An overhanging upper crate tips before losing all overlap with the lower crate', () => {
    const {world, step} = fixture({...matterLab,
        objects: matterLab.objects.filter(object => object.id.startsWith('stack-')), hinges: [], links: []});
    step(180);
    const lower = world.objects.get('stack-bottom').body;
    const upper = world.objects.get('stack-top').body;
    const restingY = upper.position.y;
    Matter.Body.setPosition(lower, {x: lower.position.x + 50, y: lower.position.y});
    assert.ok(upper.bounds.max.x > lower.bounds.min.x, 'There is still edge overlap');
    step(30);
    assert.ok(Math.abs(upper.angle) > .2 || upper.position.y > restingY + 10,
        `Upper crate is hanging: angle=${upper.angle}, drop=${upper.position.y - restingY}`);
});

test('The same bounded motor moves small or light crates more easily than large or dense crates', () => {
    const trial = (size, density) => {
        const box = {...flatCrateLevel.objects[0], fixedRotation: false, x: 420,
            y: 520 - size / 2, width: size, height: size, density};
        const {world, step, engine} = fixture({...flatCrateLevel, spawn: {x: 320, y: 485}, objects: [box]});
        Matter.Events.on(engine, 'beforeUpdate', () =>
            assert.ok(Math.abs(world.player.force.x) <= labMotion.maxGroundForce + 1e-10));
        step(120, () => moveLabPlayer(Matter, world.player, 1, true, FixedStepSimulation.stepMs));
        const body = world.objects.get('step-crate').body;
        return {mass: body.mass, distance: body.position.x - 420};
    };
    const light = trial(56, .00015), heavy = trial(56, .0009);
    assert.ok(Math.abs(heavy.mass / light.mass - 6) < .001);
    assert.ok(light.distance > heavy.distance * 1.25, `light=${light.distance}, heavy=${heavy.distance}`);
    const small = trial(44, .00035), large = trial(88, .00035);
    assert.ok(Math.abs(large.mass / small.mass - 4) < .001);
    assert.ok(small.distance > large.distance, `small=${small.distance}, large=${large.distance}`);
});

test('Ordinary horizontal pushing tips a free crate without catapulting it into the air', () => {
    const {world, step} = fixture({...flatCrateLevel,
        objects: flatCrateLevel.objects.map(object => ({...object, fixedRotation: false}))});
    const box = world.objects.get('step-crate').body;
    step(120);
    const restingY = box.position.y;
    let highest = restingY;
    step(240, () => {
        moveLabPlayer(Matter, world.player, 1, true, FixedStepSimulation.stepMs);
        highest = Math.min(highest, box.position.y);
    });
    assert.ok(restingY - highest < 30, `Crate was launched ${restingY - highest}px`);
});

test('A settled upper crate immediately falls when its supporting crate moves away', () => {
    const {world, step} = fixture();
    step(600);
    const bottom = world.objects.get('stack-bottom').body;
    const top = world.objects.get('stack-top').body;
    const restingY = top.position.y;
    assert.equal(top.isSleeping, false);
    Matter.Body.setPosition(bottom, {x: 1600, y: bottom.position.y});
    step(25);
    assert.ok(top.position.y > restingY + 40, `drop=${top.position.y - restingY}`);
    step(120);
    assert.ok(Math.abs(top.bounds.max.y - matterLab.groundY) < .2);
});

test('Standing on a supported plank settles without vertical jitter or sideways drift', () => {
    // Serbest tahterevalli ağırlıkla eğilebilir; sabit tahtada bu hareket beklenmez.
    const {world, step} = fixture({...flatCrateLevel, spawn: {x: 5500, y: 405}, objects: [],
        surfaces: [...flatCrateLevel.surfaces, {x: 5500, y: 444, width: 360, height: 20}]});
    step(240, () => moveLabPlayer(Matter, world.player, 0, true, FixedStepSimulation.stepMs));
    let minY = world.player.position.y, maxY = minY;
    const startX = world.player.position.x;
    step(240, () => {
        moveLabPlayer(Matter, world.player, 0, true, FixedStepSimulation.stepMs);
        minY = Math.min(minY, world.player.position.y);
        maxY = Math.max(maxY, world.player.position.y);
    });
    assert.ok(maxY - minY < .2, `vertical jitter=${maxY - minY}`);
    assert.ok(Math.abs(world.player.position.x - startX) < .1);
});

test('Standing on the fallen bridge remains stable and does not reopen a contact gap', () => {
    const {world, step} = fixture();
    const plank = world.objects.get('bridge').body;
    Matter.Sleeping.set(plank, false);
    Matter.Body.setAngle(plank, Math.PI / 2);
    step(180);
    Matter.Body.setPosition(world.player, {x: 2040, y: 450});
    Matter.Body.setVelocity(world.player, {x: 0, y: 0});
    step(180, () => moveLabPlayer(Matter, world.player, 0, true, FixedStepSimulation.stepMs));
    let minY = world.player.position.y, maxY = minY;
    step(180, () => {
        moveLabPlayer(Matter, world.player, 0, true, FixedStepSimulation.stepMs);
        minY = Math.min(minY, world.player.position.y);
        maxY = Math.max(maxY, world.player.position.y);
    });
    assert.ok(maxY - minY < .3, `bridge standing jitter=${maxY - minY}`);
    assert.ok(world.player.position.y < 470, 'Player remains on the bridge');
});

test('Player weight tips the seesaw while its centre remains attached to the pivot', () => {
    const {world, step} = fixture();
    const plank = world.objects.get('seesaw').body;
    Matter.Body.setPosition(world.player, {x: 5630, y: 360});
    step(150);
    assert.ok(Math.abs(plank.angle) > .15, `angle=${plank.angle}`);
    assert.ok(Math.abs(plank.position.x - 5500) < 2);
    assert.ok(Math.abs(plank.position.y - 444) < 2);
});

test('A rolling ball transfers momentum to the domino row', () => {
    const {world, step} = fixture();
    const ball = world.objects.get('bounce-ball').body;
    Matter.Body.setPosition(ball, {x: 6700, y: 480});
    Matter.Sleeping.set(ball, false);
    Matter.Body.setVelocity(ball, {x: 6, y: 0});
    step(180);
    const fallen = [...world.objects.values()].filter(({definition, body}) =>
        definition.id.startsWith('domino-') && Math.abs(body.angle) > .5);
    assert.ok(fallen.length >= 3, `${fallen.length} dominoes fell`);
});

test('The pendulum swings after a push without stretching its suspension', () => {
    const {world, step} = fixture();
    const weight = world.objects.get('pendulum').body;
    const link = world.links.find(joint => joint.bodyB === weight);
    Matter.Body.applyForce(weight, weight.position, {x: .04, y: 0});
    let maxDisplacement = 0, maxStretch = 0;
    step(240, () => {
        maxDisplacement = Math.max(maxDisplacement, Math.abs(weight.position.x - 11200));
        maxStretch = Math.max(maxStretch, Math.abs(Math.hypot(
            weight.position.x - link.pointA.x, weight.position.y - link.pointA.y) - 300));
    });
    assert.ok(maxDisplacement > 20, `swing=${maxDisplacement}`);
    assert.ok(maxStretch < 2, `rope stretch=${maxStretch}`);
});

test('The suspended platform supports a player and swings while both links retain their length', () => {
    const {world, step} = fixture();
    const platform = world.objects.get('suspended-platform').body;
    Matter.Body.setPosition(world.player, {x: 12200, y: 368});
    step(120);
    assert.ok(Math.abs(platform.position.y - 410) < 3);
    assert.ok(world.player.position.y < 390, 'The player stays on the suspended platform');
    Matter.Body.applyForce(platform, platform.position, {x: .05, y: 0});
    let swing = 0, maxError = 0;
    step(180, () => {
        swing = Math.max(swing, Math.abs(platform.position.x - 12200));
        for (const link of world.links.filter(joint => joint.bodyB === platform)) {
            const length = Math.hypot(platform.position.x + link.pointB.x - link.pointA.x,
                platform.position.y + link.pointB.y - link.pointA.y);
            maxError = Math.max(maxError, Math.abs(length - 250));
        }
    });
    assert.ok(swing > 10, `platform swing=${swing}`);
    assert.ok(maxError < 3, `suspension error=${maxError}`);
});

test('Equal size and mass ice and rubber blocks slide differently on the same incline', () => {
    const trial = id => {
        const definition = matterLab.objects.find(object => object.id === id);
        const {world, step} = fixture({...matterLab, hinges: [], links: [],
            surfaces: [{x: 500, y: 440, width: 500, height: 20, angle: .2}],
            objects: [{...definition, x: 400, y: 370}]});
        const block = world.objects.get(id).body;
        step(180);
        return {distance: block.position.x - 400, mass: block.mass};
    };
    const ice = trial('ice-slider'), rubber = trial('rubber-slider');
    assert.equal(ice.mass, rubber.mass);
    assert.ok(ice.distance > rubber.distance + 50, `ice=${ice.distance}, rubber=${rubber.distance}`);
});

test('Simultaneously released balls rebound according to their material restitution', () => {
    const ids = ['drop-steel', 'drop-rubber', 'drop-soft'];
    const {world, step} = fixture({...matterLab, hinges: [], links: [],
        objects: matterLab.objects.filter(object => ids.includes(object.id))});
    const balls = ids.map(id => world.objects.get(id).body);
    step(60);
    balls.forEach(ball => {
        assert.equal(ball.position.y, 230, 'Drops wait for the release button');
        Matter.Sleeping.set(ball, false);
    });
    const touchedFloor = [false, false, false], peak = [520, 520, 520];
    step(180, () => balls.forEach((ball, i) => {
        if (ball.position.y > 480) touchedFloor[i] = true;
        if (touchedFloor[i]) peak[i] = Math.min(peak[i], ball.position.y);
    }));
    assert.ok(touchedFloor.every(Boolean));
    assert.ok(peak[1] < peak[0] - 80 && peak[1] < peak[2] - 80, `rebound peaks=${peak}`);
});
