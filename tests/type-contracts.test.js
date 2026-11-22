// Yeni bölüm ve düşman tanımlarındaki tip hatalarının oyun açılmadan yakalandığını doğrular.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import ts from 'typescript';
import { platformThemes } from '../.build/src/world/terrain/platforms.js';
import { enemyTypes } from '../.build/src/actors/enemies/EnemyCatalog.js';
import { weaponTypes } from '../.build/src/actors/enemies/WeaponCatalog.js';
import { characterSkins } from '../.build/src/data/characters.js';
import { levelTemplates } from '../.build/src/world/model/templates.js';

test('TypeScript rejects invalid level coordinates, enemy assets and incomplete weapon contracts', () => {
    const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
    const file = path.resolve('tests/virtual-contract-check.ts');
    const code = `
        import { defineLevel } from '../src/world/model/definitions.js';
        import { registerEnemyType } from '../src/actors/enemies/EnemyCatalog.js';
        import { registerWeaponType } from '../src/actors/enemies/WeaponCatalog.js';
        import { platform, item, weapon, scenario, scenery, weather } from '../src/world/model/levelParts.js';
        defineLevel({ name: 'Test', width: '4200' });
        registerEnemyType('test', { asset: { width: '76', height: 52 } });
        registerWeaponType('test', { texture: 'test', launch() { return {}; } });
        platform.icy('250', 430, 160);
        item.onPlatform('star', '0');
        weapon.bullet({ period: '3000' });
        scenario.changeWeapon(1000, 400, 'guard', { type: 'snowball', speed: '170' });
        scenery.cloud(200, 110, { repeat: { count: '8', stepX: 500 } });
        weather.snow({ intensity: '1' });
    `;
    const host = ts.createCompilerHost(parsed.options);
    const getSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (name, ...args) => path.resolve(name) === file
        ? ts.createSourceFile(file, code, parsed.options.target, true)
        : getSourceFile(name, ...args);
    const program = ts.createProgram([...parsed.fileNames, file], { ...parsed.options, noEmit: true }, host);
    const errors = ts.getPreEmitDiagnostics(program).filter(error => error.category === ts.DiagnosticCategory.Error);
    assert.equal(errors.length, 9, ts.formatDiagnosticsWithColorAndContext(errors, {
        getCurrentDirectory: () => process.cwd(), getCanonicalFileName: name => name, getNewLine: () => '\n'
    }));
    assert.ok(errors.every(error => path.resolve(error.file.fileName) === file));
    assert.ok(errors.some(error => ts.flattenDiagnosticMessageText(error.messageText, ' ').includes('frame')));
});

test('Chapter authoring suggests registered built-ins inside string values and accepts extension names', () => {
    const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
    const file = path.resolve('tests/virtual-completions.ts');
    const code = `
        import { defineLevel } from '../src/world/model/definitions.js';
        import { defineEnemy } from '../src/actors/enemies/EnemyCatalog.js';
        import { platform, item, gap, column, outfits, weapon, weather, scenery } from '../src/world/model/levelParts.js';
        platform.icy(250, 430, 160, { style: /*factory-platform*/ '' });
        item.at(/*factory-fruit*/ '', 300, 480);
        gap(2200, 140, { style: /*factory-gap*/ '' });
        column(2700, 80, { style: /*factory-column*/ '' });
        outfits.pair(/*factory-boy*/ '', /*factory-girl*/ '');
        weapon.of(/*factory-weapon*/ '');
        weather.of(/*factory-weather*/ '');
        weapon.bullet({ /*weapon-options*/ });
        weather.snow({ /*weather-options*/ });
        scenery.cloud(200, 110, { /*scenery-options*/ });
        defineLevel({ name: 'Hints', width: 4000,
            theme: /*theme*/ '', template: /*template*/ '',
            environment: { background: /*background*/ '', platformStyle: /*platform*/ '', weather: { type: /*weather*/ '' } },
            platforms: [{ x: 250, y: 430, width: 160, style: /*surface*/ '' }],
            gaps: [{ x: 2200, width: 140, style: /*pit*/ '' }],
            columns: [{ x: 2700, width: 80, style: /*column*/ '' }],
            fruits: [{ id: 'fruit-1', x: 300, y: 480, type: /*fruit*/ '' }],
            player: { costume: { boy: /*skin*/ '' } },
            enemies: [defineEnemy(/*enemy*/ '', { x: 1300, weapon: { type: /*weapon*/ '' } })]
        });
        // Eklentinin kayıt fonksiyonları mevcut çalışma zamanı doğrulamasını kullanır.
        defineLevel({ name: 'Extension', width: 4000, template: 'custom-template', theme: 'custom-theme',
            platforms: [{ x: 200, y: 430, width: 160, style: 'custom-style' }],
            gaps: [{ x: 2200, width: 140, style: 'custom-style' }],
            environment: { weather: { type: 'custom-weather' } },
            player: { costume: { girl: 'custom-skin' } },
            enemies: [defineEnemy('custom-enemy', { x: 1300, weapon: { type: 'custom-weapon' } })]
        });
    `;
    const readFile = name => path.resolve(name) === file ? code : ts.sys.readFile(name);
    const service = ts.createLanguageService({
        getScriptFileNames: () => [...parsed.fileNames, file], getScriptVersion: () => '0',
        getScriptSnapshot: name => { const text = readFile(name); return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text); },
        getCurrentDirectory: () => process.cwd(), getCompilationSettings: () => parsed.options,
        getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
        fileExists: name => path.resolve(name) === file || ts.sys.fileExists(name),
        readFile, readDirectory: ts.sys.readDirectory, directoryExists: ts.sys.directoryExists
    });
    try {
        const styles = Object.keys(platformThemes);
        const expected = {
            theme: styles, background: styles, platform: styles, surface: styles, pit: styles, column: styles,
            'factory-platform': styles, 'factory-gap': styles, 'factory-column': styles,
            'factory-boy': [...characterSkins.keys()], 'factory-girl': [...characterSkins.keys()],
            'factory-fruit': ['apple', 'star', 'bead'],
            'factory-weapon': [...weaponTypes.keys()], 'factory-weather': ['snow', 'none'],
            template: [...levelTemplates.keys()], weather: ['snow', 'none'],
            fruit: ['apple', 'pear', 'star', 'bead', 'mat', 'lantern', 'crescent'],
            skin: [...characterSkins.keys()], enemy: [...enemyTypes.keys()], weapon: [...weaponTypes.keys()]
        };
        for (const [marker, names] of Object.entries(expected)) {
            const token = `/*${marker}*/ ''`;
            const position = code.indexOf(token) + token.length - 1;
            const completions = service.getCompletionsAtPosition(file, position, {});
            const suggestions = new Set(completions?.entries.map(entry => entry.name));
            for (const name of names) assert.ok(suggestions.has(name), `${marker} must suggest ${name}`);
        }
        for (const [marker, names] of Object.entries({
            'weapon-options': ['period', 'speed', 'volley', 'range'],
            'weather-options': ['intensity', 'wind'],
            'scenery-options': ['width', 'height', 'color', 'scrollFactor', 'repeat']
        })) {
            const token = `/*${marker}*/`;
            const position = code.indexOf(token) + token.length;
            const suggestions = new Set(service.getCompletionsAtPosition(file, position, {})?.entries.map(entry => entry.name));
            for (const name of names) assert.ok(suggestions.has(name), `${marker} must suggest ${name}`);
        }
        const errors = service.getSemanticDiagnostics(file).filter(item => item.category === ts.DiagnosticCategory.Error);
        assert.deepEqual(errors, [], 'Custom registered names remain valid TypeScript inputs');
    } finally { service.dispose(); }
});
