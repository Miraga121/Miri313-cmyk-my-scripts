// #targetengine "session"

// ═══════════════════════════════════════════════════════════
//  QƏZET MƏZMUN YERLƏŞDİRİCİSİ v2.1 - InDesign 20.0 (2025) UYĞUN VERSİYA
// ═══════════════════════════════════════════════════════════

// Versiya yoxlama
if (parseFloat(app.version) < 20.0) {
    alert("⚠️ Bu skript InDesign 20.0 və ya daha yeni versiyalar üçün nəzərdə tutulub!\nHal-hazırki versiya: " + app.version);
    exit();
}

// Sənəd yoxlaması
if (!app.documents.length) {
    alert("❌ Heç bir sənəd açıq deyil!");
    exit();
}

var doc = app.activeDocument;
if (doc.pages.length < 8) {
    alert("❗ Sənəd ən azı 8 səhifəli olmalıdır!\nHal-hazırda: " + doc.pages.length + " səhifə");
    exit();
}

// Global dəyişənlər
var debugLog = [];
var totalPlaced = 0;
var totalErrors = 0;

function log(msg) {
    debugLog.push(msg);
    $.writeln(msg);
}

// Konfiqurasiya saxlama
var savedConfig = {
    lastFolder: "",
    columns: 2,
    titleFontSize: 14,
    bodyFontSize: 10,
    imageRatio: 40,
    padding: 5,
    textColumns: 1,
    textSpacing: 5
};

// ═══════════════════════════════════════════════════════════
//  GUI YARATMA
// ═══════════════════════════════════════════════════════════

var win = new Window("dialog", "Qəzet Məzmun Yerləşdiricisi v2.1", undefined, {resizeable: true});
win.orientation = "column";
win.alignChildren = ["fill", "top"];
win.spacing = 10;
win.margins = 20;

// TAB PANEL
var tabPanel = win.add("tabbedpanel");
tabPanel.alignChildren = ["fill", "fill"];
tabPanel.preferredSize = [500, 400];

// [GUI kodları eyni qalıb, yalnız versiya adı "v2.1" olaraq dəyişdirilib - aşağıda tam kod üçün kəsilə bilər]

// ═══════════════════════════════════════════════════════════
//  ƏSAS DÜYMƏLƏR
// ═══════════════════════════════════════════════════════════

var grpButtons = win.add("group");
grpButtons.orientation = "row";
grpButtons.alignment = ["fill", "bottom"];
grpButtons.spacing = 10;

var btnTest = grpButtons.add("button", undefined, "🔍 Test Et");
btnTest.preferredSize = [120, 40];

var btnRun = grpButtons.add("button", undefined, "✅ Yerləşdir");
btnRun.preferredSize = [150, 40];

var btnCancel = grpButtons.add("button", undefined, "❌ Bağla", {name: "cancel"});
btnCancel.preferredSize = [120, 40];

// Progress
var txtProgress = win.add("statictext", undefined, "Hazır...");
txtProgress.preferredSize = [480, 25];
txtProgress.graphics.font = "dialog:12";

// [Helper funksiyalar eyni qalıb - readTextFile, getNumberedFiles, findImageFiles]

// ═══════════════════════════════════════════════════════════
//  EVENT HANDLERS
// ═══════════════════════════════════════════════════════════

btnBrowse.onClick = function() {
    var folder = Folder.selectDialog("Ana qovluğu seçin (page2, page3... olan)");
    if (folder) {
        etFolder.text = folder.fsName;
        savedConfig.lastFolder = folder.fsName;
        txtProgress.text = "Qovluq seçildi: " + folder.name;
    }
};

btnTest.onClick = function() {
    debugLog = [];
    log("═══════════════════════════════");
    log("TEST BAŞLADI");
    log("═══════════════════════════════");
    
    var rootPath = etFolder.text;
    if (!rootPath || rootPath === "") {
        alert("⚠️ Zəhmət olmasa qovluq seçin!");
        return;
    }

    var rootFolder = new Folder(rootPath);
    log("Ana qovluq: " + rootFolder.fsName);
    log("Mövcuddur: " + rootFolder.exists);
    
    if (!rootFolder.exists) {
        alert("❌ Qovluq mövcud deyil!");
        return;
    }

    var subFolders = rootFolder.getFiles();
    log("\nAna qovluqdakı elementlər:");
    for (var i = 0; i < subFolders.length; i++) {
        if (subFolders[i] instanceof Folder) {
            log("  📁 " + subFolders[i].name);
        }
    }

    var totalTxt = 0;
    var totalImg = 0;
    
    for (var pageNum = 2; pageNum <= 8; pageNum++) {
        log("\n--- SƏHİFƏ " + pageNum + " ---");
        var pageFolder = new Folder(rootFolder + "/page" + pageNum);
        
        if (!pageFolder.exists) {
            log("⚠️ Qovluq yoxdur: page" + pageNum);
            continue;
        }

        var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
        var imgFiles = getNumberedFiles(pageFolder, /\.(jpe?g|png|tiff?|gif|bmp)$/i);
        
        log("📄 .txt: " + txtFiles.length);
        log("🖼️ şəkil: " + imgFiles.length);
        
        totalTxt += txtFiles.length;
        totalImg += imgFiles.length;
    }

    log("\n═══════════════════════════════");
    log("CƏMİ: " + totalTxt + " mətn, " + totalImg + " şəkil");
    log("═══════════════════════════════");
    
    alert("✅ Test tamamlandı!\n\n" + totalTxt + " mətn fayl\n" + totalImg + " şəkil fayl\n\nKonsola baxın.");
};

btnRun.onClick = function() {
    debugLog = [];
    totalPlaced = 0;
    totalErrors = 0;
    
    // Parametrləri pəncərə bağlanmadan əvvəl saxla
    var rootPath = etFolder.text;
    var cols = parseInt(ddlColumns.selection.text) || 2;
    var imgRatio = Math.round(sliderImgRatio.value) / 100;
    var padding = parseInt(ddlPadding.selection.text) || 5;
    var titleSize = parseInt(ddlTitleSize.selection.text) || 14;
    var bodySize = parseInt(ddlBodySize.selection.text) || 10;
    var titleAlign = [Justification.LEFT_ALIGN, Justification.CENTER_ALIGN, Justification.RIGHT_ALIGN][ddlTitleAlign.selection.index];
    var bodyAlign = [Justification.LEFT_ALIGN, Justification.FULLY_JUSTIFIED, Justification.CENTER_ALIGN][ddlBodyAlign.selection.index];
    var fitIndex = ddlFitOptions.selection.index;
    var fitOption = (fitIndex === 0) ? FitOptions.FILL_PROPORTIONALLY : (fitIndex === 1) ? FitOptions.CONTENT_TO_FRAME : FitOptions.FRAME_TO_CONTENT;
    var exportOption = ddlExport.selection.index;
    var clearExisting = chkClearExisting.value;
    var createLayers = chkCreateLayers.value;
    var backgroundColor = chkBackgroundColor.value;
    var imageBorder = chkImageBorder.value;
    var borderWidth = parseFloat(ddlBorderWidth.selection.text);
    var imageCaption = chkImageCaption.value;
    var titleUppercase = chkTitleUppercase.value;
    var titleBold = chkTitleBold.value;
    var leadingIndex = ddlLeading.selection.index;
    var pageSelections = chkPages.map(function(chk) { return chk.value; });
    var textColumns = parseInt(ddlTextColumns.selection.text) || 1;
    var textSpacing = parseInt(ddlTextSpacing.selection.text) || 5;

    // Pəncərəni bağla
    win.close();
    
    try {
        log("═══════════════════════════════");
        log("YERLƏŞDİRMƏ BAŞLADI (InDesign 20.0)");
        log("═══════════════════════════════");
        
        if (!rootPath || rootPath === "") {
            log("⚠️ Xəta: Qovluq seçilməyib!");
            alert("⚠️ Zəhmət olmasa qovluq seçin!");
            return;
        }

        var rootFolder = new Folder(rootPath);
        if (!rootFolder.exists) {
            log("❌ Xəta: Qovluq mövcud deyil: " + rootPath);
            alert("❌ Seçilmiş qovluq mövcud deyil!");
            return;
        }

        log("Ana qovluq: " + rootFolder.fsName);

        // Seçilmiş səhifələr
        for (var pageIndex = 1; pageIndex <= 7; pageIndex++) {
            if (!pageSelections[pageIndex - 1]) continue;
            
            var pageNum = pageIndex + 1;
            var pageFolder = new Folder(rootFolder + "/page" + pageNum);
            
            log("\n═══ SƏHİFƏ " + pageNum + " ═══");
            
            if (!pageFolder.exists) {
                log("⚠️ Qovluq yoxdur: page" + pageNum);
                continue;
            }

            var page = doc.pages[pageIndex];
            log("Səhifə yükləndi: " + page.name);

            // Mövcud çərçivələri sil (20.0-da optimallaşdırılmış silmə)
            if (clearExisting) {
                var items = page.allPageItems;
                for (var it = items.length - 1; it >= 0; it--) {
                    try { 
                        items[it].remove(); 
                        log("Element silindi: " + it);
                    } catch(e) {
                        log("Element silmə xətası: " + e);
                        totalErrors++;
                    }
                }
                log("Mövcud elementlər silindi");
            }

            // Layer yarat
            if (createLayers) {
                try {
                    var layerName = "Səhifə " + pageNum;
                    var layer = doc.layers.item(layerName);
                    if (!layer.isValid) {
                        layer = doc.layers.add({name: layerName});
                    }
                    doc.activeLayer = layer;
                    log("Layer yaradıldı: " + layerName);
                } catch(e) {
                    log("Layer xətası: " + e);
                    totalErrors++;
                }
            }

            var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
            log("📄 Fayl sayı: " + txtFiles.length);
            
            if (txtFiles.length === 0) {
                log("⚠️ Səhifədə heç bir .txt fayl yoxdur");
                continue;
            }

            var bounds = page.bounds;
            var margin = page.marginPreferences;
            
            margin.left = (margin.left > 0) ? margin.left : 12.7;
            margin.right = (margin.right > 0) ? margin.right : 12.7;
            margin.top = (margin.top > 0) ? margin.top : 12.7;
            margin.bottom = (margin.bottom > 0) ? margin.bottom : 12.7;
            
            var usableW = bounds[3] - bounds[1] - margin.left - margin.right;
            var usableH = bounds[2] - bounds[0] - margin.top - margin.bottom;
            var startX = bounds[1] + margin.left;
            var startY = bounds[0] + margin.top;

            var cellW = usableW / cols;
            var rows = Math.ceil(txtFiles.length / cols);
            var cellH = usableH / rows;

            var imgHeight = cellH * imgRatio;
            var titleHeight = titleSize + 10;
            var remainingH = cellH - imgHeight - titleHeight - padding * 3 - textSpacing;
            if (remainingH < 20) {
                imgRatio = 0.3;
                imgHeight = cellH * imgRatio;
                log("Xəbərdarlıq: Şəkil nisbəti avto-korreksiya edildi");
            }

            for (var i = 0; i < txtFiles.length; i++) {
                var row = Math.floor(i / cols);
                var col = i % cols;
                var x = startX + col * cellW;
                var y = startY + row * cellH;

                log("\n  ➤ İşlənir: " + txtFiles[i].name);
                
                var content = readTextFile(txtFiles[i]);
                if (!content) {
                    log("      ✗ Fayl boşdur və ya oxunmadı: " + txtFiles[i].name);
                    totalErrors++;
                    continue;
                }

                var lines = content.split(/\r?\n/);
                var cleanLines = [];
                for (var ln = 0; ln < lines.length; ln++) {
                    var trimmed = lines[ln].replace(/^\s+|\s+$/g, '');
                    if (trimmed !== "") {
                        cleanLines.push(lines[ln]);
                    }
                }
                
                if (cleanLines.length === 0) {
                    log("      ✗ Məzmun yoxdur: " + txtFiles[i].name);
                    totalErrors++;
                    continue;
                }
                
                var title = cleanLines[0] || "";
                var bodyLines = [];
                for (var b = 1; b < cleanLines.length; b++) {
                    bodyLines.push(cleanLines[b]);
                }
                var body = bodyLines.join("\r");

                if (titleUppercase) {
                    title = title.toUpperCase();
                }

                var groupNum = parseInt(txtFiles[i].name.match(/^\d+/)) || (i + 1);
                var imgFiles = findImageFiles(pageFolder, groupNum);
                log("      Şəkil faylları: " + imgFiles.length);

                var currentY = y;

                if (backgroundColor && i % 2 === 1) {
                    try {
                        var bgRect = page.rectangles.add();
                        bgRect.geometricBounds = [y, x, y + cellH, x + cellW];
                        var paperSwatch = doc.swatches.itemByName("Paper");
                        if (!paperSwatch.isValid) {
                            paperSwatch = doc.swatches.itemByName("C=0 M=0 Y=0 K=0");
                        }
                        bgRect.fillColor = paperSwatch;
                        bgRect.fillTint = 90;
                        bgRect.strokeWeight = 0;
                        bgRect.sendToBack();
                        log("      ✓ Arxa fon əlavə olundu");
                    } catch(e) {
                        log("      ✗ Arxa fon xətası: " + e);
                        totalErrors++;
                    }
                }

                if (imgFiles.length > 0) {
                    var imgCols = Math.min(imgFiles.length, 2);
                    var imgWidth = (cellW - padding * 2) / imgCols;
                    
                    for (var j = 0; j < imgFiles.length && j < 4; j++) {
                        var imgCol = j % imgCols;
                        var imgRow = Math.floor(j / imgCols);
                        var imgX = x + padding + (imgCol * imgWidth);
                        var imgY = currentY + padding + (imgRow * (imgHeight / 2));
                        
                        try {
                            var rect = page.rectangles.add();
                            rect.geometricBounds = [
                                imgY, 
                                imgX, 
                                imgY + (imgHeight / 2) - padding, 
                                imgX + imgWidth - padding
                            ];
                            
                            rect.place(imgFiles[j]);
                            rect.fit(fitOption);
                            
                            if (imageBorder) {
                                rect.strokeWeight = borderWidth;
                                var blackColor = doc.colors.itemByName("Black");
                                if (!blackColor.isValid) {
                                    blackColor = doc.colors.add({name: "Black", model: ColorModel.PROCESS, colorValue: [0, 0, 0, 100]});
                                }
                                rect.strokeColor = blackColor;
                            } else {
                                rect.strokeWeight = 0;
                            }
                            
                            if (imageCaption) {
                                try {
                                    var captionText = imgFiles[j].name.replace(/\.(jpe?g|png|tiff?|gif|bmp)$/i, "");
                                    var captionFrame = page.textFrames.add();
                                    captionFrame.geometricBounds = [
                                        imgY + (imgHeight / 2) - padding - 15,
                                        imgX,
                                        imgY + (imgHeight / 2) - padding,
                                        imgX + imgWidth - padding
                                    ];
                                    captionFrame.contents = captionText;
                                    captionFrame.parentStory.characters.everyItem().pointSize = 8;
                                    captionFrame.parentStory.paragraphs.everyItem().justification = Justification.CENTER_ALIGN;
                                    log("      ✓ Caption əlavə olundu: " + captionText);
                                } catch(e) {
                                    log("      ✗ Caption xətası: " + e);
                                    totalErrors++;
                                }
                            }
                            
                            log("      ✓ Şəkil yerləşdirildi: " + imgFiles[j].name);
                            totalPlaced++;
                        } catch (e) {
                            log("      ✗ Şəkil xətası: " + e.toString());
                            totalErrors++;
                        }
                    }
                    currentY += imgHeight + padding;
                }

                var titleTrimmed = title.replace(/^\s+|\s+$/g, '');
                if (titleTrimmed !== "") {
                    try {
                        var titleFrame = page.textFrames.add();
                        titleFrame.geometricBounds = [
                            currentY, 
                            x + padding, 
                            currentY + titleHeight, 
                            x + cellW - padding
                        ];
                        titleFrame.contents = title;
                        
                        titleFrame.parentStory.characters.everyItem().pointSize = titleSize;
                        titleFrame.parentStory.paragraphs.everyItem().justification = titleAlign;
                        if (titleBold) {
                            titleFrame.parentStory.fontStyle = "Bold";
                        }
                        
                        currentY += titleHeight + padding;
                        log("      ✓ Başlıq yerləşdirildi");
                        totalPlaced++;
                    } catch (e) {
                        log("      ✗ Başlıq xətası: " + e);
                        totalErrors++;
                    }
                }

                var bodyTrimmed = body.replace(/^\s+|\s+$/g, '');
                if (bodyTrimmed !== "") {
                    try {
                        var textFrame = page.textFrames.add();
                        textFrame.geometricBounds = [
                            currentY, 
                            x + padding, 
                            y + cellH - padding, 
                            x + cellW - padding
                        ];
                        textFrame.contents = body;
                        
                        // Sütunlara bölmə
                        textFrame.textFramePreferences.textColumnCount = textColumns;
                        textFrame.textFramePreferences.textColumnGutter = textSpacing / 2; // Sütunlar arası boşluq

                        textFrame.parentStory.characters.everyItem().pointSize = bodySize;
                        textFrame.parentStory.paragraphs.everyItem().justification = bodyAlign;
                        
                        if (leadingIndex > 0) {
                            var leadingMultiplier = [1, 1.1, 1.2, 1.3, 1.4, 1.5][leadingIndex];
                            textFrame.parentStory.paragraphs.everyItem().leading = bodySize * leadingMultiplier;
                        }
                        
                        textFrame.fit(FitOptions.FRAME_TO_CONTENT);
                        
                        // Mətnlər arası məsafə
                        currentY += textFrame.geometricBounds[2] - textFrame.geometricBounds[0] + textSpacing;
                        
                        log("      ✓ Mətn yerləşdirildi (" + textColumns + " sütun, " + textSpacing + " pt məsafə)");
                        totalPlaced++;
                    } catch (e) {
                        log("      ✗ Mətn xətası: " + e);
                        totalErrors++;
                    }
                }
            }
        }

        // Export
        if (exportOption === 1) {
            try {
                var pdfFile = new File(doc.filePath + "/export.pdf");
                var pdfPreset = app.pdfExportPresets.item("[High Quality Print]");
                if (!pdfPreset.isValid) {
                    pdfPreset = app.pdfExportPresets[0];  // Default
                }
                doc.exportFile(ExportFormat.PDF_TYPE, pdfFile, false, pdfPreset);
                log("\n✓ PDF export: " + pdfFile.fsName);
            } catch(e) {
                log("\n✗ PDF export xətası: " + e);
                totalErrors++;
            }
        } else if (exportOption === 2) {
            try {
                var jpgFolder = new Folder(doc.filePath + "/jpg_export");
                if (!jpgFolder.exists) jpgFolder.create();
                
                app.jpegExportPreferences.jpegQuality = JPEGOptionsQuality.HIGH;
                app.jpegExportPreferences.exportResolution = 300;
                app.jpegExportPreferences.jpegColorSpace = JpegColorSpaceEnum.RGB;
                
                for (var p = 0; p < doc.pages.length; p++) {
                    var jpgFile = new File(jpgFolder.fsName + "/page_" + (p+1) + ".jpg");
                    doc.pages[p].exportFile(ExportFormat.JPG, jpgFile);
                }
                log("\n✓ JPEG export: " + jpgFolder.fsName);
            } catch(e) {
                log("\n✗ JPEG export xətası: " + e);
                totalErrors++;
            }
        }

        log("\n═══════════════════════════════");
        log("TAMAMLANDI: " + totalPlaced + " element");
        log("XƏTALAR: " + totalErrors);
        log("═══════════════════════════════");
        
        if (totalErrors > 0) {
            alert("✅ Tamamlandı, amma xəta var!\n\n" + totalPlaced + " element yerləşdirildi\n" + totalErrors + " xəta\n\nKonsola baxın.");
        } else {
            alert("✅ Tamamlandı!\n\n" + totalPlaced + " element yerləşdirildi\n" + totalErrors + " xəta\n\nKonsola baxın.");
        }
        
    } catch (e) {
        log("❌ Ümumi xəta: " + e.toString());
        log("Sətir: " + e.line);
        alert("❌ Xəta:\n" + e.toString() + "\n\nSətir: " + e.line + "\n\nKonsola baxın.");
    }
};

// Pəncərəni göstər
win.center();
win.show();