# Meyve Oyunu

HTML, CSS ve JavaScript ile geliştirilmiş, Phaser kullanan bir tarayıcı platform oyunu.
Phaser projede yerel dosya olarak bulunur; oyun harici CDN gerektirmez.

## IntelliJ IDEA ile açma

1. **File → Open** ile bu README'nin bulunduğu `PhaserGameProject` klasörünü açın.
2. Java, Maven veya Gradle projesi oluşturmayın. Bu bir JavaScript/web projesidir.
3. **Settings → Plugins** altında **JavaScript and TypeScript** eklentisini etkinleştirin.
4. IntelliJ terminalinde aşağıdaki komutu çalıştırın:

   ```sh
   node scripts/serve.cjs
   ```

5. Tarayıcıda http://localhost:8080 adresini açın. Değişiklikleri görmek için sayfayı yenileyin.
6. Sunucuyu kapatmak için terminalde `Ctrl+C` kullanın.

### IntelliJ Run düğmesi

`.run/Meyve Oyunu.run.xml` paylaşılabilir bir Node.js çalıştırma ayarı içerir.
Node.js eklentisi etkinse üst araç çubuğundan **Meyve Oyunu** ayarını seçip Run düğmesine basın.
İlk çalıştırmada **Run → Edit Configurations → Meyve Oyunu → Node runtime** alanından
bilgisayarınızdaki Node.js kurulumunu seçmeniz gerekebilir.
Bu ayar 8095 portunu kullanır: http://localhost:8095.
Sunucuyu IntelliJ'deki Stop düğmesiyle durdurun. Aynı portta ikinci sunucu başlatmayın.

Node.js Run seçeneği bulunmuyorsa terminalde `$env:PORT = '8095'` yazıp
`node scripts/serve.cjs` çalıştırın. `node` komutu tanınmıyorsa Node.js kurulmalı veya
IntelliJ terminalinin PATH ayarı güncellenmelidir.

Bu sunucu yalnızca HTML, CSS, JavaScript ve görselleri sunar; oyun mantığı tarayıcıda çalışır.
Veritabanı ya da ayrı bir oyun backend'i yoktur. Sunucu yalnızca yerel bilgisayardan erişilir.

Sunucu Node.js 18 veya üzerini gerektirir. Ek npm bağımlılığı yoktur; `npm install` gerekmez.
Node.js/npm kuruluysa alternatif olarak `npm start` kullanılabilir. IntelliJ'nin yerleşik web sunucusu
üzerinden `index.html` dosyasını tarayıcıda açmak da mümkündür.
Görsellerin yüklenmesi için HTTP üzerinden çalıştırın; HTML dosyasına çift tıklayarak açmayın.

8080 portu doluysa PowerShell'de:

```powershell
$env:PORT = '8081'
node scripts/serve.cjs
```

## Kontroller ve mevcut akış

- Sol/sağ ok: hareket.
- Yukarı ok: zıplama.
- Boşluk: mevcut oyunu yeniden başlatma.
- On meyveyi toplayınca anahtar belirir. Anahtarı alıp kapıya ulaşınca kazanılır.
- Üç ateş darbesi oyunu bitirir.

Bu hazırlık sürümünde tek bölüm vardır. Bölüm geçişleri ve yeni haritalar sonraki geliştirmedir.
Klavye gerekir; mobil dokunmatik kontroller henüz yoktur.

## Klasörler

```text
index.html          Tarayıcı giriş sayfası
css/style.css       Sayfa görünümü
src/main.js         Mevcut oyunun kodu (önceki move.js)
assets/images/      Oyunun ve eski denemelerin görselleri
assets/audio/       Korunan ses dosyaları (mevcut oyunda kullanılmıyor)
lib/phaser.min.js   Projeden gelen Phaser dağıtımı
scripts/serve.cjs   Yalnızca yerel bilgisayara açık geliştirme sunucusu
archive/            Çalıştırılmayan eski JavaScript denemeleri
```

Yeni bölümler eklenirken oyun kodu `src/scenes/` ve `src/levels/` olarak ayrılabilir.
Mevcut görseller ve sesler ileride kullanılabilmeleri için korunmuştur.

## Git ve doğrulama

Git deposu bu klasörün kökündedir. `.idea`, işletim sistemi metaverileri,
yerel ortam dosyaları ve üretilen çıktılar `.gitignore` ile dışlanır.
Özgün oyunun hali ilk commit'te saklanmıştır.

JavaScript sözdizimi kontrolü:

```sh
node --check src/main.js
node --check scripts/serve.cjs
```

Alternatif olarak npm kuruluysa `npm run check` kullanılabilir.

Oynanış kontrolü: hareket etme, zıplama, meyve toplama, hasar alma,
anahtarı alma, kapıya ulaşma ve boşlukla yeniden başlatma.
