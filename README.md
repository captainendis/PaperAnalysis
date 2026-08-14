# PaperAnalysis

SQL sunucularından veri çekip grafikleştiren, sürükle-bırak panolar oluşturmanıza
olanak tanıyan masaüstü veri analiz aracı.

Bir **PaperAxis** ürünüdür. · [paperaxis.com](https://paperaxis.com)

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
  stok = 0” ile hem boş hem sıfır olanları getir; ayrıca **parantezli filtre grupları**
  ile ör. **(**merkez stok var **VEYA** geçici stok var**)** **VE** **(**yükseklik yok
  **VEYA** yükseklik = 0**)** gibi karma koşullar kurulabilir); üretilen sorguyu
  çalıştırıp **Excel** olarak dışa aktarma. **Ortak bir
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
  **🗂 Sütunlar** ile **sütun göster/gizle** ve **▲▼ ile sütun sırasını değiştirme**
  (soldan sağa yerleşim), **Σ Alt toplam** ile sayısal sütunların
  (görünen/filtrelenen satırlar üzerinden) toplamını altta gösterme, **➕ Toplam
  sütunu** ile seçili sütunları her satırda toplayan yeni bir sütun ekleme, ve tablo
  araç çubuğundan **görünümü CSV/Excel** olarak dışa aktarma (gizli sütunlar hariç,
  filtreli/sıralı, eklenen toplam sütunları dâhil). Bu ayarlar (**görünür sütunlar,
  alt toplam, toplam sütunları**) **Düzenle** panelindeki *Tablo Ayarları*'ndan
  yapılandırılıp **grafiğe gömülür** — panoda, kayıtlı dosyada ve LAN yayınında aynı
  şekilde görünür. **Grupla:** bir sütundaki **tekrarlayan (aynı) değerlere** sahip
  satırları tek satırda birleştirme (sayısal sütunlar (isteğe bağlı) toplanır, birleşen satır sayısını
  gösteren **Adet** sütunu eklenir). **Koşullu (bileşik) gruplama:** ek sütunlar
  seçilerek yalnızca **birden çok sütunun tümü aynı** olan satırlar birleştirilebilir
  (ör. *kodu ve birimi aynı* olan ürünler tek satırda toplanır). **Listeleyerek
  birleştirme:** seçilen sütunlar için ilk değer yerine grup içindeki **tüm farklı
  değerler** virgülle yazılır (ör. barkod → *barkod1, barkod2*). Birleştirme, sütun seçili kalsa bile
  **"Tekrarlayan değerleri birleştir"** onay kutusuyla **açılıp kapatılabilir**
  (kapalıyken satırlar ham haliyle listelenir). Toplama açıkken **belirli sayısal
  sütunlar toplama dışında bırakılabilir** (ör. birim fiyat, yükseklik gibi
  toplanması anlamsız sütunlar — ilk değeri korunur). Ayrıca **sütun biçimlendirme** (sayı, **para** ₺/$/€, **yüzde**,
  **tarih**; ondalık/binlik) ve **koşullu renklendirme** (kurala uyan hücreye yazı/zemin
  rengi — ör. `stok < 10` ise kırmızı) desteklenir. **Satır sanallaştırma** sayesinde
  on binlerce satırlık sonuçlar bile ekranı dondurmadan/karartmadan akıcı gösterilir.
- **Grafikler (Apache ECharts):** Sütun (bar), yığılmış sütun, çizgi, alan (area),
  saçılım (scatter), pasta, **KPI kartı** ve **tablo** görselleri
  - Kategori (X) / ölçü (Y) eşleme + agregasyon (SUM/AVG/COUNT/MIN/MAX)
  - **Çoklu seri** desteği (birden fazla ölçü)
  - **✨ Otomatik grafik:** Sorgu çalışınca sütun tipleri (metin/tarih/sayı) algılanıp
    makul bir grafik (X, Y, tür) otomatik önerilir ve anında önizlenir
  - **Grafik seçenekleri:** **veri etiketleri** (değerleri göster; pastada yüzde),
    **lejant konumu** (otomatik/üst/alt/gizli) ve **Y ekseni başlığı** — *Düzenle*
    panelinden ayarlanır
- **Filtreler & etkileşim:** Pano genelinde parametreler (`:ad` yer tutucuları ile,
  güvenli parametre bağlama), filtre çubuğu ve **otomatik yenileme**
- **Çapraz filtreleme (cross-filter):** Bir grafikte bir kategoriye/dilime tıklayınca
  ilgili pano parametresi ayarlanır ve diğer grafikler o değere göre süzülür
  (aynı değere tekrar tıklamak filtreyi temizler)
- **Grafik içi drill-down:** Sıralı boyut seviyeleri (ör. kategori → ürün); grafiğe
  tıklayarak alt kırılıma inme ve breadcrumb ile geri dönme (istemci tarafı, yeni sorgu yok)
- **Panoya özel tema & grafik paleti:** Her pano (sekme) **kendi temasını**
  (aydınlık/koyu) ve **kendi grafik paletini** taşıyabilir — araç çubuğundaki ☀️/🌙
  ve 🎨 seçiciler aktif panoyu değiştirir. Seçimler **pano ile birlikte kaydedilir**
  (`.pbdash`) ve **LAN yayınına** da yansır; farklı panolar farklı görünebilir.
  Varsayılan palet **PaperAxis** kurumsal grafik setidir; önceki palet "Klasik"
  adıyla korunur. Ayrıca **her grafik kartına özel tema & renk**: bir kartın
  *Düzenle* panelindeki **Görünüm** bölümünden o karta özel tema (aydınlık/koyu) ve
  palet seçilebilir; boş bırakılırsa pano (yoksa uygulama) ayarı kullanılır. Böylece
  aynı panoda kartlar ayrı ayrı kişiselleştirilebilir. Paletler erişilebilir
  (CVD-güvenli) seçeneklerdir. Ayrıca **kart stili**: her kartın **köşe yumuşaklığı**
  (sert↔yuvarlak), **arka planı** (düz renk ya da açılı **gradient**), **kenarlığı**
  (yok/düz/kesikli + renk/kalınlık) ve **gölgesi** (yok/hafif/orta/güçlü)
  *Görünüm → Kart Stili*'nden düzenlenebilir; panoda ve LAN yayınında birebir yansır
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
  (kartların 12 sütunlu ızgaradaki konum/boyutlarını) birebir yansıtır. Yayınlanan
  **tablolar etkileşimlidir**: her tabloda **canlı arama** (satırları anında süzer,
  sonuç sayacı gösterir) ve **başlığa tıklayarak sıralama** (sayı-duyarlı, Türkçe)
  vardır — tümü tarayıcıda, sunucuya sorgu atmadan çalışır. Tablonun **tüm satırları**
  sayfaya gömülür (satır sınırı yoktur), böylece arama tüm veri setinde çalışır.
- **Kaydetme / paylaşma:** Panoyu `.pbdash` (JSON) dosyası olarak kaydetme/açma
- **Güvenli kimlik bilgisi:** Parolalar Electron `safeStorage` (OS keychain) ile şifrelenir;
  paylaşılan pano dosyalarına parola **yazılmaz**.
- **Taşınabilir sürüm:** Kurulum gerektirmeyen tek dosya `.exe`; ayarlar ve
  bağlantılar exe'nin yanındaki klasörde tutulur (aşağıya bakın).

## Gereksinimler

- Windows 10/11 (kurulum veya taşınabilir sürüm) — macOS ve Linux paketleri de üretilebilir
- Geliştirme için: Node.js 20+ ve npm

## Kurulum

**Kullanıcı olarak (Windows):** iki dağıtım biçiminden birini seçin.

| Biçim | Dosya | Ne zaman |
|---|---|---|
| Kurulum | `PaperAnalysis-Setup-<sürüm>.exe` | Bilgisayara kurmak, kısayol ve otomatik güncelleme istemek |
| Taşınabilir | `PaperAnalysis-Portable-<sürüm>.exe` | Kurmadan çalıştırmak, USB bellekte taşımak, kısıtlı hesapta kullanmak |

Taşınabilir sürümde ayarlar, bağlantılar ve sorgu geçmişi exe'nin yanındaki
`PaperAnalysis-Data` klasörüne yazılır; bilgisayarın AppData dizinine dokunulmaz.
Klasörü exe ile birlikte taşıdığınızda yapılandırmanız da sizinle gelir. Salt
okunur bir medyadan çalıştırılırsa uygulama varsayılan (sistem) veri yoluna düşer.

> Not: İkili kod imzalanmaz. İlk çalıştırmada Windows SmartScreen uyarı gösterebilir;
> “Yine de çalıştır” ile devam edilir.

**Geliştirici olarak:**

```bash
npm install            # bağımlılıkları kur (Electron ikilisini de indirir)
npm run rebuild        # better-sqlite3'ü Electron ABI'sine göre yeniden derle
npm run dev            # geliştirme modunda uygulamayı başlat
```

> Not: `better-sqlite3` ve `mssql` gibi native modüller Electron ile çalışmak için
> `npm run rebuild` (electron-rebuild) gerektirir.

## Yapılandırma

| Değişken | Açıklama | Varsayılan |
|---|---|---|
| `PORTABLE_EXECUTABLE_DIR` | electron-builder'ın taşınabilir derlemede otomatik verdiği exe dizini; veri klasörü buraya açılır | (kurulu sürümde tanımsız) |
| `ELECTRON_RENDERER_URL` | Geliştirmede arayüzün yükleneceği adres (electron-vite tarafından ayarlanır) | (üretimde tanımsız) |

Veritabanı bağlantıları uygulama içinden tanımlanır; parolalar OS keychain ile
şifrelenip `connections.json` içinde saklanır.

## Geliştirme

```bash
npm run build          # main/preload/renderer paketlerini derle (out/)
npm test               # Vitest birim/entegrasyon testleri
npm run typecheck      # main ve renderer için TypeScript tip kontrolü
npm run make-icon      # scripts/make-icon.mjs → build/icon.png (1024×1024)
```

Paketleme:

```bash
npm run package          # geçerli platform için paket üret (release/)
npm run package:win      # Windows: kurulum (NSIS) + taşınabilir exe
npm run package:portable # yalnızca taşınabilir exe
```

Dal düzeni: `main` + `feature/<konu>`, birleştirme PR ile.
Kod ve commit mesajları İngilizce, dokümanlar Türkçe.

### Mimari

```
src/
  main/        Electron main süreci — DB sürücüleri, IPC, dosya/kimlik bilgisi
    db/drivers/  mssql · postgres · mysql · sqlite (ortak Driver arayüzü)
    db/manager.ts  bağlantı havuzu kayıt defteri
    ipc/         app · connections · query · storage · report · publish kanalları
    secure/      safeStorage ile şifreli kimlik bilgisi deposu
    portable.ts  taşınabilir kopyada veri yollarını exe'nin yanına alır
    menu.ts      Türkçe uygulama menüsü (Yardım → Hakkında)
  preload/     contextBridge güvenli IPC API'si (window.api.*)
  renderer/    React arayüzü (bağlantı paneli, sorgu/grafik editörü, pano tuvali)
    styles/tokens.css  PaperAxis renk tokenları — arayüzdeki her renk buradan türer
  shared/      main ve renderer arasında ortak tipler, kanal adları ve marka künyesi
```

Veritabanı sürücüleri yalnızca main süreçte çalışır; renderer onlara yalnızca
IPC üzerinden erişir (`contextIsolation: true`, `nodeIntegration: false`).

### Windows paketlerini CI ile üretme

Windows dosyaları `.github/workflows/build.yml` iş akışıyla otomatik üretilir
(Windows'a özgü paketleme Linux/macOS'ta yapılamaz; CI `windows-latest` runner'ında
derler). İki şekilde tetiklenir:

- **Sürüm etiketi:** `v` ile başlayan bir etiket gönderin:
  ```bash
  git tag v0.3.0 && git push origin v0.3.0
  ```
  İş akışı çalışır, `PaperAnalysis-Setup-0.3.0.exe` ve
  `PaperAnalysis-Portable-0.3.0.exe` üretir ve bir **GitHub Release**'e ekler.
- **Elle:** GitHub → **Actions → Windows Kurulumu Oluştur → Run workflow**.

Her iki durumda dosyalar, çalıştırma sayfasındaki **Artifacts → windows-installer**
ve **windows-portable** altından da indirilebilir.

### Otomatik güncelleme (auto-update)

Kurulu sürüm, açılışta ve saatlik olarak **PaperAxis indirme servisini** denetler:

- Sürüm bilgisi: `GET https://download.paperaxis.com/api/version/paperanalysis`
  → `{ version, fileName, … }`
- Kurulum indirme: `GET https://download.paperaxis.com/download/paperanalysis`
  → `.exe` (yönlendirmeler izlenir)

Uzak sürüm yüklü sürümden **yeni** ise (sayısal semver karşılaştırması), kullanıcıya
sorulur; onaylanırsa kurulum indirilir ve **kurulum sihirbazı başlatılır** — eskiyi
elle silmeye gerek yoktur.

- **Taşınabilir sürüm kendini güncellemez:** yeni sürüm bulunduğunda yalnızca
  bilgilendirir; kullanıcı exe'yi değiştirir, veri klasörü yerinde kalır.
- API anahtarları **derlemeye gömülüdür** (`src/main/update/paxUpdate.ts`); her sürüm
  otomatik olarak anahtarları içerir. Anahtar hem `Authorization: Bearer` hem de
  `x-api-key` başlığıyla gönderilir.
- Sürüm karşılaştırma mantığı `src/main/update/semver.ts` içinde (birim test edilir).
- Otomatik güncelleme yalnızca **paketlenmiş** uygulamada çalışır (geliştirmede değil).

## Kullanım

1. Sol panelden **+ Yeni** ile bir bağlantı ekleyin (türü seçin, bilgileri girin,
   **Bağlantıyı Test Et**, ardından **Kaydet**).
2. Pano alanında **+ İlk Grafiği Ekle**'ye tıklayın.
3. Açılan editörde bir bağlantı seçin, SQL yazın ve **▶ Çalıştır**'a basın.
4. Sağ panelden grafik türü, kategori (X), ölçü (Y) ve agregasyonu seçin, önizleyin.
5. **Panoya Kaydet** ile grafiği panoya ekleyin; kartı sürükleyip boyutlandırın.
6. Üst çubuktan panoyu **Kaydet** / **Aç**; kart üzerindeki ⤓ ile grafiği PNG dışa aktarın.

Sürüm ve künye bilgisi için araç çubuğundaki ürün adına, alt bilgideki telif
satırına ya da **Yardım → PaperAnalysis Hakkında** menüsüne tıklayın.

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
   Filtreler **gruplandırılabilir**: her grup parantez içine alınır, grup içindeki
   koşullar tek bir **VE/VEYA** ile, gruplar da aralarındaki **VE/VEYA** ile birleşir.
   Örn: **(**`A.merkezDepo IS NOT NULL` **VEYA** `A.geciciStok IS NOT NULL`**)** **VE**
   **(**`B.yukseklik IS NULL` **VEYA** `B.yukseklik = 0`**)** →
   *merkez veya geçici stoğu olan ama yüksekliği olmayan veya 0 olan* kayıtlar.
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

## Sürüm

Güncel sürüm: **0.3.0** — değişiklikler için [CHANGELOG.md](CHANGELOG.md).

## İletişim

info@paperaxis.com

## Lisans

Kapalı kaynak. © 2026 PaperAxis. Tüm hakları saklıdır. Ayrıntılar için [LICENSE](LICENSE).
