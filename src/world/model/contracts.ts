// Bölüm, dünya ve eklentilerin TypeScript sözleşmeleri; motorla senaryo arasındaki ortak veri modeli.
import type { BackgroundDefinition } from '../scenery/BackgroundBuilder.js';
import type { BuiltInSurfaceStyle } from '../terrain/platforms.js';
import type { BuiltInEnemyName } from '../../actors/enemies/EnemyCatalog.js';
import type { BuiltInWeaponName } from '../../actors/enemies/WeaponCatalog.js';
import type { BuiltInSkinName } from '../../data/characters.js';
import type { BuiltInCollectibleName } from '../../data/assets.js';
import type { BuiltInTemplateName } from './templates.js';
import type { BuiltInWeatherName } from '../scenery/weather.js';

/** Hazır isimleri IDE'de önerir; eklentilerle kaydedilen özel isimleri de kabul eder. */
export type SuggestedName<Known extends string> = Known | (string & {});
export type SurfaceStyle = SuggestedName<BuiltInSurfaceStyle>;
export type EnemyName = SuggestedName<BuiltInEnemyName>;
export type WeaponName = SuggestedName<BuiltInWeaponName>;
export type SkinName = SuggestedName<BuiltInSkinName>;
export type CollectibleName = SuggestedName<BuiltInCollectibleName>;
export type TemplateName = SuggestedName<BuiltInTemplateName>;
export type WeatherName = SuggestedName<BuiltInWeatherName | 'none'>;

export interface CharacterCostumes {
    boy?: SkinName;
    girl?: SkinName;
    [character: string]: SkinName | undefined;
}
export interface Point {
    x: number;
    y: number
}

export interface Strip {
    x: number;
    width: number
}

export interface Gap extends Strip {
    style?: SurfaceStyle;
}

export interface Platform extends Strip {
    y: number;
    ice?: boolean;
    single?: boolean;
    style?: SurfaceStyle
}

export interface Collectible extends Point {
    id: string;
    type: CollectibleName;
    platform?: number
}

export interface Patrol {
    minX: number;
    maxX: number;
    speed: number
}

export interface Visibility {
    visibleMs?: number;
    hiddenMs?: number;
    fadeMs?: number;
    offset?: number
}

export interface Hop {
    walkMs?: number;
    pauseMs?: number;
    height?: number;
    duration?: number;
    offset?: number
}

export interface Shot {
    kind?: 'shard';
    period: number;
    speed: number;
    volley?: number;
    range?: number
}

export interface WeaponSelection {
    type: WeaponName;
    period?: number;
    speed?: number;
    range?: number;
    volley?: number;
    initialDelay?: number;
    spread?: number;

    [option: string]: unknown
}

export interface BehaviorSelection {
    type: string;

    [option: string]: unknown
}

export interface EnemyDefinition extends Partial<Patrol> {
    type: EnemyName;
    x?: number;
    y?: number;
    texture?: string;
    platform?: number;
    id?: string;
    movement?: BehaviorSelection;
    weapon?: WeaponSelection | false;
    scale?: number;
    bob?: number;
    period?: number;
    offset?: number;
    threadTop?: number;
    visibility?: Visibility;
    hop?: Hop;
    snowball?: Shot;
    rage?: boolean;
    jump?: { height: number; duration: number; period: number; offset: number };
    breath?: { shots: number[]; speed: number; range: number };
    components?: (string | BehaviorSelection)[];
    behaviors?: {
        patrol?: Partial<Patrol>; hop?: Hop; visibility?: Visibility; shoot?: Shot;
        vertical?: { bob?: number; period?: number; offset?: number; threadTop?: number };
        jump?: EnemyDefinition['jump']; breath?: EnemyDefinition['breath']; rage?: boolean;
        [name: string]: unknown
    };
}

export interface Verse {
    text: string;
    reference?: string;
    source?: string
}

export interface MusicTrack {
    src: string;
    volume?: number
}

export interface WeatherSelection {
    type: WeatherName;
    intensity?: number;
    wind?: number;

    [option: string]: unknown
}

export interface Environment {
    background?: SurfaceStyle;
    /** Seçilirse yalnızca arka plan çizimi parçalarla kurulur; tema ve platformlar korunur. */
    scenery?: BackgroundDefinition;
    platformStyle?: SurfaceStyle;
    weather?: WeatherSelection | false
}

export interface ScenarioSelection {
    type: string;
    zones?: ScenarioZone[];

    [option: string]: unknown
}

export interface ScenarioActionSelection {
    type: SuggestedName<'weapon' | 'emit'>;
    enemyId?: string;
    weapon?: WeaponSelection | false;
    event?: string;
    data?: unknown;
    [option: string]: unknown;
}

export interface ScenarioZone extends Strip {
    once?: boolean;
    actions: ScenarioActionSelection[];
}

export interface LevelDefinition {
    id?: string;
    /** Deneme bölümü: menüde kilitli kalır ve bölüm akışında açılmaz. */
    draft?: boolean;
    template?: TemplateName;
    stage?: number;
    name: string;
    theme: SurfaceStyle;
    width: number;
    groundY: number;
    spawn: Point;
    checkpoint: Point;
    key: Point;
    exit: Point;
    platforms: Platform[];
    fruits: Collectible[];
    enemies: EnemyDefinition[];
    fountains: { id: string; x: number }[];
    belt: Strip & { speed: number };
    gaps: Gap[];
    ice?: Strip[];
    belts?: (Strip & { speed: number })[];
    boss?: boolean;
    frozenItems?: boolean;
    verse?: Verse;
    characterSkin?: SkinName;
    ball?: EnemyDefinition;
    extraHazards?: EnemyDefinition[];
    fireRain?: { kind?: 'snow'; period: number; speed: number; offset: number }[];
    columns?: (Strip & {
        style?: SurfaceStyle;
        openMs?: number;
        raisedBottom?: number;
        raisedRange?: number[];
        offset?: number;
        startDelay?: number
    })[];
    passages?: (Strip & { y: number })[];
    exitType?: string;
    exitLabel?: string;
    mosqueStyle?: Record<string, unknown>;
    routes?: string[];
    vanishAll?: boolean;
    environment?: Environment;
    platformTheme?: SurfaceStyle;
    player?: { costume?: SkinName | CharacterCostumes };
    scenarios?: ScenarioSelection[];
}

export type PlatformCollectible = Omit<Collectible, 'x' | 'y'> & Partial<Point> & { platform: number };
/** Bölüm yazarken id isteğe bağlıdır; defineLevel eksik kimlikleri bölüm içinde tamamlar. */
export type CollectibleInput = (Omit<Collectible, 'id'> | Omit<PlatformCollectible, 'id'>) & { id?: string };
export type PlatformEnemy = Omit<EnemyDefinition, 'x'> & { x?: number; platform: number };
export type EnemyInput = Omit<Partial<EnemyDefinition>, 'type'> & ({ x: number } | { platform: number });
export type LevelInput =
    Pick<LevelDefinition, 'name'>
    &
    Partial<Omit<LevelDefinition, 'name' | 'width' | 'fruits' | 'enemies' | 'spawn' | 'checkpoint' | 'key' | 'exit'>>
    & {
    width?: number; fruits?: CollectibleInput[]; enemies?: (EnemyDefinition | PlatformEnemy)[];
    spawn?: Partial<Point>; checkpoint?: Partial<Point>; key?: Partial<Point>; exit?: Partial<Point>;
};

export interface LevelTemplate {
    parent?: string;
    defaults?: Partial<LevelInput> | ((input: LevelInput) => Partial<LevelInput>);

    prepare?(input: LevelInput, random: () => number): LevelInput;
}

export interface WorldDefinition {
    id: number;
    title: string;
    count: number;
    levels: LevelDefinition[];
    defaults?: Partial<LevelDefinition>;
    characterSkins?: CharacterCostumes;
    starGuardsPause?: boolean;
    verse?: Verse;
    music?: MusicTrack;
    menu?: { image?: string; color?: string; headingColor?: string; headingStroke?: string; headingShadow?: string };
}

export type WorldInput = Omit<WorldDefinition, 'count' | 'levels'> & { count?: number; levels?: LevelInput[] };

export interface ThemeStrategy {
    scenery(scene: any, width: number, theme: string): unknown;

    platform?: { body: number; edge: number; detail: number };
    icy?: boolean;

    drawPlatform?(graphics: any, width: number, palette: { body: number; edge: number; detail: number }): void;
}

export interface EnemyType {
    asset: { width: number; height: number; folder?: string; src?: string };
    body?: { width: number; height: number; x: number; y: number };
    radius?: number;
    groundOffset?: number;

    setup?(scene: any, sprite: any, data: EnemyDefinition): void;

    defaults?: Partial<EnemyDefinition>;
}

export interface EnemyBehavior<T = any, State = any> {
    create?(scene: any, enemy: any, options: Record<string, any>): State;

    update(scene: any, enemy: any, patrol: T, delta: number, options?: Record<string, any>, state?: State): void;

    destroy?(scene: any, enemy: any, state: State): void;
}

export interface WeaponType {
    texture: string;
    scale?: number;
    radius?: number;
    offset?: number;
    warningTint?: number;
    asset?: { src: string; width: number; height: number };
    defaults?: Partial<WeaponSelection>;

    prepare?(scene: any): void;

    canFire?(scene: any, enemy: any, config: WeaponSelection): boolean;

    launch(scene: any, enemy: any, config: WeaponSelection, index: number): Record<string, any>;

    frame(elapsed: number, shot: any, scene?: any): Point & { done: boolean; rotation?: number };
}

export interface CharacterSkin {
    prefix: string;
    folder?: string
}

export interface WeatherType {
    create(scene: any, options: Record<string, any>): unknown;

    destroy?(scene: any, instance: any): void
}

export interface ScenarioType<State = any> {
    validate?(config: ScenarioSelection, level: LevelDefinition): void;

    preload?(scene: any, config: ScenarioSelection): void;

    create?(scene: any, config: ScenarioSelection): State;

    update?(scene: any, state: State, delta: number, config: ScenarioSelection): void;

    onEvent?(scene: any, name: string, payload: any, state: State, config: ScenarioSelection): void;

    destroy?(scene: any, state: State, config: ScenarioSelection): void;
}

export interface ScenarioAction {
    validate?(config: Record<string, any>, level: LevelDefinition): void;

    preload?(scene: any, config: Record<string, any>): void;

    run(scene: any, config: Record<string, any>): void;
}
