// Ana oyuna bağlı, kullanıcıya kapalı Matter pilotu: ortak sahne, toplama ve çıkış akışını doğrular.
import {defineLevel} from '../model/definitions.js';
import {prop} from '../../physics/matter/definitions.js';
import {verses} from '../../data/verses.js';

export const matterPilot = defineLevel({
    id: 'matter-pilot', name: 'Matter pilotu', draft: true, physics: 'matter',
    theme: 'garden', width: 2600, groundY: 520, spawn: {x: 120, y: 480},
    checkpoint: {x: 120, y: 480}, key: {x: 2200, y: 478}, exit: {x: 2440, y: 468},
    platforms: [{x: 540, y: 420, width: 230}, {x: 1780, y: 435, width: 240}],
    gaps: [{x: 1480, width: 160}],
    fruits: [
        {type: 'star', x: 650, y: 380}, {type: 'star', x: 1150, y: 475}, {type: 'star', x: 1900, y: 395},
        {type: 'apple', x: 250, y: 475}, {type: 'pear', x: 840, y: 475},
        {type: 'orange', x: 1350, y: 475}, {type: 'banana', x: 2100, y: 475}
    ],
    props: [prop.crate('step-box', 420, 484, 72, {fixedRotation: true}),
        prop.crate('free-box', 930, 488, 64), prop.rock('rolling-stone', 1230, 490, 30),
        prop.plank('bridge', 1440, 355, 20, 300, {asleep: true, density: .0004, angle: .025})],
    links: [{objectId: 'bridge', anchor: {x: 1440, y: 500}, localPoint: {x: 0, y: 145}, length: 0}],
    environment: {scenery: {sky: 0xcbe8e2, ground: {body: 0x92715d, edge: 0x9fc67b}, parts: [
        {type: 'sun', x: 650, y: 120},
        {type: 'cloud', x: 180, y: 150, repeat: {count: 8, stepX: 320}},
        {type: 'hill', x: 200, y: 465, repeat: {count: 6, stepX: 500}},
        {type: 'tree', x: 300, y: 420, repeat: {count: 8, stepX: 360}}
    ]}},
    verse: verses[6]
});
