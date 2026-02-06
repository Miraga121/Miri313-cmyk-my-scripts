# Qəzet Məzmun Yerləşdiricisi (ClaudeA3) — README

Qısa təsvir
-----------
"Qəzet Məzmun Yerləşdiricisi" InDesign üçün yazılmış bir ExtendScript (.jsx) skriptidir.  
Skript page2..page8 kimi qovluq strukturundan (.txt mətn faylları və uyğun şəkillər) mətn və şəkilləri götürüb InDesign səhifələrinə strukturlu şəkildə yerləşdirməyə kömək edir. Bu versiya 19.0+ (InDesign) üçün optimallaşdırılıb və Arial fontuna prioritet verir.

Əsas xüsusiyyətlər
------------------
- Bulk mətn və şəkil yerləşdirmə (page2, page3, ... qovluqlarından).
- GUI ilə parametrlərin idarəsi: sütun sayı, şəkil nisbəti, font və ölçü seçimləri.
- Sample struktur yaradıcı (page2..page8 üçün .txt və placeholder .jpg faylları).
- Təkmilləşdirilmiş səhifə təmizləmə (master elementləri qoruyur, səhvləri try/catch ilə idarə edir).
- Arial fontu prioriteti və daha etibarlı font tətbiqi.
- InDesign 19.0 və sonrakı versiyalarla uyğunluq.

Tələb olunanlar
--------------
- Adobe InDesign v19.0 və ya daha yüksək.
- Windows / macOS üzərində ExtendScript dəstəyi (Scripts panel və ya palette istifadə olunur).
- Skripti işlətmək üçün InDesign-da açıq sənəd (ən azı 8 səhifə tövsiyə olunur).

Fayl və qovluq
--------------
Tövsiyə olunan repo yol və fayl adı:
```
Scripts/qezet_content_placer_fixed_full.jsx
```

Quraşdırma (Git ilə)
---------------------
1. Repo-nu klonlayın:
   git clone https://github.com/Miri313-cmyk/my-scripts.git
2. Yeni branch yaradın (istəyə bağlı):
   git checkout -b new/claude-fix
3. Faylı `Scripts/` qovluğuna əlavə edin:
   `Scripts/qezet_content_placer_fixed_full.jsx`
4. Commit və push:
   git add Scripts/qezet_content_placer_fixed_full.jsx  
   git commit -m "Add qezet_content_placer_fixed_full.jsx (font & clear fixes)"  
   git push --set-upstream origin new/claude-fix

Quraşdırma (Manuel)
-------------------
1. InDesign-un Scripts panelini açın (Window → Utilities → Scripts).
2. `Scripts Panel` qovluğunda sağ klik → Reveal in Finder/Explorer.
3. Açılan qovluğa `Scripts/qezet_content_placer_fixed_full.jsx` faylını yapışdırın.
4. InDesign-a qayıdın, skript Scripts panelində görünməlidir.

İstifadə (tez start)
--------------------
1. InDesign-da sənədi açın (ən azı 8 səhifə tövsiyə olunur).
2. Scripts panelindən `qezet_content_placer_fixed_full.jsx`-i iki dəfə klikləyin və ya sağdan Run edin.
3. Açılan pəncərədə:
   - Ana qovluğu seçin (qovluq daxilində `page2`, `page3`, ... olmalıdır).
   - Sütun sayını, fontu (Arial prioritetlə seçiləcək) və ölçüləri seçin.
   - "Sample Yarat" düyməsi ilə nümunə qovluq yarada, "Test Et" ilə yoxlaya və "Məzmunu Yerləşdir" ilə prosesi başlada bilərsiniz.

Sample struktur nümunəsi
-----------------------
Sample yaradıcı `page2`..`page8` qovluqları və hər səhifə üçün bir neçə `.txt` və placeholder `.jpg` faylı yaradır. Bu, skriptin necə işlədiyini yerindəcə görməyə kömək edir.

Qovluq strukturunun nümunəsi:
```
root/
  page2/
    1.txt
    1-1.jpg
    2.txt
  page3/
    ...
```

Əsas parametrlər və davranış
---------------------------
- Sütun sayı (`Grid Sütun Sayı`): hüceyrələrin sayını təyin edir.
- Şəkil sahəsi nisbəti: hücrədə şəkillərə ayrılacaq nisbət.
- Font seçimləri: Dropdown-lar tətbiq olunan font adlarını doldurur; Arial varsa avtomatik prioritet seçilir.
- `Sample Yarat`: nümunə fayl və şəkillər yaradır.
- `Məzmunu Yerləşdir`: seçilmiş səhifələrdəki .txt faylları oxuyub, şəkilləri yerləşdirir və text frames yaradır.
- `clearPageContent`: səhifədəki mövcud obyektləri etibarlı şəkildə silir (master obyektlər qorunur).

Diqqət ediləsi məqamlar / Troubleshooting
----------------------------------------
- InDesign 19: bəzi ScriptUI davranışları fərqli ola bilər. Skript modeless palette istifadə edir və əvvəlki persistens pəncərəni bağlamağa çalışır. Əgər UI reaksiya vermirsə:
  - InDesign-u tam bağlayıb açın.
  - Skripti yalnız bir nüsxə ilə işlədin (eyni anda iki rundan qaçının).
- Xəta: `Object does not support the property or method 'isMasterPageItem'` və oxşar xətalar üçün skript artıq obyektləri try/catch ilə yoxlayır və skip edir. Hər hansı xüsusi obyekt tipi problem yaradırsa, log-u mənə göndərin.
- Font problemi: əgər Arial görünmürsə, `applyFontToFrame` fallback ilə ilk mövcud fontu və ya hər hansı Arial variantını tətbiq edir.
- Əgər fayl system path ilə bağlı problemlər yaradırsa (`File`/`Folder` yaratma xətası), `fsName` istifadə edərək tam path yaratdıq.

Geliştirmə / Contributing
------------------------
- Repo: `Miri313-cmyk/my-scripts`
- Branching: yeni dəyişikliklər üçün yeni branch yaradın (`new/feature-name`) və pull request göndərin.
- Kod standartı: ExtendScript (JavaScript 1.8 ətrafı), UI ScriptUI istifadə olunur.
- Problem və ya yeni xüsusiyyət istəyi üçün issue yaradın və ya PR ilə düzəliş göndərin.

Changelog (qısa)
----------------
- v3.4: Yeni processLayout və geniş səhifə təmizləmə (InDesign 19+ optimallaşdırması).
- fix (2026-02): Font handling (Arial prioritet), safe clearPageContent, persistent palette təmiri.

Lisenziya
--------
Layihə üçün lisenziya: (istifadəçinin seçiminə görə əlavə edin). Məsələn, şəffaf açıq mənbə üçün MIT əlavə etmək olar.

Əlaqə
-----
- Siz: Miri313-cmyk
- Əlavə suallarınız və ya xüsusi tələbləriniz varsa, repo Issues bölməsində yazın və ya mənə buradan bildirin.

---

Qısa not: İstəsəniz README-nin ingilis və ya başqa bir dildə versiyasını da hazırlayım, vəya README-ə daha texniki "Examples" və ya "API" hissəsi əlavə edim.
