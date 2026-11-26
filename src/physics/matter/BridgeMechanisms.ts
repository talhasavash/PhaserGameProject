// Sandık/taş baskı plakasında durunca mandalı açar; serbest kalan köprüyü Matter yerçekimi devirir.
import type {PressureBridgeDefinition} from './definitions.js';
import type {MatterLibrary, MatterLabWorld} from './MatterObjects.js';

export function cargoOnPlate(body: MatterJS.BodyType, plate: PressureBridgeDefinition['plate']): boolean {
    const width = body.bounds.max.x - body.bounds.min.x;
    return Math.abs(body.position.x - plate.x) <= Math.max(8, (plate.width - width) / 2 + 8) &&
        Math.abs(body.bounds.max.y - plate.y) < 8 && Math.abs(body.velocity.x) < .8;
}
export class BridgeMechanisms {
    readonly states: {definition: PressureBridgeDefinition; charge: number; released: boolean}[];
    constructor(private readonly matter: MatterLibrary, private readonly world: MatterLabWorld,
        definitions: PressureBridgeDefinition[], private readonly changed: (id: string, charge: number, released: boolean) => void = () => {}) {
        this.states = definitions.map(definition => {
            const plank = world.objects.get(definition.plankId)!.body;
            matter.Sleeping.set(plank, false);
            matter.Body.setStatic(plank, true);
            return {definition, charge: 0, released: false};
        });
    }
    update(delta: number) {
        for (const state of this.states) {
            if (state.released) continue;
            const d = state.definition, cargo = this.world.objects.get(d.cargoId)!.body;
            state.charge = cargoOnPlate(cargo, d.plate) ? Math.min(1, state.charge + delta / (d.holdMs ?? 450)) : 0;
            if (state.charge >= 1) {
                state.released = true;
                const plank = this.world.objects.get(d.plankId)!.body;
                this.matter.Body.setStatic(plank, false);
                this.matter.Sleeping.set(plank, false);
                // Mandalın küçük bırakma hareketi; sonraki hareketi fizik motoru hesaplar.
                this.matter.Body.setAngularVelocity(plank, .015);
            }
            this.changed(d.id, state.charge, state.released);
        }
    }
}

export function createBridgeMechanisms(scene: Phaser.Scene, matter: MatterLibrary, world: MatterLabWorld,
    definitions: PressureBridgeDefinition[]) {
    const markers = new Map(definitions.map(d => {
        const plate = scene.add.rectangle(d.plate.x, d.plate.y - 3, d.plate.width, 6, 0xc68f48).setDepth(7);
        const charge = scene.add.rectangle(d.plate.x - d.plate.width / 2, d.plate.y - 3, d.plate.width, 6, 0x76d29f)
            .setOrigin(0, .5).setScale(0, 1).setDepth(8);
        const cargo = world.objects.get(d.cargoId)!.definition;
        const icon = ('radius' in cargo ? scene.add.circle(d.plate.x, d.plate.y - 15, 8, 0xe4cda0, .55)
            : scene.add.rectangle(d.plate.x, d.plate.y - 15, 16, 16, 0xe4cda0, .55)).setStrokeStyle(2, 0xffe3a0).setDepth(7);
        const plank = world.objects.get(d.plankId)!.body;
        const latch = scene.add.rectangle(plank.position.x, plank.position.y, 30, 18, 0xe4b758).setStrokeStyle(3, 0x83603c).setDepth(9);
        return [d.id, {plate, charge, icon, latch}] as const;
    }));
    return new BridgeMechanisms(matter, world, definitions, (id, charge, released) => {
        const marker = markers.get(id)!;
        marker.charge.setScale(charge, 1);
        marker.latch.setVisible(!released);
        if (released) {
            marker.plate.setFillStyle(0x76d29f); marker.icon.setFillStyle(0x76d29f, .8);
            scene.sound.play('key', {volume: .14});
        }
    });
}
