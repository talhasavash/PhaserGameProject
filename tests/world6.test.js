// Denge Atölyesi'nin 15 parkurunu, fizik düzeneklerini ve ayrı ilerleme kaydını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import Matter from '../node_modules/phaser/src/physics/matter-js/CustomMain.js';
import {worldSixLevels} from '../.build/src/world/levels/world6.js';
import {levels, worlds, isPlayableLevel, worldForLevel, LEVEL_SLOT_COUNT} from '../.build/src/world/levels/level.js';
import {makePhysicsPuzzle} from '../.build/src/world/model/physicsPuzzles.js';
import {matterWorldForLevel} from '../.build/src/physics/matter/levelWorld.js';
import {createLabWorld, wakeTouchedObjects} from '../.build/src/physics/matter/MatterObjects.js';
import {labMotion, moveLabPlayer} from '../.build/src/physics/matter/movement.js';
import {labPhysics, FixedStepSimulation} from '../.build/src/physics/matter/simulation.js';
import {worldUnlockedLevels, unlockWorldNext, readUnlocked} from '../.build/src/data/progress.js';

function fixture(definition) {
    const engine = Matter.Engine.create({...labPhysics, gravity: {x: 0, y: labMotion.gravity}});
    const world = createLabWorld(Matter, definition, objects => Matter.Composite.add(engine.world, objects));
    let clock = 0, groundAt = -Infinity, jumpAt = -Infinity;
    for (const event of ['collisionStart', 'collisionActive']) Matter.Events.on(engine, event, e => {
        wakeTouchedObjects(Matter, world.player, e.pairs);
        for (const pair of e.pairs) {
            const other = pair.bodyA === world.feet ? pair.bodyB : pair.bodyA;
            if (clock - jumpAt > 150 && (pair.bodyA === world.feet || pair.bodyB === world.feet) &&
                !other.isSensor && Math.abs(pair.collision.normal.y) > .5) groundAt = clock;
        }
    });
    return {world, grounded: () => clock - groundAt < 110,
        jump() {jumpAt = clock; groundAt = -Infinity; Matter.Body.setVelocity(world.player, {x: world.player.velocity.x, y: -labMotion.jump});},
        step(count, before = () => {}) {
        for (let i = 0; i < count; i++) {clock += FixedStepSimulation.stepMs; before(); Matter.Engine.update(engine, FixedStepSimulation.stepMs);}
    }};
}

test('World 6 publishes 15 different Matter chapters while the local pilot stays closed', () => {
    assert.equal(worlds.length, 6);
    assert.equal(LEVEL_SLOT_COUNT, 90);
    assert.equal(worlds[5].title, 'Denge Atölyesi');
    assert.equal(worldSixLevels.length, 15);
    assert.deepEqual(levels.slice(75), worldSixLevels);
    assert.equal(new Set(worldSixLevels.map(level => level.id)).size, 15);
    assert.equal(new Set(worldSixLevels.map(level => JSON.stringify([level.props, level.gaps, level.platforms]))).size, 15);
    assert.equal(isPlayableLevel(45), false);
    assert.equal(levels[45].id, 'matter-pilot');
    for (const [i, level] of worldSixLevels.entries()) {
        assert.equal(worldForLevel(75 + i).id, 6);
        assert.equal(isPlayableLevel(75 + i), true);
        assert.equal(level.physics, 'matter');
        assert.equal(level.fruits.filter(item => item.type === 'star').length, 3);
        assert.ok(level.props.length > 2 && level.props.length <= 20);
        assert.ok(level.fruits.every(item => item.x < level.key.x && item.x > 0));
        assert.ok(level.key.x < level.exit.x && level.exit.x < level.width);
        assert.ok(level.props.every(p => p.x > 0 && p.x < level.key.x));
    }
    const svg = fs.readFileSync(new URL('../assets/images/scene/menu-world6.svg', import.meta.url), 'utf8');
    assert.ok(svg.includes('viewBox="0 0 1600 900"'));
    assert.match(svg, /id="crate"/);
    assert.match(svg, /id="gear"/);
    assert.equal(worlds[5].menu.image, 'assets/images/scene/menu-world6.svg');
});

test('World 6 starts at one, unlocks sequentially and persists independently of old progress', () => {
    const values = new Map([['meyve-oyunu-unlocked-levels', '23']]);
    const storage = {getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value)};
    globalThis.window = {localStorage: storage};
    const world = worlds[5];
    assert.equal(worldUnlockedLevels(world, 90), 1);
    for (let index = 75; index < 90; index++) {
        assert.equal(unlockWorldNext(world, index, 90), index - 75 + 2);
        assert.equal(readUnlocked(storage, 90), 23, 'New physics progress must not unlock old chapters');
    }
    assert.equal(values.get('meyve-oyunu-world-6-unlocked'), '16');
    assert.equal(worldUnlockedLevels(world, 90), 16, 'Last chapter is remembered as completed');
    assert.equal(unlockWorldNext(world, 75, 90), 16, 'Replay cannot relock later chapters');
});

test('Each chapter settles with finite bodies, valid constraints and repeatable fresh worlds', () => {
    for (const level of worldSixLevels) {
        const original = JSON.stringify(level);
        const definition = matterWorldForLevel(level);
        const {world, step} = fixture(definition);
        step(360);
        for (const {body} of world.objects.values()) {
            assert.ok([body.position.x, body.position.y, body.angle].every(Number.isFinite), level.name);
            assert.ok(body.position.y < 600, `${level.name}: prop starts over a real support`);
        }
        for (const link of world.links) {
            if (link.bodyB.isSleeping) continue;
            const end = Matter.Constraint.pointBWorld(link);
            const distance = Math.hypot(end.x - link.pointA.x, end.y - link.pointA.y);
            assert.ok(Math.abs(distance - link.length) < 5, `${level.name}: constraint stretch ${distance - link.length}`);
        }
        const reset = fixture(definition).world;
        for (const p of level.props) {
            const body = reset.objects.get(p.id).body;
            assert.deepEqual(body.position, {x: p.x, y: p.y});
            assert.equal(body.angle, p.angle ?? 0);
        }
        assert.equal(JSON.stringify(level), original);
    }
});

test('Tipping bridge covers a gap wider than a normal jump at each difficulty', () => {
    for (const variant of [0, 1, 2]) {
        const puzzle = makePhysicsPuzzle('bridge', 0, 'test', variant);
        const level = {...worldSixLevels[0], spawn: {x: 20, y: 480}, platforms: [], gaps: puzzle.gaps, props: puzzle.props, links: puzzle.links, matterSurfaces: []};
        const {world, step} = fixture(matterWorldForLevel(level));
        const board = world.objects.get('test-bridge').body;
        step(600, () => moveLabPlayer(Matter, world.player, 1, true, FixedStepSimulation.stepMs));
        const gap = puzzle.gaps[0];
        assert.ok(gap.width > 265 * (2 * 590 / 1600) + 30, 'A direct jump cannot skip the bridge');
        assert.ok(board.bounds.max.x > gap.x + gap.width + 25, `bridge ends at ${board.bounds.max.x}`);
        assert.ok(board.bounds.min.x < gap.x);
        assert.ok(Math.abs(board.angle) > 1.2, `bridge rotated ${board.angle}`);
    }
});

test('Cargo can be pushed across the hinged bridge without falling into the pit', () => {
    for (const variant of [0, 1, 2]) {
        const puzzle = makePhysicsPuzzle('balance', 0, 'test', variant);
        const level = {...worldSixLevels[0], spawn: {x: 20, y: 480}, platforms: puzzle.platforms,
            gaps: puzzle.gaps, props: puzzle.props, links: puzzle.links, matterSurfaces: puzzle.surfaces};
        const {world, step} = fixture(matterWorldForLevel(level));
        const cargo = world.objects.get('test-cargo').body;
        step(900, () => moveLabPlayer(Matter, world.player, cargo.position.x < 700 ? 1 : 0, true, FixedStepSimulation.stepMs));
        assert.ok(cargo.position.x >= 700 && cargo.position.y < 500, `variant ${variant}: cargo ${JSON.stringify(cargo.position)}`);
        assert.ok(world.player.position.y < 525);
    }
});

test('The crate tower can be climbed to its star shelf at all three difficulties', () => {
    for (const variant of [0, 1, 2]) {
        const puzzle = makePhysicsPuzzle('tower', 0, 'test', variant);
        const level = {...worldSixLevels[0], spawn: {x: 20, y: 480}, platforms: puzzle.platforms,
            gaps: [], props: puzzle.props, links: [], matterSurfaces: []};
        const {world, step, jump, grounded} = fixture(matterWorldForLevel(level));
        step(60);
        const walk = target => () => {
            const difference = target - world.player.position.x;
            const direction = Math.abs(difference) > 3 ? Math.sign(difference)
                : Math.abs(world.player.velocity.x) > .25 ? -Math.sign(world.player.velocity.x) : 0;
            moveLabPlayer(Matter, world.player, direction, grounded(), FixedStepSimulation.stepMs);
        };
        jump(); step(150, walk(145));
        assert.ok(world.player.bounds.max.y < 465, `Lower box supports the first landing: ${JSON.stringify(world.player.position)}`);
        jump(); step(150, walk(220));
        assert.ok(world.player.bounds.max.y < 405, `Upper box supports the second landing: ${JSON.stringify(world.player.position)}`);
        jump(); step(150, walk(410));
        assert.ok(world.player.bounds.max.y < puzzle.platforms[0].y + 5, `variant ${variant}: shelf must support the player: ${JSON.stringify(world.player.position)}`);
        assert.ok(Math.abs(world.player.position.x - puzzle.star.x) < 30);
    }
});

test('Puzzle placement translates anchors and vertices but preserves local attachment offsets', () => {
    for (const kind of ['suspended', 'pendulum', 'balance', 'ramp']) {
        const a = makePhysicsPuzzle(kind, 0, 'a'), b = makePhysicsPuzzle(kind, 1020, 'b');
        assert.equal(b.star.x - a.star.x, 1020);
        for (let i = 0; i < a.links.length; i++) {
            assert.equal(b.links[i].anchor.x - a.links[i].anchor.x, 1020);
            assert.deepEqual(b.links[i].localPoint, a.links[i].localPoint);
        }
        if (a.surfaces.length) assert.equal(b.surfaces[0].vertices[0].x - a.surfaces[0].vertices[0].x, 1020);
    }
});

test('All 15 chapter results advance once with score preserved; the final result returns to the menu', async () => {
    globalThis.Phaser = {Scene: class {}};
    const {MatterGameScene} = await import('../.build/src/game/MatterGameScene.js');
    for (let index = 75; index < 90; index++) {
        const calls = [];
        globalThis.document = {getElementById: () => ({click() {calls.push('menu');}})};
        const scene = {levelIndex: index, level: levels[index], character: 'girl', resultShown: true,
            gameState: {complete: true, score: 400}, scene: {restart: data => calls.push(data)}};
        MatterGameScene.prototype.continueAfterResult.call(scene);
        MatterGameScene.prototype.continueAfterResult.call(scene);
        assert.deepEqual(calls, index === 89 ? ['menu'] : [{levelIndex: index + 1, score: 400}]);
    }
});
