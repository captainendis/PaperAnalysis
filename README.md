# Power BI Tarzı Veri Analiz Aracı

SQL sunucularından veri çekip grafikleştiren, sürükle-bırak panolar oluşturmanıza
olanak tanıyan **masaüstü** veri analiz aracı (Microsoft Power BI'a benzer).

Electron + React + TypeScript ile geliştirilmiştir.

## Özellikler

- **Çoklu veritabanı bağlantısı:** Microsoft SQL Server, PostgreSQL, MySQL/MariaDB, SQLite
- **Veritabanı şema gezgini:** Bağlantının tablo/sütun ağacı; tabloya tıklayınca
  otomatik `SELECT`, sütuna tıklayınca sorguya alan ekleme
- **SQL sorgu editörü:** Monaco tabanlı, söz dizimi vurgusu, `Ctrl/Cmd+Enter` ile çalıştırma
- **Sonuç tablosu:** Sorgu sonuçlarını anında tablolaştırma
- **Grafikler (Apache ECharts):** Sütun (bar), yığılmış sütun, çizgi, alan (area),
  saçılım (scatter), pasta, **KPI kartı** ve **tablo** görselleri
  - Kategori (X) / ölçü (Y) eşleme + agregasyon (SUM/AVG/COUNT/MIN/MAX)
  - **Çoklu seri** desteği (birden fazla ölçü)
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
- **Sürükle-bırak pano:** Grafik kartlarını taşıma ve yeniden boyutlandırma (react-grid-layout)
- **Dışa aktarma:** Sorgu sonuçlarını **CSV / Excel (.xlsx)**, grafikleri **PNG**,
  panoyu **PDF** olarak dışa aktarma
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
