# Meyve Oyunu 2026

8–10 yaş için **JavaScript + Phaser** ile geliştirilen bir platform oyunu.
Amaç hem oyunu geliştirmek hem de kodunu adım adım anlayarak öğrenmek.
Bu bir öğrenme ve deneme projesidir; senaryo zamanla değişebilir. Yeni özelliklerde
çocukların kullanımı, okunabilir JavaScript ve bilgisayar/telefon/tablet desteği birlikte düşünülür.
Mobil desteği korumak için klavye ve dokunmatik giriş aynı hareket koduna bağlanır.

## İnternetten oyna

Adres: https://talhasavash.github.io/PhaserGameProject/

`main` dalına push yapılınca **Publish game** iş akışı testleri çalıştırır ve
`scripts/build-site.cjs` ile hazırlanan `dist` klasörünü GitHub Pages'e ücretsiz yayımlar.
Ek yükleme gerekmez; bilgisayarın veya yerel Node.js sunucusunun açık kalması gerekmez.
İşlem anlık değildir: GitHub'daki Actions ekranında başarılı olunca sayfayı yenile.
Açık oyun kendiliğinden yeniden başlamaz. Sol üstteki `Demo · ...` bilgisi yayındaki commit'i gösterir.
Yayın kopyasında JS, CSS ve görsel adreslerine commit bilgisi eklenir; kaynak kod değişmeden
eski tarayıcı önbelleğiyle yeni dosyaların karışması önlenir. `dist` Git'e eklenmez.

Oyun sayfası ekranı kaplar; dışarıda başlık, açıklama veya site alt bilgisi yoktur.
Ana ekrandan kurulu PWA destekleyen tarayıcılarda tam ekran açılır; oyun menüsünde
tam ekran aç/kapat düğmesi bulunmaz.
Telefon/tablette dokunmatik sol, sağ ve zıplama düğmeleri görünür. İki parmakla
aynı anda yürüyüp zıplanabilir. Yatay kullanım daha büyük bir oyun görüntüsü sağlar;
oyun oranı korunur, görüntü esnetilmez. Yatay mobilde oyun bütün ekranı kaplar;
düğmeler karakterin altında kalan toprak alanındadır. Dikey telefonda görüntü oranı korunur.
Yatay telefonda 600 yerine 320 dünya birimi yükseklik gösterilir; üst/alt şeritler de
kaldırıldığı için karakter ve nesneler daha büyük görünür. Tablet görünümü 480 birimdir.
Bu değerler `src/ui/browser.js` içindedir. Kamera zemine göre sabittir; zıplarken dikey kaymaz.
Bölüm numarası/can/yıldız/anahtar/puan bilgileri ince bir üst satırdadır.
Üst satır ekran genişliğinin yaklaşık %52'sini kaplar; arka planı %20 opaktır.
Zıplama, toplama, çarpma, can yenileme ve anahtar alma kısa ses efektleri kullanır.
`preload()` içindeki `load.audio` WAV dosyalarını yükler; `sound.play` olay gerçekleştiğinde çalar.
Ses dosyaları `assets/audio` içindedir; özgün tonları `node scripts/build-sounds.cjs` yeniden üretir.
Tarayıcıların ses kuralı nedeniyle ilk tıklama/dokunmadan sonra ses açılır; Phaser bunu yönetir.
Oyun sırasında açılan ipucu/uyarı kutuları ve uyarı tabelaları kapalıdır.
Durum mesajları yalnızca ekran okuyucu için görünmeyen alanda tutulur.
Tam ekranda destekleyen telefonlarda yatay yön istenir. Fiziksel cihaz kontrolü ayrıca yapılmalıdır.
Hem dokunmatik hem klavye zıplamasında erken bırakmak kısa, basılı tutmak yüksek zıplama yapar.
Çok kısa dokunuşlar saklanır; mobilde ilk 70 ms yükseliş korunur, sonra bırakma algılanır.

## JavaScript mi, Phaser mı?

JavaScript programlama dilimizdir. Phaser, JavaScript ile kullandığımız oyun kütüphanesidir.
İkisini birlikte kullanıyoruz.

Kullanılan Phaser sürümü **4.2.1**. Kütüphane `lib/phaser.min.js` içinde yerel olarak tutulur;
oyun açılırken CDN'den indirilmez. Dosya, [resmî sürüm sayfasında](https://phaser.io/download/release/v4.2.1)
belirtilen [sabit sürümlü CDN adresinden](https://cdn.jsdelivr.net/npm/phaser@4.2.1/dist/phaser.min.js) alınmıştır.
Bu dosyayı elle düzenlemiyoruz; kendi oyun kodumuz `src` klasöründedir.
Phaser'ın MIT lisansı `lib/PHASER-LICENSE.md` dosyasındadır.
3.90.0'dan 4.2.1'e geçişte mevcut standart Scene, Arcade Physics, animasyon ve
Graphics API'leri korundu. Özel WebGL pipeline veya DynamicTexture kullanılmadığı
için oyun kodunda uyarlama gerekmedi. Yeni WebGL çizicisi motorla birlikte aktiftir.
Geçiş rehberi: https://github.com/phaserjs/phaser/blob/v4.2.1/changelog/v4/4.0/MIGRATION-GUIDE.md

| İş | Sorumlusu |
| --- | --- |
| Sprite ve görselleri ekrana çizmek | Phaser |
| Yerçekimi ve çarpışma hesapları | Phaser Arcade Physics |
| Klavyeyi okumak, animasyon ve kamera takibi | Phaser |
| Kaç elma toplanacağı, kaç puan kazanılacağı | Bizim JavaScript kodumuz |
| Anahtarın ne zaman çıkacağı, bölümün ne zaman biteceği | Bizim JavaScript kodumuz |
| Yerel sunucudan dosyaları tarayıcıya sunmak | Node.js; oyun motoru değildir |

Örneğin `player.setVelocityX(235)` dediğimizde sağa hareket etme isteğini biz belirleriz;
fizik gövdesini zamana göre hareket ettiren Phaser'dır.

## Proje yapısı

```text
PhaserGameProject/
├── index.html             Sayfa; Phaser'ı ve src/game.js dosyasını yükler
├── css/style.css          Sayfanın görünümü
├── src/
│   ├── game.js                 Giriş noktası, menü, ekran ve fizik ayarları
│   ├── gameplay/               Oyun davranışları
│   │   ├── GameScene.js         Phaser sahnesi; kurulum ve bölüm akışı
│   │   ├── player.js            Karakter, hızlanma, zıplama ve animasyon
│   │   ├── controls.js          Mobil çoklu dokunma
│   │   ├── rules.js             Puan, can ve görev kuralları
│   │   ├── hazards.js           Düşman hareketleri, boss zıplaması ve öfkesi
│   │   ├── fireRain.js          Gökyüzünden düşen seyrek ateş topları
│   │   ├── guardianFire.js      Final muhafızının ağızdan ateş atışı
│   │   └── columns.js           İnip yükselen katı kolonlar ve zamanlama
│   ├── world/                  Bölümler ve ortam
│   │   ├── levelObjects.js      Toplanacak nesneler, çıkış ve can alanlarını kurma
│   │   ├── levels/              Bölüm verileri ve dünya sıralaması
│   │   │   ├── level.js         Dünya listelerini birleştirme ve bölüm sıralaması
│   │   │   ├── world1.js        Dünya 1 bölüm verileri
│   │   │   ├── world2.js        Dünya 2 bölüm verileri
│   │   │   └── world3.js        Dünya 3 bölüm verileri
│   │   ├── scenery/             Arka plan ve dekor çizimleri
│   │   │   ├── background.js    Tema seçimi, ortak cami ve abdest alanı
│   │   │   ├── world1Scenery.js Dünya 1'in tüm arka plan çizimleri
│   │   │   ├── world2Scenery.js Dünya 2 ortamları ve çıkış geçitleri
│   │   │   └── world3Scenery.js Dünya 3 için palet ve çizim başlangıcı
│   │   └── terrain/             Zemin ve basamaklar
│   │       ├── terrain.js       Zemin, çukur, buz ve platform gövdeleri
│   │       ├── pits.js          Açık uçurum çizimleri
│   │       └── platforms.js     Bölüme özel basamak çizimleri
│   ├── graphics/
│   │   └── texture.js           Ortak parametrik doku üretimi ve önbelleği
│   ├── ui/
│   │   ├── levelMenu.js         Dünya/bölüm seçenekleri ve kilitlerin görünümü
│   │   ├── scenePage.js         HTML düğmeleri, sonuç ve yükleme ekranı
│   │   ├── hud.js               Can, görev ve puan
│   │   └── browser.js           Ekran ölçüleri, tam ekran, yön ve PWA
│   └── data/
│       ├── assets.js            Phaser Loader görsel ve ses listeleri
│       ├── progress.js          Tarayıcıda bölüm ilerlemesini saklama
│       └── verses.js            Sonuç kartlarındaki ayet verileri
├── assets/
│   ├── images/            Oyunun kullandığı SVG görseller
│   └── legacy/            Özgün projeden korunan, şu an yüklenmeyen görsel ve sesler
├── lib/phaser.min.js       Kütüphane; bu dosyayı düzenlemiyoruz
├── scripts/               Yerel sunucu, kontrol ve görsel üretim araçları
├── tests/                 Oyun kurallarını kontrol eden testler
└── .run/                  IntelliJ Run ayarı
```

`src` tarayıcıda çalışan oyun kodudur. `scripts` geliştirme araçlarıdır; `tests` doğrulama kodudur.
Bu nedenle bütün JavaScript dosyalarının aynı klasörde olması gerekmez.
`.idea` ve `.git` IDE'nin ve Git'in yönetim klasörleridir; oyun kaynak kodu değildir.

Önceki `archive/game.js` bağımsız bir canvas denemesiydi; Phaser oyununun giriş dosyası değildi.
`archive/anim.js` de yüklenmeyen bir örnekti. Arşiv klasörü kaldırıldı. İkisi de önceki Git
commit'lerinde korunur. **Şimdiki `src/game.js` yeni ve aktif giriş dosyamızdır.**
Eski görsel ve sesler silinmedi; `assets/legacy` içinde korundu. Oyun bu klasörü yüklemez.

## Kodu hangi sırayla okuyalım?

Çalışma sırası ile öğrenme sırası aynı olmak zorunda değil. İlk okumada aşağıdaki
sırayı izle; çağrılan her yardımcı fonksiyonun içine hemen girmek gerekmez.

| Sıra | Dosya | Önce neye bakmalı? |
| --- | --- | --- |
| 1 | `index.html` | Oyun alanı, menü ve iki script etiketi |
| 2 | `src/game.js` | `startSelectedGame` ve `startGame`; seçimin Phaser'a aktarılması |
| 3 | `src/gameplay/GameScene.js` | Yalnızca `init`, `preload`, `create`, `update`; ana akış |
| 4 | `src/data/assets.js` | Görsel/ses anahtarları ve Phaser Loader |
| 5 | `src/world/levels/level.js`, `src/world/terrain/terrain.js`, `src/world/levelObjects.js` | Bölüm verilerinin zemine, nesnelere ve temas bölgelerine dönüşmesi |
| 6 | `src/gameplay/player.js`, `controls.js` | Girdi, hızlanma, zıplama ve animasyon; ardından mobil parmak takibi |
| 7 | `src/gameplay/rules.js` | Puan, yıldız, anahtar ve can; sonra GameScene'deki temas metotlarına dön |
| 8 | `src/ui/hud.js`, `browser.js`, `scenePage.js` | Oyun göstergeleri, mobil ölçüler, HTML düğmeleri ve sonuç kartı |
| 9 | `src/gameplay/hazards.js`, `fireRain.js`, `guardianFire.js` | Devriye, boss öfkesi/zıplaması ve ateş zamanlaması |
| 10 | `src/world/scenery/background.js`, `world1Scenery.js`, `world2Scenery.js`, `world3Scenery.js`, `src/world/terrain/platforms.js`, `src/graphics/texture.js` | Ortam seçimi, dünyaya özel çizimler ve ortak doku önbelleği |
| 11 | `src/ui/levelMenu.js`, `src/data/progress.js`, `verses.js` | Bölüm seçimi, kilitler, localStorage ve sonuç metinleri |

İlk küçük deneme: `src/world/levels/world3.js` içindeki bir meyvenin `x` konumunu değiştir.
Ardından `gameplay/player.js` içindeki `WALK_SPEED` değerini küçük miktarda değiştir.
Son olarak bir yıldızın `collectFruit → recordFruit → updateHud` yolunu takip et.
`lib/phaser.min.js` kütüphanenin sıkıştırılmış dosyasıdır; öğrenmek için onu okumuyoruz.

### Yeni klasörlerle çalışma akışı

Yerelde `scripts/serve.cjs`, internette GitHub Pages dosyaları sunar. Oyun mantığı
tarayıcıda çalışır; her hareket için sunucuya istek gönderilmez.

```mermaid
flowchart TD
    A["Node.js sunucusu / GitHub Pages"] --> B["index.html: Phaser ve src/game.js yüklenir"]
    B --> C["game.js: karakter ve bölüm seçimi"]
    D["world/levels/level.js + data/progress.js: bölümler ve kilitler"] --> C
    C --> E["new Phaser.Game + ui/browser.js: ekran ve fizik"]
    E --> F["gameplay/GameScene.js: init → preload"]
    F --> G["data/assets.js: görsel ve ses yükle"]
    G --> H["GameScene.create: bölümü kur"]
    H --> I["world/: zemin, platform ve arka plan"]
    H --> J["gameplay/: karakter ve tehlikeler"]
    H --> K["ui/hud.js: puan ve görev çubuğu"]
    I --> L["GameScene.update: her karede oyun mantığı"]
    J --> L
    K --> L
    L --> M["player + controls: girdi, hız ve zıplama"]
    M --> N["hazards + boss + fireRain: tehlikeler"]
    N --> O["Phaser: fizik, temas, animasyon, kamera ve çizim"]
    O --> L
    O --> P["Temas metotları + rules.js: toplama, can, anahtar"]
    P -->|"Anahtarla camiye ulaş"| Q["data/progress.js: sonraki bölümün kilidini kaydet"]
    Q --> R["Parlama ve sonuç kartı: data/verses.js"]
    R --> S{"Son bölüm mü?"}
    S -->|"Hayır: Sonraki bölüm"| F
    S -->|"Evet: Ana ekrana dön"| C
```

### Phaser'ın üç temel aşaması

```text
preload()  → Görselleri yükle. Phaser yüklemeyi bitirince devam eder.
create()   → Karakteri, zemini ve temas kurallarını bir kez oluştur.
update()   → Her karede tuşları ve oyun durumunu kontrol et.
```

`GameScene extends Phaser.Scene`, Phaser'ın standart ekran yapısını kullanır.
`this`, çalışan oyun ekranını temsil eder. Kendi karakter veya oyun durumu sınıfımız yok;
`player.js` ve `rules.js` normal fonksiyonlarla çalışır.
`import` başka dosyadan kod alır; `export` o kodu diğer dosyalara açar.

Örnek Phaser komutları:

```js
player.setVelocityX(235);                    // Sağa hız ver.
player.setVelocityY(-590);                   // Yukarı zıplat. Ekranda yukarı yön negatiftir.
this.physics.add.collider(player, platforms); // Platformdan geçmesini engelle.
this.cameras.main.startFollow(player);       // Kamera karakteri izlesin.
```

Kodda basit değişken, nesne, dizi, `if` ve döngülerle ilerliyoruz.
Hareket kodundaki kısa zaman toleransları, kenardan geç basılan veya yere inmeden önce
basılan zıplamaların algılanması içindir. Hız ve süre sabitleri `player.js` başındadır.
`movePlayer` sırasıyla girdiyi okur, yatay hızı, zıplamayı, animasyonu ve gövde eğimini günceller.
Görsel üretim aracı `scripts/build-art.cjs`, yalnızca SVG dosyalarını yeniden üretir;
oyun kodunu öğrenmek için bu araçtan başlamak gerekmez.

Yayın betiği `src` altındaki klasörleri de dolaşır; `./` ve `../` importlarına aynı
commit sürümünü ekler. Eski klasör düzeninden kalan dosyalar yalnızca üretilen
`dist/src` içinde temizlenir. `tests/build-site.test.js` yayın kopyasının importlarını,
sürüm bilgisini ve kaynak dosyaların değişmediğini kontrol eder.

## Kodun görevleri ve Phaser kullanımı

Dosyalar gameplay, world, ui ve data klasörlerinde görevlerine göre gruplanır. Yeni sınıf,
bağımlılık veya karmaşık bir katman sistemi eklenmedi. Bölüm tanımları `world1.js`,
`world2.js` ve `world3.js` içinde veri olarak kalır; `level.js` bu listeleri birleştirir.
Yeni bölüm eklemek için ana oyun döngüsü değiştirilmez.
`world/levels` bölüm verilerini, `world/scenery` dekor çizimlerini, `world/terrain`
zemin ve basamak işlerini toplar. Ortak çizim altyapısı `graphics` içindedir.

`cacheTexture(scene, key, width, height, draw)` arka plan, basamak, çukur, kolon ve
ateş çizimleri tarafından kullanılır. Anahtar zaten varsa yeniden çizmez; yoksa
verilen boyutta dokuyu `draw(graphics)` fonksiyonuyla üretir ve geçici Graphics
nesnesini temizler. Her nesnenin kendi çizim tarifi ilgili dosyada kalır.

- `GameScene.preload` → `assets.js`: görselleri ve sesleri Phaser Loader'a verir.
- `GameScene.create` → dünyayı kurar, karakteri oluşturur ve Phaser collider/overlap bağlantılarını yapar.
- `GameScene.update` → karakter, kamera, düşmanlar, bant, kontrol noktası ve ilerlemeyi günceller.
- `levelObjects.js` → bölüm verilerinden Phaser görsellerini ve fizik temas bölgelerini oluşturur; toplama ve kazanma kararları `GameScene` içinde kalır.
- `levelMenu.js` → HTML dünya/bölüm seçeneklerini kurar; seçili dünya ve oyunu başlatma akışı `game.js` içinde kalır.
- `scenePage.js` → sahnenin HTML düğmelerini bağlar, sahne kapanınca bağlantıları temizler ve sonuç kartını gösterir.
- `hazards.js` → devriye, zıplama, öfke ve ses görevleri ayrı kısa fonksiyonlardır.
- `hud.js` → Phaser Container, Text ve Graphics kullanır. `terrain.js` sabit fizik gruplarını kurar.

Phaser'ın Arcade Physics, animasyon, kamera, tween, ses ve zamanlayıcı sistemlerini
kullanıyoruz. Hız sınırını `Phaser.Math.Clamp`, yumuşak geçişleri `Phaser.Math.Linear`,
bant oklarının dolaşımını `Phaser.Math.Wrap` sağlar. Phaser'ın SHUTDOWN ve DESTROY
olayları hem bölüm değişiminde hem menüye dönüşte giriş/ekran dinleyicilerini temizler.

Yeni bölümün çıkışı `exitType: 'gate'` ile geçit olarak seçilir; diğer bölümler cami
kullanır. Böylece çıkış türü, bölümde kolon olup olmamasından bağımsızdır.

Zıplama toleransı, kısa/uzun zıplama, buzda fren ve son basılan yönün önceliği
oyuna özel küçük JavaScript fonksiyonlarıdır. Bunları fizik motoruna bırakmak aynı
hareket hissini sağlamaz. `rules.js` puan/görev kurallarını, `progress.js` tarayıcı
kaydını yönetir; bu işler için Phaser'a bağımlılık gerekmez. HTML menüler ve mobil
butonlar tarayıcı olaylarını kullanır; çoklu dokunma testleri korunur.

## IntelliJ ile çalıştırma

1. Bu README'nin bulunduğu ana klasörü aç.
2. Üst çubuktan **Meyve Oyunu** Run ayarını seçip Run düğmesine bas.
3. Gerekirse **Run → Edit Configurations → Node runtime** alanından Node.js'i seç.
4. http://localhost:8095 adresini aç. Stop düğmesi sunucuyu kapatır.

Oyun açılınca erkek çocuk veya başörtülü kız çocuk seç, ardından **Maceraya başla** düğmesine bas.
Phaser seçimin ardından başlatılır. İki karakterin hızları, çarpışma kutuları ve özellikleri aynıdır.
R ve Yeniden başla düğmesi seçili karakteri korur; başka karakter seçmek için sayfayı yenileyebilirsin.

Terminalden de çalışır:

```sh
node scripts/serve.cjs
```

Node.js 18 veya üzeri gerekir. Ek bağımlılık kurulumu gerekmez. Npm varsa `npm start` kullanılabilir.
HTML, CSS ve oyun kodu değişince dosyayı kaydet, tarayıcıyı yenile. Sunucuyu yeniden başlatmak gerekmez.
Sunucu kodu değişirse sunucuyu yeniden başlat. Aynı portta ikinci bir sunucu çalıştırma.
HTTP kullan; HTML dosyasını çift tıklayarak açma (oyun ES modülleri kullanır).

## Oynanış

- Oklar veya A/D: yürü. Yukarı ok, W veya Boşluk: zıpla.
- Esc: mola/devam. R: bölümü baştan başlat.
- Üç altın yıldızı tamamla, ileride çıkan anahtarı al ve açılan cami kapısına ulaş. Elmalar 30 puan verir; anahtarı açmaz.
- Görev yıldızı 40; elma, armut, portakal, muz, üzüm ve çilek 30 puan verir. Yaban mersini ve tesbih taneleri 10, seccadeler 20 bonus puandır. Kirpiye, salyangoza ve taşa dokunma.
- Bayrak kontrol noktasını etkinleştirir ve canları doldurur.
- Can bitince geri dönülür; toplananlar korunur. R veya sayfa yenileme bütün bölümü sıfırlar.
- İki yön tuşu birlikte basılıysa son basılan yön önceliklidir; havada da yön değiştirilebilir.
- Tuş bırakılınca karakter süzülerek yavaşlar. Hızlanma, fren ve dönüş değerleri `player.js` başındadır.
- Abdest alanları eksikse bir can doldurur; her biri bölümde bir kez kullanılabilir. Canlar doluysa hak harcanmaz.
- Can kazanıldığında 2,2 saniye gülümseme ve karakteri takip eden yıldız parıltıları görünür.
- Çarpınca yüz 1,5 saniye üzgün olur. İfadeler yürüme ve zıplama sırasında da devam eder.
- Boyut ayarları: `player.js` içindeki `PLAYER_SCALE` ve `GameScene.js` içindeki `COLLECTIBLE_SCALE` ve `hazards.js` içindeki `ENEMY_SCALE`.
- Dururken sallanma yoktur. Zıplama pozundaki kaldırılmış kol iki karakterde de başın yanında açıkça görünür.
- Bant sola taşır; bu bir buz sürtünmesi değildir.

## Dünyalar ve bölüm akışı

Menüde 5 dünya ve her dünyada 15 numaralı bölüm yeri vardır: 1–15, 16–30,
31–45, 46–60 ve 61–75. Mevcut 16 bölüm sırasını korur: ilk 15'i Dünya 1'de,
öğrenme bölümü Dünya 2'nin 16 numaralı yerindedir. Henüz yazılmayan yerler kilitlidir.
Kaynak verileri `world1.js`, `world2.js`, `world3.js` dosyalarında kalır;
`level.js` bunları birleştirip menüde 15'er yerlik dünyalara böler.
İlk açılışta oyun adı, iki çocuk ve tek oynat düğmesi
görünür. Oynat düğmesi bölüm menüsünü açar; oyundan dönüş doğrudan bu menüyedir.
Ana menüde önce dünya, sonra o dünyadaki bölüm seçilir.
Menü dünyaları sırasıyla Meyve Rüyası, Gece Karanlığı, Buz Dağları, Ateş ve Çukur,
Kabe'nin Yolları adlarını taşır. Beş ayrı SVG manzarası `assets/images/menu-world1.svg`
ile `menu-world5.svg` arasındadır; bunlar oyun içindeki bölüm temalarından bağımsızdır.
Ana başlık ve dünya adları Türkçe glifleri doğrulanan yerel Baloo 2 fontunu kullanır (`assets/fonts`, OFL lisansı).
Yazı tipi yayın kopyasına ve çevrimdışı PWA önbelleğine dahildir. Açılışta başlık
yukarıdan, çocuklar iki yandan kısa animasyonlarla girer; azaltılmış hareket
tercihinde bu animasyonlar kapatılır. Stiller `css/menu.css` içindedir.
Dünya 2, 15. bölüm tamamlanınca açılır. Diğer dünyalar da aynı sırayı izler;
bölüm verisi yazılmadan boş yerler oynanamaz. Son hazır bölüm tamamlandığında sonraki
yerin kilit bilgisi de saklanır; bölüm eklendiğinde bu yer otomatik oynanabilir olur.
Canlar sol üstte, soluk bölüm numarası ortada, dolan üç yıldız ve puan sağ üsttedir.
Menüde dünya adı ve numarası üstte, bölüm
numaraları manzara üzerinde büyük yuvarlak düğmelerde gösterilir. Oklar ve alttaki
noktalar dünya sayfalarını değiştirir. Her dünyanın ayrı arka planı vardır.

Başlangıçta yalnızca Dünya 1 / 1 açıktır; her bölüm bitince sonraki açılır. Kilitli
dünyalar önizlenebilir, ancak bölüm düğmeleri devre dışıdır. Açık bir bölüm
dairesine dokunmak seçili karakterle oyunu doğrudan başlatır; ayrı Oyna düğmesi yoktur.
Karakter seçimi alt köşedeki iki küçük portreden yapılır; başlangıçta erkek çocuk seçilidir.
Boss bölümleri de diğerleriyle aynı daire stilini kullanır; açılmayanlar kilitlidir.
Yatay ekranda 5 sütun × 3 satır, dikey telefonda 3 sütun × 5 satır gösterilir.
Yeni bölüm `levels` sırasına eklendiğinde menüdeki karşılık gelen yer hazır hale gelir.
`progress.js` açılan bölüm sayısını `localStorage` içinde saklar. Önceden
4 bölüm açmış bir tarayıcı yeni sürümde de 4'ten devam eder; kayıt silinmez.
Tarayıcı verileri silinirse ilerleme sıfırlanır; farklı cihazlara eşitlenmez.

| Bölüm | Ortam ve yeni mekanik |
| --- | --- |
| 1 | Meyve bahçesi; hareket, yıldızlar, anahtar ve cami kapısı |
| 2 | Kandilli avlu; yüksek basamaklar, hızlı hayvanlar ve taşlar |
| 3 | Çöl; palmiye siluetleri ve seyrek rastgele ateş |
| 4 | Gece bahçesi; daha dar basamaklar, hareketli engeller |
| 5 | Orman; arılar, tilkiler ve ilk gerçek çukurlar |
| 6 | Cami içi; halılar, kolonlar, lafzatullah tabloları, örümcekler ve tekerlekler |
| 7 | Karlı dağ; penguenler, kuşlar, buz ve yarıklar |
| 8 | Dere geçitleri; kurbağalar, kaplumbağalar ve su boşlukları |
| 9 | Kaya vadisi; yarasalar, alçak geçitler, buz ve seyrek ateş |
| 10 | Bayram bahçesi; önceki engellerin birleşimi ve daralan geçişler |
| 11 | Boss; büyük zıplayan muhafızların altından geçerek son camiye ulaşma |

12–15. bölümler farklı geçişler ve yeni düşmanlar sunar (`world2.js` verileri):

| Bölüm | Ortam ve oynanış |
| --- | --- |
| 12 · Lav Vadisi | Lav boşlukları, semenderler, inip yükselen taş kolonlar ve ışıklı çıkış geçidi |
| 13 · Mekanik Fabrika | Ters yönlü bantlar, robotlar, fazları farklı presler ve asansör çıkışı |
| 14 · Kara Kale | Dar koridorlar, zırhlı böcekler, yarasalar, kolon çiftleri ve yükselen kale kapısı |
| 15 · Uçurum Geçidi · Boss | 12 boşluk, iniş adaları ve camiden önce ateş püskürten dev muhafız |

Kolonlar fizik gövdesine sahiptir ve tavana kadar uzanır; üstlerinden atlanamaz.
Başlangıç yüksekliği her denemede bir kez rastgele seçilir (140–340 aralığı);
oyun sırasında kare kare değişmez. Kolon altında gölge veya zemin uyarısı yoktur.
İnişten önce yalnızca kolonun üzerindeki ışık yanıp söner. İniş 220 ms, yerde
bekleme 750 ms ve yükselme 900 ms sürer. Fabrikanın ilk geçidinde beş kolon
430 ms aralıklarla soldan sağa sırayla iner. Aralarında bekleme boşluğu vardır.
Açık süre, genişlik, yükseklik aralığı ve başlangıç gecikmesi bölüm verisindedir. Oyun saati durunca kolonlar da durur;
bölüm yeniden başlayınca zamanlama sıfırlanır. Fabrikadaki bantlar iki yönde de
çalışır. Bu davranışlar Phaser collider/overlap ve fizik gövdeleriyle uygulanır.

Eski kayıt anahtarı ve bölüm indisleri korunur; açılan eski bölümler kapanmaz.

Her bölümde 3 görev yıldızı bulunur. Diğer nesneler sadece puan verir. Anahtar
alınınca cami, geçit, asansör veya kale kapısı açılır ve giriş aydınlanır. Çıkışa ulaşınca çocuk
önce 1,2 saniye yıldızlarla parlar, sonra sonuç kartında yalnızca ayet ve yuvarlak
oynat düğmesi görünür. Yıldız üç kısa, yavaş parlamayla
aydınlanır; `level-complete.wav` bir kez çalar. Ses düzeyi telefonun kendi ses
kontrolleriyle ayarlanır; oyun menüsünde ses aç/kapat düğmesi bulunmaz.
Sesi `node scripts/build-sounds.cjs --result-only` yeniden üretir.
Ayrı bir okuma ekranı veya görünür kaynak bağlantısı yoktur.
Kart kendiliğinden kapanmaz; oynat düğmesi veya Enter ile ilerlenir. Dünya 1 / 15
sonunda da aynı düğmeyle yeni dünya başlar; aynı sahne yeni dünyanın verileriyle kurulur.
Son bölümde oynat düğmesi veya Enter bölüm seçimine döndürür, 1. bölümü
kendiliğinden başlatmaz. Açılan bölümler korunur. Kaynak ve sure/ayet numaraları denetlenebilmesi için
`src/data/verses.js` içinde saklanır; Diyanet meallerinden kısa alıntılar kullanılır.
Üç nokta ayetin yalnızca bir kısmının alındığını gösterir.

`GameScene` bütün bölümlerde aynıdır. Phaser `init(data)` ile bölüm numarası ve
önceki bölümlerden taşınan puanı alır; `scene.restart({ levelIndex, score })` yeni
bölümü kurar. Karakter ve ses tercihi korunur. Yeni bölümde yıldızlar, anahtar ve
canlar sıfırlanır. R/Yeniden başla mevcut bölümü tekrar başlatır.

Basamaklar her bölümde farklı malzeme ve biçimde çizilir: çimen, taş, kumtaşı,
bulut, kütük, halı, buz, köprü, kaya, bayram süsü ve metal. Bazı ileri bölümlerde
50–90 birim genişlikte tek basamak zincirleri vardır. `platforms.js` çizimleri
boyut ve temaya göre bir kez dokuya çevirip önbelleğe alır. Fizik yüzeyleri düz
kalır; süsler çarpışma davranışını değiştirmez. Son bölümün camisinde de taş
kemerli cam pencereler ve mavi gri metal kapılar kullanılır.

Çukurlar sadece bir renk değişikliği değildir: o aralıklarda fizik zemini kurulmaz.
Karakter gerçekten aşağı düşer; düşerken üzülür ve deneme biter. Yeniden dene,
**mevcut bölümün başından** başlatır; o bölümde toplananlar da sıfırlanır.
Önceki bölümlerin toplam puanı ve açılmış bölüm kilitleri korunur. Normal hayvan
çarpmalarında mevcut can/kontrol noktası kuralları devam eder.

Buz açık mavi parlak şeritlerle çizilir. `movePlayer` fonksiyonunun son `grip`
parametresi buzda 0.14 olur: fren ve yön değiştirme yavaşlar; zıplama kuvveti aynı
kalır. `bossLift` muhafızın yüksekliğini zamanla hesaplar. Görsel ve fizik gövdesi
birlikte taşınır; havalanınca altından geçmek mümkündür. Muhafızlara saldırmak
veya onları yenmek gerekmez; zamanlamayla geçmek yeterlidir.

Muhafızların dördü farklı SVG görünümü kullanır. Son turuncu muhafız, oyuncu
450 dünya birimi yakınına geldiğinde öfkelenmeye başlar. Mesafe azaldıkça öfke
artar; temas veya çarpma gerekmez. Yakınında beklemek de öfkeyi artırır; en geç
18 saniyede yüzü değişir, rengi kızarır ve zıplama saati en çok 1.6 kat hızlanır.
Uzaklaştıkça sakinleşir; 450 birimde normal rengine ve hızına döner, bekleme süresi sıfırlanır. Saat kareler boyunca
biriktirilir; hız değişirken zıplamanın ortasında konum atlaması olmaz. Öfke ve
zıplama duraklatmada ilerlemez; bölüm yeniden başlayınca sıfırlanır.
Tam öfkede bile muhafızın altından geçiş süresi test edilir. Can bitip kontrol
noktasına dönüldüğünde de öfke, renk ve hız sıfırlanır. Muhafızların kalkış ve
iniş sesleri yalnızca geçiş anında çalar; uzak muhafızlar duyulmaz.
`build-sounds.cjs --boss-only` bu iki WAV'ı üretir.

6. bölümün son yapısında ahşap pencere bölmeleri yerine taş kemerli açık renkli
vitraylar vardır. Lafzatullah görseli `allah-plaque.svg` içinde standart Arapça
Allah ligatürüyle (U+FDF2) oluşturulur ve arka planda aynı doku tekrar kullanılır.

Ateş olan bölümlerde aynı anda en çok bir top bulunur. Her top bittikten sonra
en az 8 saniye beklenir; konum, hız ve süre değişir. Zeminde gölge, ünlem, üçgen
veya ışık uyarısı yoktur. Hedef seçildikten sonra yer değiştirmez.
Başlangıç, abdest alanları, kontrol noktaları ve
çukurlar hedef seçiminde korunur.

Çukurlar düz çerçeveli kuyular yerine kırık kaya kenarlı, aşağıya doğru genişleyen
karanlık uçurumlar olarak çizilir. `pits.js` her tema/genişlik için bir küçük doku
üretir; fizik boşlukları `terrain.js` içinde aynı ölçülerde kalır. Dünya 2'in dördüncü
bölümünde 12 boşluk bulunur; aralarında en az 150 birim sağlam zemin vardır.

Finalde iki gözlü dev muhafız, yerdeyken iki aralıklı ateş atar; sonra yüksekten
zıplayarak altından koşulabilecek bir aralık bırakır. Son ateş geçmeden zıplamaz.
`guardianFire.js` üç yeniden kullanılan ateş gövdesini, ağız parlamasını ve atış
saatini yönetir; yeni bir gölge veya zemin uyarısı çizmez. Can bitip geri dönülünce
ateşler ve muhafızın saati sıfırlanır. `ogre-flame.svg` yeni muhafızın çizimidir;
`node scripts/build-sounds.cjs --guardian-only` ateş sesini yeniden üretir.

Sağ üstteki Ⅱ mola düğmesini açınca oyun duraklar. Yalnızca Devam et ve Ana ekran
buradadır. Tam ekran aç/kapat veya uygulamadan çıkış düğmesi yoktur. Devam et ile oyun sürer. Yönler saydam üçgen,
zıplama saydam dairedir. Yönler sol alt kenara bitişik ve aralıksız, zıplama sağ
alt kenara sabittir; yön üçgenleri daha dar, yüksek ve yuvarlaktır; telefonun güvenli ekran boşlukları korunur. İki parmakla yön
ve zıplama bağımsız kullanılabilir.
Zıplama basış süresine bağlıdır; erken bırakma kısa, basılı tutma yüksek zıplamadır.

Arka planlar küçük dokulara bir kez çizilir ve `TileSprite` ile tekrarlanır. İlk
bahçenin arka plan nesne sayısı 213'ten 18'e indirilmiştir; bu bir FPS ölçümü
değildir. Gerçek telefon performansı ayrıca kontrol edilmelidir. Her bölümün
camisi ayrı cephe/kubbe/minare düzeni kullanır. Yeni hayvan ve yıldız SVG'leri
`node scripts/build-chapter-art.cjs` ile üretilir; mevcut karakter ve seccade
SVG'lerine dokunulmaz.

## Kontroller ve Git

### Ana ekrana kurulum (PWA)

Oyun APK gerektirmez. Android Chrome menüsünden **Uygulamayı yükle / Ana ekrana ekle**
seçilebilir. Oyun menüsünde kurulum düğmesi bulunmaz. iPhone/iPad'de Safari paylaşım
menüsünden **Ana Ekrana Ekle** kullanılır.
Ana ekran simgesiyle açıldığında `display: fullscreen` sayesinde destekleyen
tarayıcılarda menü dahil tam ekran açılır. Manifestte ekran yönü
`any` olarak ayarlanır; açılışta zorunlu döndürme yapılmaz.
Bölüm dairesine dokunulduğunda tam ekran ve mobilde yatay yön istenir; bu istekler uygulama
açılışında yapılmaz. İzin verilmezse oyun normal ekran boyutunda devam eder.
`src/ui/browser.js` bölüm seçimi sırasındaki ekran isteğini yönetir. Ana menüye dönüşte
yalnızca yön kilidi bırakılır, tam ekran korunur. Uygulamayı kapatmak
için telefonun kendi gezinme ve son uygulamalar kontrolleri kullanılır.
Kurulu uygulama zaten `display-mode: fullscreen` ile açılmışsa bölüm seçimi ikinci bir
Fullscreen API oturumu başlatmaz. Arka plandan dönüldüğünde sistem tam ekranı
bırakmışsa ilk normal dokunuşta yeniden istenir; oyun yeniden yüklenmez.

`manifest.webmanifest` uygulama adını, simgeleri ve göreli yayın yolunu tanımlar.
Başlangıç adresi doğrudan `./index.html` dosyasıdır; uygulama kimliği `./` olarak
korunur. Sayfa isteği dört saniyede sonuçlanmazsa kayıtlı açılış sayfası kullanılır.
Önbelleğe yazılamaması, başarılı bir çevrimiçi açılışı engellemez.
`src/ui/browser.js` service worker kaydını yönetir.
`src/ui/scenePage.js` bölüm yükleme ekranını yönetir: Phaser Loader ilerlemesini
çubuğa aktarır ve ilk `postrender` olayından sonra ekranı kaldırır. Böylece dosyalar
yüklense bile bölüm çizilmeden açık renkli boş canvas gösterilmez.

`scripts/service-worker.js` yayın sırasında `dist/sw.js` olur; bütün oyun kaynakları ilk çevrimiçi açılışta
önbelleğe alınır. İndirme tamamlandıktan sonra internet olmadan da oynanabilir.
Çevrimiçi açılışta güncel dosyalar istenir; açık oyun zorla yenilenmez. Yeni worker
açık eski sekmeler kapanınca etkinleşir. Tarayıcı verilerini temizlemek çevrimdışı
kopyayı ve bölüm ilerlemesini siler.

Geliştirmede (`npm start`) service worker kaydedilmez; böylece kod değişikliklerini
önbellek gizlemez. PWA denemek için `node scripts/build-site.cjs` ardından PowerShell'de
`$env:PREVIEW_DIST='1'; npm start` kullanılabilir. HTTPS yayını veya localhost gerekir.
`scripts/build-icon.cjs`, mevcut kız/erkek SVG'lerinden simgenin vektörünü üretir;
192 ve 512 piksel PNG karşılıkları `assets/icons` içinde tutulur.

```sh
node scripts/check.cjs
node --test tests/*.test.js
```

Npm varsa `npm run check` ve `npm test` eşdeğerdir.
Uzak depo: https://github.com/talhasavash/PhaserGameProject
Özgün oyun ilk commit'te saklıdır. Eski dosyalara ihtiyaç duyarsak Git geçmişinden alabiliriz.
