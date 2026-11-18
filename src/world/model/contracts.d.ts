// JavaScript oluşturucularının ve oyun eklentilerinin IntelliJ tarafından okunan interface sözleşmeleri.
export interface Point { x: number; y: number }
export interface Strip { x: number; width: number }
export interface Platform extends Strip { y: number; ice?: boolean; single?: boolean }
export interface Collectible extends Point { id: string; type: string; platform?: number }
export interface Patrol { minX: number; maxX: number; speed: number }
export interface Visibility { visibleMs?: number; hiddenMs?: number; fadeMs?: number; offset?: number }
export interface Hop { walkMs?: number; pauseMs?: number; height?: number; duration?: number; offset?: number }
export interface Shot { kind?: 'shard'; period: number; speed: number; volley?: number; range?: number }
export interface EnemyDefinition extends Partial<Patrol> {
    type: string; x: number; y?: number; texture?: string; platform?: number;
    scale?: number; bob?: number; period?: number; offset?: number; threadTop?: number;
    visibility?: Visibility; hop?: Hop; snowball?: Shot; rage?: boolean;
    jump?: { height: number; duration: number; period: number; offset: number };
    breath?: { shots: number[]; speed: number; range: number };
    components?: string[];
    behaviors?: { patrol?: Partial<Patrol>; hop?: Hop; visibility?: Visibility; shoot?: Shot;
        vertical?: { bob?: number; period?: number; offset?: number; threadTop?: number };
        jump?: EnemyDefinition['jump']; breath?: EnemyDefinition['breath']; rage?: boolean };
}
export interface Verse { text: string; reference?: string; source?: string }
export interface LevelDefinition {
    id?: string; template?: string; stage?: number; name: string; theme: string; width: number; groundY: number;
    spawn: Point; checkpoint: Point; key: Point; exit: Point;
    platforms: Platform[]; fruits: Collectible[]; enemies: EnemyDefinition[];
    fountains: { id: string; x: number }[]; belt: Strip & { speed: number };
    gaps: Strip[]; ice?: Strip[]; belts?: (Strip & { speed: number })[];
    boss?: boolean; frozenItems?: boolean; verse?: Verse; characterSkin?: string;
    ball?: EnemyDefinition; extraHazards?: EnemyDefinition[];
    fireRain?: { kind?: 'snow'; period: number; speed: number; offset: number }[];
    columns?: (Strip & { openMs?: number; raisedBottom?: number; raisedRange?: number[]; offset?: number; startDelay?: number })[];
    passages?: (Strip & { y: number })[]; exitType?: string; exitLabel?: string;
    mosqueStyle?: Record<string, unknown>; routes?: string[]; vanishAll?: boolean;
}
export type PlatformCollectible = Omit<Collectible, 'x' | 'y'> & Partial<Point> & { platform: number };
export type PlatformEnemy = Omit<EnemyDefinition, 'x'> & { x?: number; platform: number };
export type LevelInput = Pick<LevelDefinition, 'name'> &
    Partial<Omit<LevelDefinition, 'name' | 'width' | 'fruits' | 'enemies' | 'spawn' | 'checkpoint' | 'key' | 'exit'>> & {
        width?: number; fruits?: (Collectible | PlatformCollectible)[]; enemies?: (EnemyDefinition | PlatformEnemy)[];
        spawn?: Partial<Point>; checkpoint?: Partial<Point>; key?: Partial<Point>; exit?: Partial<Point>;
    };
export interface LevelTemplate {
    parent?: string;
    defaults?: Partial<LevelInput> | ((input: LevelInput) => Partial<LevelInput>);
    prepare?(input: LevelInput, random: () => number): LevelInput;
}
export interface WorldDefinition {
    id: number; title: string; count: number; levels: LevelDefinition[];
    defaults?: Partial<LevelDefinition>; characterSkins?: Record<string, string>;
    starGuardsPause?: boolean; verse?: Verse;
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
    asset: { width: number; height: number };
    body?: { width: number; height: number; x: number; y: number };
    radius?: number; groundOffset?: number; setup?(scene: any, sprite: any, data: EnemyDefinition): void;
    defaults?: Partial<EnemyDefinition>;
}
export interface EnemyBehavior<T = any> {
    update(scene: any, enemy: any, patrol: T, delta: number): void;
}
