# Meyve Oyunu 2026

8–10 yaş için **JavaScript + Phaser** ile geliştirilen bir platform oyunu.
Amaç hem oyunu geliştirmek hem de kodunu adım adım anlayarak öğrenmek.

## JavaScript mi, Phaser mı?

JavaScript programlama dilimizdir. Phaser, JavaScript ile kullandığımız oyun kütüphanesidir.
İkisini birlikte kullanıyoruz.

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
├── src/                   Yazdığımız aktif oyun kodu: alt klasör yok
│   ├── game.js            Giriş noktası, ekran ve fizik ayarları
│   ├── GameScene.js       Phaser ekranı; bölümün kurulması ve oyun akışı
│   ├── player.js          Karakter oluşturma, yürüme ve zıplama
│   ├── level.js           Platform, meyve ve düşman konumları
│   ├── rules.js           Puan, can, elma, anahtar ve bitiş kuralları
│   └── background.js      Arka plan, ağaç, bulut ve tabela çizimleri
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

1. **index.html:** İki script'e bak. Önce Phaser, ardından `src/game.js` yüklenir.
2. **src/game.js:** `new Phaser.Game(...)` oyunu başlatır. Boyut, yerçekimi ve kullanılacak ekran burada seçilir.
3. **src/GameScene.js:** Şimdilik sadece `preload`, `create` ve `update` fonksiyonlarına bak.
4. **src/player.js:** Tuş okumadan hız vermeye kadar hareket kodunu takip et.
5. **src/level.js:** Bir platformun veya meyvenin `x`, `y` değerini değiştirip sonucu gör.
6. **src/rules.js:** Meyve toplanınca puanın ve görev durumunun nasıl değiştiğini incele.
7. **src/background.js:** Görünümü değiştirmek istediğinde bak.

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
Görsel üretim aracı `scripts/build-art.cjs`, yalnızca SVG dosyalarını yeniden üretir;
oyun kodunu öğrenmek için bu araçtan başlamak gerekmez.

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
- Üç kırmızı elmayı tamamla, ileride çıkan anahtarı al ve cami girişine ulaş.
- Meyveler ve tesbih taneleri 10, seccadeler 20 bonus puan verir. Kirpiye, salyangoza ve taşa dokunma.
- Bayrak kontrol noktasını etkinleştirir ve canları doldurur.
- Can bitince geri dönülür; toplananlar korunur. R veya sayfa yenileme bütün bölümü sıfırlar.
- İki yön tuşu birlikte basılıysa son basılan yön önceliklidir; havada da yön değiştirilebilir.
- Tuş bırakılınca karakter süzülerek yavaşlar. Hızlanma, fren ve dönüş değerleri `player.js` başındadır.
- Abdest alanları eksikse bir can doldurur; her biri bölümde bir kez kullanılabilir. Canlar doluysa hak harcanmaz.
- Can kazanıldığında 2,2 saniye gülümseme ve karakteri takip eden yıldız parıltıları görünür.
- Çarpınca yüz 1,5 saniye üzgün olur. İfadeler yürüme ve zıplama sırasında da devam eder.
- Boyut ayarları: `player.js` içindeki `PLAYER_SCALE` ve `GameScene.js` içindeki `COLLECTIBLE_SCALE`, `ENEMY_SCALE`.
- Dururken sallanma yoktur. Zıplama pozundaki kaldırılmış kol iki karakterde de başın yanında açıkça görünür.
- Bant sola taşır; bu bir buz sürtünmesi değildir.

Şimdilik tek bölüm var. Yeni bölümler, ses, kalıcı kayıt ve dokunmatik kontroller daha sonra eklenebilir.

## Kontroller ve Git

```sh
node scripts/check.cjs
node --test tests/rules.test.js tests/scene-flow.test.js tests/player.test.js
```

Npm varsa `npm run check` ve `npm test` eşdeğerdir.
Uzak depo: https://github.com/talhasavash/PhaserGameProject
Özgün oyun ilk commit'te saklıdır. Eski dosyalara ihtiyaç duyarsak Git geçmişinden alabiliriz.
