// Dünya 2 bölümlerinin ortam, engel, düşman ve toplanacak nesne verilerini tanımlar.

export const firstJourney = {

    name: 'Yeni Bölüm', theme: 'garden', width: 3200, groundY: 520,

    spawn: {x:100 , y:480},
    checkpoint: {x:1500 , y:480} ,
    key: {x: 2700, y: 477},
    exit: {x: 2950, y: 468},

    platforms: [
                {x: 300, y: 450, width: 50},
                {x: 400, y: 350, width: 50},
                {x: 500, y: 250, width: 50},
                {x: 600, y: 150, width: 50},
                {x: 400, y: 430, width: 180}
                ],

    fruits: [
                {id:'fruit-1', type:'apple', x: 300, y: 200},
                {id:'fruit-2', type:'orange', x: 400, y: 200},
                {id:'fruit-3', type:'grapes', x: 500, y: 200},
                {id:'star-1',  type:'star', x: 550, y: 400},
                {id:'star-2',  type:'star', x: 1400, y: 480},
                {id:'star-3',  type:'star', x: 2450, y: 480}
            ],

    enemies: [
                {type:'hedgehog', x: 490, y:411, minX: 453, maxX:545, speed:45},
                {type:'snail', x: 500, minX: 900, maxX:1200, speed:65},
                {type:'frog', x: 600, minX: 1000, maxX:1300, speed:65},
                {type:'bee', x: 2250, y:410, minX: 2150, maxX:2350, speed:80, bob:25}
    ],


    fountains: [{ id: 'fountain-1', x: 2500 }],
    belt: {x: 2050, width: 250, speed:-120},
    gaps: [{ x: 1900, width: 100 }],
    fireRain: [{ period: 10000, offset: 4000, speed: 250 }],
    ice: [{ x: 1600, width: 180 } ]




};



export const worldTwoLevels = [firstJourney];
