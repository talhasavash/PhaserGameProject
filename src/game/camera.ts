// Yakınlaştırmayı değiştirmeden oyuncu ve yakındaki iniş platformuna göre dikey görüşü hesaplar.
import type {LevelDefinition} from '../world/model/contracts.js';

export function platformCameraTop(level: LevelDefinition, x: number, y: number, feet: number, height: number) {
    // Üzerinde durulan platform iniş hedefi değildir; oyuncunun aşağısına bak.
    const landings = level.platforms.filter(platform => platform.y > feet + 12 &&
        x >= platform.x - 150 && x <= platform.x + platform.width + 150);
    const lowestVisibleY = y - 48 + height - 32;
    const visibleLandings = [level.groundY, ...landings.map(platform => platform.y)]
        .filter(landingY => landingY <= lowestVisibleY);
    // Sığıyorsa ana zemini, sığmıyorsa görülebilecek en aşağıdaki iniş platformunu göster.
    const landingY = visibleLandings.length ? Math.max(...visibleLandings) : level.groundY;
    return Math.max(0, Math.min(600 - height, landingY + 32 - height, y - 48));
}
