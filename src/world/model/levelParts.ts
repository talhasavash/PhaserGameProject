// Bölüm parçalarını kısa çağrılarla oluşturur; Phaser nesnesi üretmez, yalnızca bölüm verisini hazırlar.
import type { Platform, Gap, Strip, Point, CollectibleInput, CollectibleName, SkinName, LevelDefinition,
    BehaviorSelection, Hop, Visibility, EnemyDefinition, WeaponSelection, WeaponName, WeatherSelection,
    WeatherName, ScenarioSelection, ScenarioZone, ScenarioActionSelection } from './contracts.js';
import type { BackgroundPart, BackgroundPartType, BackgroundDefinition } from '../scenery/BackgroundBuilder.js';

type PlatformOptions = Omit<Platform, 'x' | 'y' | 'width'>;
type SurfaceOptions = Omit<PlatformOptions, 'ice'>;
type ItemOptions = { id?: string };
type Column = NonNullable<LevelDefinition['columns']>[number];

function createPlatform(x: number, y: number, width: number, options: PlatformOptions = {}): Platform {
    return { ...options, x, y, width };
}

export const platform = {
    at: createPlatform,
    icy(x: number, y: number, width: number, options: SurfaceOptions = {}): Platform {
        return createPlatform(x, y, width, { ...options, ice: true });
    },
    solid(x: number, y: number, width: number, options: SurfaceOptions = {}): Platform {
        return createPlatform(x, y, width, { ...options, ice: false });
    }
};

function createItem(type: CollectibleName, x: number, y: number, options: ItemOptions = {}): CollectibleInput {
    return { ...options, type, x, y };
}

function platformItem(type: CollectibleName, platform: number, options: ItemOptions & Partial<Point> = {}): CollectibleInput {
    return { ...options, type, platform };
}

export const item = {
    at: createItem,
    onPlatform: platformItem
};

export function gap(x: number, width: number, options: Omit<Gap, 'x' | 'width'> = {}): Gap {
    return { ...options, x, width };
}

export function iceArea(x: number, width: number): Strip {
    return { x, width };
}

export function column(x: number, width: number, options: Omit<Column, 'x' | 'width'> = {}): Column {
    return { ...options, x, width };
}

function costumePair(boy: SkinName, girl: SkinName): NonNullable<LevelDefinition['player']> {
    return { costume: { boy, girl } };
}

export const outfits = {
    pair: costumePair,
    winter() { return costumePair('ice_boy', 'ice_girl'); }
};

// Zemin ve iyileşme noktaları.
export function point(x: number, y: number): Point { return { x, y }; }

export function belt(x: number, width: number, speed: number): LevelDefinition['belt'] {
    return { x, width, speed };
}

export function passage(x: number, y: number, width: number): NonNullable<LevelDefinition['passages']>[number] {
    return { x, y, width };
}

export function fountain(x: number, id = `fountain-${x}`): LevelDefinition['fountains'][number] {
    return { id, x };
}

// Normal kar dekor, rain ise karaktere zarar verebilen düşen toplardır.
type WeatherOptions = Partial<WeatherSelection> & { type?: never };
type Rain = NonNullable<LevelDefinition['fireRain']>[number];
type RainOptions = Omit<Partial<Rain>, 'kind'>;

function weatherSelection(type: WeatherName, options: WeatherOptions = {}): WeatherSelection {
    return { ...options, type };
}

export const weather = {
    of: weatherSelection,
    snow(options: WeatherOptions = {}) { return weatherSelection('snow', options); }
};

function fallingRain(options: RainOptions): Rain {
    return { period: 10000, speed: 310, offset: 4500, ...options };
}

export const rain = {
    snow(options: RainOptions = {}): Rain { return { ...fallingRain(options), kind: 'snow' }; },
    fire(options: RainOptions = {}): Rain { return fallingRain(options); }
};

// Hareket, ek davranış ve silah birbirinden bağımsız seçilir.
function selectBehavior(type: string, options: Record<string, unknown> = {}): BehaviorSelection {
    return { ...options, type };
}

export const movement = {
    of: selectBehavior,
    patrol(minX: number, maxX: number, speed: number): BehaviorSelection {
        return selectBehavior('patrol', { minX, maxX, speed });
    },
    stationary(): BehaviorSelection { return selectBehavior('stationary'); },
    chase(minX: number, maxX: number, options: { speed?: number; range?: number } = {}): BehaviorSelection {
        return selectBehavior('chase', { ...options, minX, maxX });
    }
};

export const behavior = {
    of: selectBehavior,
    hop(walkMs: number, pauseMs: number, options: Omit<Hop, 'walkMs' | 'pauseMs'> = {}): Hop {
        return { ...options, walkMs, pauseMs };
    },
    visibility(visibleMs: number, hiddenMs: number, options: Omit<Visibility, 'visibleMs' | 'hiddenMs'> = {}): Visibility {
        return { ...options, visibleMs, hiddenMs };
    },
    vertical(bob: number, options: { period?: number; offset?: number; threadTop?: number } = {}) {
        return { ...options, bob };
    },
    jump(height: number, duration: number, period: number, offset = 0): NonNullable<EnemyDefinition['jump']> {
        return { height, duration, period, offset };
    },
    breath(shots: number[], speed: number, range: number): NonNullable<EnemyDefinition['breath']> {
        return { shots: [...shots], speed, range };
    }
};

type WeaponOptions = Partial<WeaponSelection> & { type?: never };

function selectWeapon(type: WeaponName, options: WeaponOptions = {}): WeaponSelection {
    return { ...options, type };
}

export const weapon = {
    of: selectWeapon,
    bullet(options: WeaponOptions = {}) { return selectWeapon('bullet', options); },
    snowball(options: WeaponOptions = {}) { return selectWeapon('snowball', options); },
    iceShard(options: WeaponOptions = {}) { return selectWeapon('ice-shard', options); }
};

// Boyut ve renk varsayılanları çizim Factory'sinde kalır; burada tekrar tanımlanmaz.
type SceneryOptions = Omit<BackgroundPart, 'type' | 'x' | 'y'>;

function sceneryPart(type: BackgroundPartType) {
    return (x: number, y: number, options: SceneryOptions = {}): BackgroundPart => ({
        ...options, ...(options.repeat ? { repeat: { ...options.repeat } } : {}), type, x, y
    });
}

export const scenery = {
    sun: sceneryPart('sun'), moon: sceneryPart('moon'), cloud: sceneryPart('cloud'),
    hill: sceneryPart('hill'), mountain: sceneryPart('mountain'), tree: sceneryPart('tree'),
    pine: sceneryPart('pine'), circle: sceneryPart('circle'), triangle: sceneryPart('triangle'),
    repeat(part: BackgroundPart, count: number, stepX: number, stepY?: number): BackgroundPart {
        return { ...part, repeat: { count, stepX, ...(stepY === undefined ? {} : { stepY }) } };
    },
    background(sky: number, parts: BackgroundPart[], ground?: BackgroundDefinition['ground']): BackgroundDefinition {
        return { sky, parts: parts.map(part => ({ ...part, ...(part.repeat ? { repeat: { ...part.repeat } } : {}) })),
            ...(ground ? { ground: { ...ground } } : {}) };
    }
};

// Önce eylem hazırlanır; sonra bir alana veya özel senaryoya bağlanır.
function scenarioAction(type: ScenarioActionSelection['type'], options: Omit<Partial<ScenarioActionSelection>, 'type'> = {}): ScenarioActionSelection {
    return { ...options, type };
}

export const action = {
    of: scenarioAction,
    weapon(enemyId: string, selection: WeaponSelection | false): ScenarioActionSelection {
        return { type: 'weapon', enemyId, weapon: selection === false ? false : { ...selection } };
    },
    emit(event: string, data?: unknown): ScenarioActionSelection { return { type: 'emit', event, data }; }
};

function scenarioZone(x: number, width: number, actions: ScenarioActionSelection[], options: Pick<ScenarioZone, 'once'> = {}): ScenarioSelection {
    return { type: 'zones', zones: [{ ...options, x, width, actions: [...actions] }] };
}

export const scenario = {
    zone: scenarioZone,
    changeWeapon(x: number, width: number, enemyId: string, selection: WeaponSelection | false, options: Pick<ScenarioZone, 'once'> = {}): ScenarioSelection {
        return scenarioZone(x, width, [action.weapon(enemyId, selection)], options);
    },
    of(type: string, options: Partial<ScenarioSelection> & { type?: never } = {}): ScenarioSelection {
        return { ...options, type };
    }
};
