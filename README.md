# PaperAnalysis

SQL sunucularından veri çekip grafikleştiren, sürükle-bırak panolar oluşturmanıza
olanak tanıyan **masaüstü** veri analiz aracı.

Electron + React + TypeScript ile geliştirilmiştir.

## Özellikler

- **Çoklu veritabanı bağlantısı:** Microsoft SQL Server, PostgreSQL, MySQL/MariaDB, SQLite.
  Bağlantı başına **sorgu zaman aşımı** ayarlanabilir (sn; **0 = sınırsız**, varsayılan
  300 sn) — büyük veri çekmelerinde/join'lerde “request failed to complete” zaman aşımı
  hatasını önler.
- **Veritabanı şema gezgini:** Bağlantının tablo/sütun ağacı; tabloya tıklayınca
  otomatik `SELECT` (ayarlanabilir **satır sınırı**; 0 = tüm veri), sütuna tıklayınca
  sorguya alan ekleme. Seçili tablo vurgulanır ve ağacın altında **"Seçili tablo: …"**
  göstergesiyle belirtilir
- **Görsel Birleştirme (Join) Sihirbazı:** SQL yazmadan aynı veritabanındaki iki tabloyu
  birleştirme — LEFT/INNER/RIGHT/FULL JOIN, "yalnızca eşleşmeyenler", UNION ve değer
  filtreleri (koşullar **VE/VEYA** ile birleştirilebilir — ör. “stok IS NULL **VEYA**
  stok = 0” ile hem boş hem sıfır olanları getir); üretilen sorguyu çalıştırıp **Excel**
  olarak dışa aktarma. **Ortak bir
  sütuna göre** (ör. `malzemekodu`) iki veri setinin farklı özelliklerini tek tabloda
  birleştirmek için idealdir. Varsayılan **LEFT** (A’nın tüm satırları korunur, B’nin
  özellikleri eşleşince eklenir); yalnızca iki tabloda da olan kayıtlar için **INNER**.
  En az bir eşleştirme anahtarı gerekir (yanlışlıkla kartezyen join engellenir).
  Satır sınırı **0 = Tümü** (varsayılan; sınırsız). **MSSQL**'de farklı collation'lı
  metin anahtarları için **COLLATE DATABASE_DEFAULT** otomatik uygulanır (“cannot
  resolve the collation conflict” hatasını önler; sayısal anahtarlar etkilenmez).
- **SQL sorgu editörü:** Monaco tabanlı, söz dizimi vurgusu, `Ctrl/Cmd+Enter` ile
  çalıştırma; **şema-duyarlı otomatik tamamlama** (tablo/sütun adları önerilir).
  Çalışan sorgu **⏹ Durdur** ile iptal edilebilir (MSSQL/PostgreSQL/MySQL).
- **Sonuç tablosu:** Sorgu sonuçlarını anında tablolaştırma; **sütun başlığına
  tıklayarak sıralama** ve başlıktaki **▾ menüsünden açık "A → Z" / "Z → A"**
  seçenekleri (metinde Türkçe harf sırası, sayıda sayı-duyarlı). 🔍 ile **sütun
  bazında filtreleme** (metinde “içeren”; sayısal sütunlarda **operatörle**: `>0`,
  `<100`, `>=10`, `=0`, `<>0` — ör. stokta olmayanları gizlemek için `>0`),
  **🗂 Sütunlar** ile **sütun göster/gizle**, **Σ Alt toplam** ile sayısal sütunların
  (görünen/filtrelenen satırlar üzerinden) toplamını altta gösterme, **➕ Toplam
  sütunu** ile seçili sütunları her satırda toplayan yeni bir sütun ekleme, ve tablo
  araç çubuğundan **görünümü CSV/Excel** olarak dışa aktarma (gizli sütunlar hariç,
  filtreli/sıralı, eklenen toplam sütunları dâhil). Bu ayarlar (**görünür sütunlar,
  alt toplam, toplam sütunları**) **Düzenle** panelindeki *Tablo Ayarları*'ndan
  yapılandırılıp **grafiğe gömülür** — panoda, kayıtlı dosyada ve LAN yayınında aynı
  şekilde görünür. **Grupla:** bir sütundaki **tekrarlayan (aynı) değerlere** sahip
  satırları tek satırda birleştirme (sayısal sütunlar toplanır, birleşen satır sayısını
  gösteren **Adet** sütunu eklenir). Ayrıca **sütun biçimlendirme** (sayı, **para** ₺/$/€, **yüzde**,
  **tarih**; ondalık/binlik) ve **koşullu renklendirme** (kurala uyan hücreye yazı/zemin
  rengi — ör. `stok < 10` ise kırmızı) desteklenir. **Satır sanallaştırma** sayesinde
  on binlerce satırlık sonuçlar bile ekranı dondurmadan/karartmadan akıcı gösterilir.
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
  paylaşılmaz; sadece hazır sayfa sunulur). Yayın, **panonun göründüğü düzeni**
  (kartların 12 sütunlu ızgaradaki konum/boyutları) birebir yansıtır.
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
  git tag v0.2.22 && git push origin v0.2.22
  ```
  İş akışı çalışır, `PaperAnalysis-Setup-0.2.22.exe` üretir ve bir **GitHub Release**'e ekler.
- **Elle:** GitHub → **Actions → Windows Kurulumu Oluştur → Run workflow**.

Her iki durumda `.exe`, çalıştırma sayfasındaki **Artifacts → windows-installer**
altından da indirilebilir.

> Not: İkili kod imzalanmaz. İlk çalıştırmada Windows SmartScreen uyarı gösterebilir;
> “Yine de çalıştır” ile devam edilir.

### Otomatik güncelleme (auto-update)

Uygulama açılışta ve saatlik olarak GitHub Releases'i denetler (`electron-updater`).
Yeni bir sürüm yayımlandığında **arka planda indirilir** ve “Güncelleme hazır”
uyarısında **Şimdi yeniden başlat** dediğinizde **yerinde kurulur** — eskiyi silip
yeniden kurmanıza gerek yoktur. “Sonra” derseniz güncelleme, uygulamayı bir sonraki
kapatışınızda otomatik uygulanır.

- Çalışması için Release'e `.exe` ile birlikte `latest.yml` ve `.blockmap` dosyaları
  da eklenir (CI bunu otomatik yapar); güncelleme kaynağı `electron-builder.yml`
  içindeki `publish` (GitHub) ayarıyla belirlenir.
- Otomatik güncelleme yalnızca **paketlenmiş** uygulamada çalışır (geliştirmede değil).
- Bu sürümü (veya sonrasını) bir kez kurduktan sonra, gelecek sürümler kendiliğinden
  gelir.

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
referans veren tüm grafikler süzülür; üst çubuktaki **Tümünü Temizle** ile sıfırlayın.

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
- **Otomatik yenileme:** Yayınlarken bir aralık (10 sn – 5 dk) seçerseniz pano
  veriyi periyodik tekrar çeker ve yayınlanan sayfa izleyicinin tarayıcısında
  kendiliğinden yenilenir.
- **Güvenlik:** Sunucu yalnızca hazır HTML sunar; veritabanı bağlantınız/kimlik
  bilgileriniz ağa açılmaz. Kimlik doğrulama yoktur — yalnızca güvendiğiniz yerel
  ağda kullanın. Windows ilk yayında güvenlik duvarı izni isteyebilir.
