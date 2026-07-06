# PaperAnalysis

SQL sunucularından veri çekip grafikleştiren, sürükle-bırak panolar oluşturmanıza
olanak tanıyan **masaüstü** veri analiz aracı.

Electron + React + TypeScript ile geliştirilmiştir.

## Özellikler

- **Çoklu veritabanı bağlantısı:** Microsoft SQL Server, PostgreSQL, MySQL/MariaDB, SQLite
- **Veritabanı şema gezgini:** Bağlantının tablo/sütun ağacı; tabloya tıklayınca
  otomatik `SELECT`, sütuna tıklayınca sorguya alan ekleme
- **Görsel Birleştirme (Join) Sihirbazı:** SQL yazmadan aynı veritabanındaki iki tabloyu
  birleştirme — INNER/LEFT/RIGHT/FULL JOIN, "yalnızca eşleşmeyenler", UNION ve değer
  filtreleri; üretilen sorguyu çalıştırıp **Excel** olarak dışa aktarma
- **SQL sorgu editörü:** Monaco tabanlı, söz dizimi vurgusu, `Ctrl/Cmd+Enter` ile çalıştırma
- **Sonuç tablosu:** Sorgu sonuçlarını anında tablolaştırma
- **Grafikler (Apache ECharts):** Sütun (bar), yığılmış sütun, çizgi, alan (area),
  saçılım (scatter), pasta, **KPI kartı** ve **tablo** görselleri
  - Kategori (X) / ölçü (Y) eşleme + agregasyon (SUM/AVG/COUNT/MIN/MAX)
  - **Çoklu seri** desteği (birden fazla ölçü)
  - **✨ Otomatik grafik:** Sorgu çalışınca sütun tipleri (metin/tarih/sayı) algılanıp
    makul bir grafik (X, Y, tür) otomatik önerilir ve anında önizlenir
- **Filtreler & etkileşim:** Pano genelinde parametreler (`:ad` yer tutucuları ile,
  güvenli parametre bağlama), filtre çubuğu ve **otomatik yenileme**
- **Çapraz filtreleme (cross-filter):** Bir grafikte bir kategoriye/dilime tıklayınca
  ilgili pano parametresi ayarlanır ve diğer grafikler o değere göre süzülür
  (aynı değere tekrar tıklamak filtreyi temizler)
- **Grafik içi drill-down:** Sıralı boyut seviyeleri (ör. kategori → ürün); grafiğe
  tıklayarak alt kırılıma inme ve breadcrumb ile geri dönme (istemci tarafı, yeni sorgu yok)
- **Tema & grafik paleti:** Açık/koyu tema geçişi ve erişilebilir (CVD-güvenli)
  seçilebilir grafik renk paletleri
- **Sorgu geçmişi & kayıtlı sorgular:** Çalıştırılan sorguların geçmişi + adlandırılmış
  kayıtlı sorgular (yerel olarak saklanır, yeniden yükleme)
- **Zamanlanmış rapor:** Panoyu belirli aralıklarla (15 dk – 24 s) otomatik olarak
  bir klasöre PDF kaydetme (uygulama açıkken)
- **Çoklu pano & sekmeler:** Aynı anda birden fazla panoyu sekmelerde açma ve
  aralarında geçiş yapma (üst sekme çubuğu; + ile yeni, ✕ ile kapatma)
- **Sürükle-bırak pano:** Grafik kartlarını taşıma ve yeniden boyutlandırma (react-grid-layout)
- **Dışa aktarma:** Sorgu sonuçlarını **CSV / Excel (.xlsx)**, grafikleri **PNG**,
  panoyu **PDF** olarak dışa aktarma
- **LAN'da yayınlama:** Panoyu yerel ağda `http://<ip>:<port>` adresinden anlık
  görüntü olarak yayınlama — aynı ağdaki cihazlar tarayıcıyla görür (kimlik bilgisi
  paylaşılmaz; sadece hazır sayfa sunulur)
- **Kaydetme / paylaşma:** Panoyu `.pbdash` (JSON) dosyası olarak kaydetme/açma
- **Güvenli kimlik bilgisi:** Parolalar Electron `safeStorage` (OS keychain) ile şifrelenir;
  paylaşılan pano dosyalarına parola **yazılmaz**.

## Mimari

```
src/
  main/        Electron main süreci — DB sürücüleri, IPC, dosya/kimlik bilgisi
    db/drivers/  mssql · postgres · mysql · sqlite (ortak Driver arayüzü)
    db/manager.ts  bağlantı havuzu kayıt defteri
    ipc/         connections · query · storage kanalları
    secure/      safeStorage ile şifreli kimlik bilgisi deposu
  preload/     contextBridge güvenli IPC API'si (window.api.*)
  renderer/    React arayüzü (bağlantı paneli, sorgu/grafik editörü, pano tuvali)
  shared/      main ve renderer arasında ortak tipler ve kanal adları
```

Veritabanı sürücüleri yalnızca main süreçte çalışır; renderer onlara yalnızca
IPC üzerinden erişir (`contextIsolation: true`, `nodeIntegration: false`).

## Kurulum ve Çalıştırma

```bash
npm install            # bağımlılıkları kur (Electron ikilisini de indirir)
npm run rebuild        # better-sqlite3'ü Electron ABI'sine göre yeniden derle
npm run dev            # geliştirme modunda uygulamayı başlat
```

> Not: `better-sqlite3` ve `mssql` gibi native modüller Electron ile çalışmak için
> `npm run rebuild` (electron-rebuild) gerektirir.

### Üretim paketi

```bash
npm run build          # main/preload/renderer paketlerini derle (out/)
npm run package        # electron-builder ile kurulabilir paket üret (release/)
npm run package:win    # yalnızca Windows NSIS kurulumu (.exe) — Windows'ta çalıştırın
```

### Windows kurulumu (.exe) oluşturma — GitHub Actions

Windows kurulum dosyası `.github/workflows/build.yml` iş akışıyla otomatik üretilir
(Windows'a özgü paketleme Linux/macOS'ta yapılamaz; CI `windows-latest` runner'ında
derler). İki şekilde tetiklenir:

- **Sürüm etiketi:** `v` ile başlayan bir etiket gönderin:
  ```bash
  git tag v0.2.0 && git push origin v0.2.0
  ```
  İş akışı çalışır, `PaperAnalysis-Setup-0.2.0.exe` üretir ve bir **GitHub Release**'e ekler.
- **Elle:** GitHub → **Actions → Windows Kurulumu Oluştur → Run workflow**.

Her iki durumda `.exe`, çalıştırma sayfasındaki **Artifacts → windows-installer**
altından da indirilebilir.

> Not: İkili kod imzalanmaz. İlk çalıştırmada Windows SmartScreen uyarı gösterebilir;
> “Yine de çalıştır” ile devam edilir.

### Uygulama ikonu

`build/icon.png`, bağımlılıksız üreteçle oluşturulur:

```bash
npm run make-icon      # scripts/make-icon.mjs → build/icon.png (1024×1024)
```

### Test ve tip kontrolü

```bash
npm test               # Vitest birim/entegrasyon testleri (chartSpec + SQLite veri yolu)
npm run typecheck      # main ve renderer için TypeScript tip kontrolü
```

## Hızlı Başlangıç (Örnek Veri)

Uygulama ilk açıldığında, boş pano ekranındaki **“✨ Örnek veri + pano oluştur”**
düğmesine tıklayın. Bu, harici bir sunucu gerektirmeden:

1. Yerel bir örnek SQLite veritabanı (`ornek-satis.sqlite`, ~400 satışlık veri) üretir,
2. Otomatik olarak bir bağlantı kaydeder,
3. Hazır **“Satış Genel Bakış”** panosunu (KPI'lar, kategori/bölge/trend grafikleri
   ve en çok satan ürünler tablosu) yükler.

Böylece SQL yazmadan aracın tüm yeteneklerini anında görebilirsiniz.

## Kullanım

1. Sol panelden **+ Yeni** ile bir bağlantı ekleyin (türü seçin, bilgileri girin,
   **Bağlantıyı Test Et**, ardından **Kaydet**).
2. Pano alanında **+ İlk Grafiği Ekle**'ye tıklayın.
3. Açılan editörde bir bağlantı seçin, SQL yazın ve **▶ Çalıştır**'a basın.
4. Sağ panelden grafik türü, kategori (X), ölçü (Y) ve agregasyonu seçin, önizleyin.
5. **Panoya Kaydet** ile grafiği panoya ekleyin; kartı sürükleyip boyutlandırın.
6. Üst çubuktan panoyu **Kaydet** / **Aç**; kart üzerindeki ⤓ ile grafiği PNG dışa aktarın.

### Örnek sorgu

```sql
SELECT kategori, SUM(tutar) AS toplam
FROM satislar
GROUP BY kategori
ORDER BY toplam DESC;
```

Grafik ayarlarında: Kategori = `kategori`, Ölçü = `toplam` (veya `tutar`),
Agregasyon = SUM, Tür = Sütun.

### Filtreler (pano parametreleri)

Üst çubuktan **Filtreler**'e tıklayıp bir parametre tanımlayın (ör. ad: `kategori`,
tür: metin). Ardından tile sorgularınızda `:kategori` şeklinde kullanın:

```sql
SELECT urun, SUM(tutar) AS toplam
FROM satislar
WHERE kategori = :kategori
GROUP BY urun;
```

Filtre çubuğundan değer girdiğinizde ilgili tüm grafikler otomatik yenilenir.
Değerler SQL'e **parametre bağlama** ile geçirildiğinden enjeksiyon riski yoktur.
Aynı ekrandan **otomatik yenileme** aralığı da ayarlanabilir.

### Çapraz filtreleme (cross-filter)

Bir grafiğe tıklayarak diğerlerini süzebilirsiniz. Bunun için:

1. **Filtreler**'den bir parametre tanımlayın (ör. `kategori`).
2. Süzülmesini istediğiniz grafiklerin SQL'ine koruyucu koşul ekleyin:
   ```sql
   SELECT ay, SUM(tutar) FROM satislar
   WHERE (:kategori IS NULL OR kategori = :kategori)
   GROUP BY ay;
   ```
   Bu koşul, parametre boşken tüm satırları döndürür.
3. Tıklanacak grafiğin **Ayarlar → Tıklanınca Filtrele** alanında ilgili parametreyi
   seçin.

Artık o grafikte bir kategoriye tıkladığınızda parametre ayarlanır ve `:kategori`ye
referans veren tüm grafikler süzülür. **Örnek veri panosu** bu davranışı hazır sunar:
kategori sütununa veya bölge dilimine tıklayıp deneyin; üst çubuktaki
**Tümünü Temizle** ile sıfırlayın.

### İki tabloyu birleştirme (Join Sihirbazı)

Grafik düzenleyicide bir bağlantı seçip **🔗 Birleştir** düğmesine tıklayın:

1. **Tablo A** ve **Tablo B**'yi seçin (aynı veritabanı).
2. **Eşleştirme anahtarını** belirtin (ör. `A.urun_kodu = B.urun_kodu`).
3. Birleştirme türünü seçin ve gerekiyorsa **"Yalnızca eşleşmeyenler (B boş)"**
   kutusunu işaretleyin — örneğin *stoğu olan ama ölçüsü olmayan* ürünler için
   (LEFT JOIN + `WHERE b.urun_kodu IS NULL`).
4. İsterseniz sütunları seçin ve **değer filtreleri** ekleyin (ör. `A.stok > 0`).
5. Sağdaki **üretilen SQL**'i görün → **Sorguya Ekle** → **▶ Çalıştır** →
   sonuç tablosundaki **Excel** düğmesiyle dışa aktarın.

Alternatif olarak **Alt Alta (Union)** sekmesiyle iki tablonun satırlarını
birleştirebilirsiniz. Üretilen SQL, bağlantı türüne uygundur (MSSQL `TOP`, diğerleri
`LIMIT`; tanımlayıcılar doğru tırnaklanır).

### Panoyu yerel ağda (LAN) yayınlama

Üst çubuktan **🌐 Yayınla** → bir port (varsayılan **8080**) girip **Yayınla**'ya
basın. Uygulama size `http://<bilgisayarınızın-ip'si>:8080` gibi bir adres verir;
aynı ağdaki başka bir cihazın tarayıcısında bu adresi açan herkes panoyu görür.

- **Anlık görüntü:** Yayınladığınız andaki veriyle sabit bir sayfadır. Veriyi
  güncellemek için **Yeniden Yayınla**. Durdurmak için **Durdur**.
- **Güvenlik:** Sunucu yalnızca hazır HTML sunar; veritabanı bağlantınız/kimlik
  bilgileriniz ağa açılmaz. Kimlik doğrulama yoktur — yalnızca güvendiğiniz yerel
  ağda kullanın. Windows ilk yayında güvenlik duvarı izni isteyebilir.
