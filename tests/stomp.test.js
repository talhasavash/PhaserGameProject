// Üstten ezmenin yalnızca 4–6. dünyalarda çalışmasını, yan temasın ve silahların ayrılmasını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import {levels, worldForLevel} from '../.build/src/world/levels/level.js';
import {createGameState} from '../.build/src/game/rules.js';
import {updateHazards} from '../.build/src/actors/enemies/EnemyController.js';
import {updateEnemyWeapons, resetEnemyWeapons, updateGuardianFire} from '../.build/src/actors/enemies/WeaponController.js';
globalThis.Phaser = {Scene: class {}};
const {GameScene} = await import('../.build/src/game/GameScene.js');

function fixture(levelIndex = 47) {
    const data = new Map([['patrol', {type: 'fire-salamander', weapon: {type: 'flame-orb'}, speed: 65}],
        ['initial-weapon', {weapon: {type: 'flame-orb'}}]]);
    const hidden = [];
    for (const key of ['thread', 'shadow', 'breath-glow']) data.set(key, {setVisible(v) {hidden.push([key, v]);}});
    const enemy = {scaleY: .9, body: {top: 100, prev: {y: 100}, enable: true},
        getData: key => data.get(key), setData(key, value) {data.set(key, value);},
        setVelocity(x, y) {this.velocity = {x, y};}, setVisible(value) {this.visible = value;}};
    const player = {body: {y: 50, height: 60, bottom: 110, prev: {y: 35}, velocity: {y: 160}},
        setVelocityY(value) {this.body.velocity.y = value;}};
    const sounds = [], tweens = [];
    let hits = 0;
    const scene = {levelIndex, gameState: createGameState(), player,
        hitHazard() {hits++;}, tweens: {add: t => tweens.push(t)}, sound: {play: key => sounds.push(key)},
        hazards: {getChildren: () => [enemy]}, weaponUsers: [enemy], weaponShots: [], guardianShots: [{plan: null}]};
    return {scene, player, enemy, sounds, tweens, hidden, hits: () => hits};
}

test('Arcade enemies can be stomped in every World 4/5 chapter; Worlds 1–3 keep their original damage', () => {
    for (const [index, level] of levels.entries()) {
        if (level.physics === 'matter') continue;
        const {scene, player, enemy, hits} = fixture(index);
        GameScene.prototype.hitEnemy.call(scene, player, enemy);
        if ([4, 5, 6].includes(worldForLevel(index).id)) {
            assert.equal(hits(), 0, level.name);
            assert.equal(enemy.body.enable, false, level.name);
            assert.equal(player.body.velocity.y, -270, level.name);
        } else {
            assert.equal(hits(), 1, level.name);
            assert.equal(enemy.body.enable, true, level.name);
        }
    }
});

test('Rising, side and underside contacts still damage; a descending top contact defeats only once', () => {
    for (const change of [p => {p.body.velocity.y = -160;}, p => {p.body.prev.y = 70;},
        p => {p.body.bottom = 140; p.body.y = 80;}]) {
        const f = fixture(); change(f.player);
        GameScene.prototype.hitEnemy.call(f.scene, f.player, f.enemy);
        assert.equal(f.hits(), 1);
        assert.equal(f.enemy.body.enable, true);
    }
    const f = fixture();
    GameScene.prototype.hitEnemy.call(f.scene, f.player, f.enemy);
    GameScene.prototype.hitEnemy.call(f.scene, f.player, f.enemy);
    assert.equal(f.hits(), 0);
    assert.deepEqual(f.sounds, ['collect']);
    assert.equal(f.tweens.length, 1);
    assert.equal(f.scene.gameState.hearts, 3);
    assert.deepEqual(f.hidden.map(([, value]) => value), [false, false, false]);
    f.tweens[0].onComplete();
    assert.equal(f.enemy.visible, false);
    assert.notEqual(fixture().enemy.getData('defeated'), true, 'A fresh attempt has a live enemy');
});

test('Defeated patrols and shooters stay disabled through updates and weapon reset', () => {
    const f = fixture();
    GameScene.prototype.hitEnemy.call(f.scene, f.player, f.enemy);
    f.enemy.setVelocity = () => assert.fail('A defeated enemy moved');
    updateHazards(f.scene, 16);
    updateEnemyWeapons(f.scene);
    updateGuardianFire(f.scene);
    resetEnemyWeapons(f.scene);
    assert.equal(f.scene.weaponUsers.length, 0);
    assert.equal(f.enemy.body.enable, false);
});

test('Pause, loss and completion cannot stomp; only the enemy group is bound to the stomp callback', () => {
    for (const state of ['paused', 'lost', 'falling', 'complete']) {
        const f = fixture();
        if (state === 'complete') f.scene.gameState.complete = true;
        else f.scene[state] = true;
        GameScene.prototype.hitEnemy.call(f.scene, f.player, f.enemy);
        assert.equal(f.enemy.body.enable, true);
        assert.equal(f.hits(), 0);
    }
    const overlaps = [];
    const scene = {physics: {add: {collider() {}, overlap: (a, b, callback) => overlaps.push([b, callback])}},
        hazards: 'enemies', fireballs: 'fireballs', enemyProjectiles: 'shots', guardianFlames: 'flames',
        columns: 'columns', hitEnemy: GameScene.prototype.hitEnemy, hitHazard: GameScene.prototype.hitHazard};
    GameScene.prototype.bindCollisions.call(scene);
    assert.equal(overlaps.find(([target]) => target === 'enemies')[1], scene.hitEnemy);
    for (const name of ['fireballs', 'shots', 'flames', 'columns']) assert.equal(overlaps.find(([target]) => target === name)[1], scene.hitHazard);
});
