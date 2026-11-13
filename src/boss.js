// Muhafız önce yerde bekler, sonra yüksek bir yay çizerek zıplar.
// Yükseldiği aralıkta çocuğun altından koşarak geçebileceği boşluk açılır.
export function bossLift(elapsed, jump) {
    const phase = (elapsed + jump.offset) % jump.period;
    if (phase >= jump.duration) return 0;
    const t = phase / jump.duration;
    return 4 * jump.height * t * (1 - t);
}

// Ses her karede değil, yalnızca yerden ayrılma ve yere basma anında çalar.
export function bossStep(before, after, jump) {
    const previousLift = bossLift(before, jump);
    const lift = bossLift(after, jump);
    let sound = null;
    if (previousLift <= 0 && lift > 0) sound = 'boss-jump';
    if (previousLift > 0 && lift <= 0) sound = 'boss-land';
    return { lift, sound };
}

// Son muhafız, oyuncu yaklaştıktan sonra 18 saniyede giderek öfkelenir.
export function bossMood(elapsed, engagedAt, distance = 450) {
    const proximity = Math.max(0, Math.min(1, 1 - distance / 450));
    const anger = engagedAt === null ? 0 : Math.max(0, Math.min(1, (elapsed - engagedAt) / 18000 + proximity * 0.75));
    const green = Math.round(255 - anger * 138);
    const blue = Math.round(255 - anger * 147);
    return { anger, speed: 1 + anger * 0.6, tint: (255 << 16) | (green << 8) | blue, angry: anger >= 0.5 };
}

export function resetBossRage(guards) {
    for (const guard of guards) {
        const patrol = guard.getData('patrol');
        if (!patrol.rage) continue;
        patrol.engagedAt = null;
        patrol.jumpClock = 0;
        guard.setTint(0xffffff);
        guard.setTexture('ogre-ember');
    }
}
