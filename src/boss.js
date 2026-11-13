// Muhafız önce yerde bekler, sonra yüksek bir yay çizerek zıplar.
// Yükseldiği aralıkta çocuğun altından koşarak geçebileceği boşluk açılır.
export function bossLift(elapsed, jump) {
    const phase = (elapsed + jump.offset) % jump.period;
    if (phase >= jump.duration) return 0;
    const t = phase / jump.duration;
    return 4 * jump.height * t * (1 - t);
}

// Son muhafız, oyuncu yaklaştıktan sonra 18 saniyede giderek öfkelenir.
export function bossMood(elapsed, engagedAt) {
    const anger = engagedAt === null ? 0 : Math.max(0, Math.min(1, (elapsed - engagedAt) / 18000));
    const green = Math.round(255 - anger * 138);
    const blue = Math.round(255 - anger * 147);
    return { anger, speed: 1 + anger * 0.6, tint: (255 << 16) | (green << 8) | blue, angry: anger >= 0.5 };
}
