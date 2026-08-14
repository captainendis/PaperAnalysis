# Değişiklik Günlüğü

Bu dosyanın biçimi [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) düzenini,
sürüm numaralandırması [Semantic Versioning](https://semver.org/lang/tr/) kurallarını izler.

## [Yayınlanmamış]

### Eklendi
### Değiştirildi
### Düzeltildi

## [0.3.0] - 2026-08-14

### Eklendi

- **Taşınabilir (portable) Windows sürümü:** kurulum gerektirmeyen tek dosya
  `PaperAnalysis-Portable-<sürüm>.exe`. Ayarlar, bağlantılar ve sorgu geçmişi
  exe'nin yanındaki `PaperAnalysis-Data` klasöründe tutulur; USB bellekten
  çalıştırıldığında makinede iz bırakmaz.
- **Hakkında penceresi:** marka işareti, koddan okunan sürüm, "Bir PaperAxis
  ürünüdür" aidiyeti, telif satırı, iletişim ve gizlilik politikası bağlantıları.
  Araç çubuğundaki ürün adından, alt bilgiden veya **Yardım → PaperAnalysis
  Hakkında** menüsünden açılır.
- **Uygulama menüsü** (Dosya / Düzen / Görünüm / Yardım) — Yardım altında
  güncelleme denetimi ve PaperAxis bağlantıları.
- **Alt bilgi çubuğu:** `© 2026 PaperAxis · PaperAnalysis v<sürüm>`.
- **PaperAxis grafik paleti** varsayılan palet olarak eklendi; önceki palet
  "Klasik" adıyla korunuyor.
- **Otomatik yayınlama:** her derlemede kurulum dosyası ve sürüm, PaperAxis
  indirme servisine yükleniyor (`npm run publish:pax`; CI gizlisi
  `PAX_API_TOKEN`).

### Değiştirildi

- **Marka standardı:** uygulama kimliği `com.paperaxis.paperanalysis`, paket adı
  `@paperaxis/paperanalysis-desktop`, yazar PaperAxis, lisans kapalı kaynak
  (UNLICENSED). Tüm kaynak dosyalara telif başlığı eklendi.
- **Tema:** arayüz renkleri PaperAxis kurumsal paletine (Eksen Laciverdi, Kıvılcım
  Mercanı, Kağıt, Mürekkep) taşındı; renkler tek bir token dosyasından
  (`src/renderer/src/styles/tokens.css`) geliyor. LAN yayınındaki sayfa ve
  uygulama ikonu da aynı palete göre güncellendi.
- Otomatik güncelleme, taşınabilir kopyada kurulum başlatmak yerine yalnızca
  bilgilendirme yapıyor.
- **API tokeni artık depoda tutulmuyor:** derleme sırasında `PAX_API_TOKEN`
  ortam değişkeninden gömülüyor, CI'da aynı adlı GitHub secret'ından geliyor.
  Sürüm kontrolü, güncelleme indirmesi ve yükleme aynı tokeni kullanıyor.
  Tokensiz bir derlemede sürüm yine denetleniyor, kullanıcı indirme sayfasına
  yönlendiriliyor.
- Güncelleme indirmesi, sürüm servisinin bildirdiği `downloadUrl` adresini
  kullanıyor; indirilecek dosya boyutu kullanıcıya gösteriliyor. Taşınabilir
  kopyadaki bildirim, indirme sayfasını açan bir düğme taşıyor.

## [0.2.30] - [0.2.36] - 2026-07-08 → 2026-07-17

### Eklendi
- Panoya ve grafik kartına özel tema, renk paleti ve kart stili (köşe, arka plan,
  kenarlık, gölge).
- Grafik seçenekleri: veri etiketleri, lejant konumu, Y ekseni başlığı.
- LAN yayınında etkileşimli tablolar (canlı arama + sıralama), satır limiti kaldırıldı.

### Değiştirildi
- Otomatik güncelleme PaperAxis indirme servisine taşındı.

## [0.2.5] - [0.2.29] - 2026-07-07

### Eklendi
- Sonuç tablosu: sıralama, sütun filtreleri, sayısal filtre operatörleri,
  göster/gizle, sütun sırası, alt toplam, toplam sütunu, biçimlendirme ve
  koşullu renklendirme.
- Gruplama: tekrarlayan değerleri birleştirme, koşullu (bileşik) gruplama,
  listeleyerek birleştirme, toplama dışı bırakılan sütunlar.
- Birleştirme sihirbazında VE/VEYA koşulları ve parantezli filtre grupları.
- Sorgu iptali, şema-duyarlı otomatik tamamlama, bağlantı başına sorgu zaman aşımı.
- Satır sanallaştırma ile yüksek satır sayısında akıcı tablo.

### Düzeltildi
- MSSQL birleştirmelerinde collation çakışması.
- İç içe modalda değer kutusuna yazamama (modal portal'a taşındı).

## [0.2.0] - [0.2.4] - 2026-07-06

### Eklendi
- Çoklu pano sekmeleri, görsel Birleştirme (Join) Sihirbazı, otomatik grafik
  önerisi, panoyu LAN'da yayınlama, şema gezgininde seçili tablo göstergesi.
- Windows kurulumu (NSIS) ve GitHub Actions ile otomatik derleme.

### Düzeltildi
- MSSQL'de boş sütun adları ve şema önizlemesinde söz dizimi hatası.
- Kart düğmelerinin (Yenile/Düzenle/Sil/dışa aktar) tıklanamaması.
