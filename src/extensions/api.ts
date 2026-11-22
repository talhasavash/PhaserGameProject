// Eklentilerin kullandığı ortak kayıt API'si; oyun başlatıcısını veya bölüm listesini yüklemez.
export { registerEnemyType } from '../actors/enemies/EnemyCatalog.js';
export { registerEnemyBehavior } from '../actors/enemies/EnemyCatalog.js';
export { registerWeaponType } from '../actors/enemies/WeaponCatalog.js';
export { registerCharacterSkin } from '../data/characters.js';
export { registerTheme } from '../world/scenery/themes.js';
export { registerPlatformTheme } from '../world/terrain/platforms.js';
export { registerWeather } from '../world/scenery/weather.js';
export { registerScenario, registerScenarioAction, emitLevelEvent } from '../game/LevelScenarios.js';
