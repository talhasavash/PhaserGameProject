// Sabit fizik adımlarını ve aralarındaki görüntü oranını yönetir; uzun karelerde sınırsız telafi yapmaz.
export const labPhysics = {
    enableSleeping: false, // Destek çekilince kutular aynı adımda yerçekimine tepki versin.
    positionIterations: 12, velocityIterations: 10, constraintIterations: 4
};

export class FixedStepSimulation {
    static readonly stepMs = 1000 / 120;
    private remainder = 0;

    advance(delta: number, step: (milliseconds: number) => void): number {
        this.remainder += Math.max(0, Math.min(delta, 100));
        while (this.remainder + 1e-8 >= FixedStepSimulation.stepMs) {
            step(FixedStepSimulation.stepMs);
            this.remainder -= FixedStepSimulation.stepMs;
        }
        return Math.max(0, this.remainder / FixedStepSimulation.stepMs);
    }

    reset() { this.remainder = 0; }
}
