// Muhafız önce yerde bekler, sonra yüksek bir yay çizerek zıplar.
// Yükseldiği aralıkta çocuğun altından koşarak geçebileceği boşluk açılır.
export function bossLift(elapsed, jump) {
    const phase = (elapsed + jump.offset) % jump.period;
    if (phase >= jump.duration) return 0;
    const t = phase / jump.duration;
    return 4 * jump.height * t * (1 - t);
}
