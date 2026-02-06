// QƏZET MƏZMUN YERLƏŞDİRİCİSİ v2.1-debug — Sample çıxarıldı, verbose logging əlavə olundu
// Uyğunluq: InDesign 19.x (ExtendScript)
// Müəllif: adaptasiya edilmiş (Miri313-cmyk əsasında)
// Yeniləmə: 2025-10-20

#targetengine "session"

if (!app.documents.length) {
    alert("❌ Heç bir sənəd açıq deyil!");
    exit();
}

var doc = app.activeDocument;
if (doc.pages.length < 8) {
    alert("❗ Sənəd ən azı 8 səhifəli olmalıdır!\nHal-hazırda: " + doc.pages.length + " səhifə");
    exit();
}

// Global
var debugLog = [];
var totalPlaced = 0;
var totalErrors = 0;

function log(msg) {
    debugLog.push(msg);
    try { $.writeln(msg); } catch(e) {}
}
function incPlaced(n) { totalPlaced += (n || 1); log("++ placed => " + totalPlaced); }

// Defaults
var defaults = {
    columns: 2,
    imageRatio: 40,
    padding: 5,
    titleSize: 14,
    bodySize: 10,
    overflowMode: "Avto-resize", // Heç biri | Avto-resize | Linked frames
    maxLinked: 3,
    minFontSize: 8,
    firstColExtraPercent: 0
};

// UI
var win = new Window("dialog", "Qəzet Məzmun Yerləşdiricisi — Debug (no sample)", undefined, {resizeable:true});
win.orientation = "column"; win.alignChildren = ["fill","top"]; win.margins = 12; win.spacing = 8;

var tabPanel = win.add("tabbedpanel"); tabPanel.preferredSize = [640,520];

var tab1 = tabPanel.add("tab", undefined, "Əsas");
tab1.orientation = "column"; tab1.alignChildren = ["fill","top"]; tab1.spacing = 8;

var grpFolder = tab1.add("panel", undefined, "Qovluq");
grpFolder.margins = 10;
grpFolder.add("statictext", undefined, "Ana qovluq (page2.. page8 olacaq):");
var etFolder = grpFolder.add("edittext", undefined, "");
etFolder.preferredSize = [560,28];
var btnBrowse = grpFolder.add("button", undefined, "📁 Qovluq Seç...");
btnBrowse.preferredSize.height = 26;

var grpLayout = tab1.add("panel", undefined, "Layout");
grpLayout.margins = 10;
var gCols = grpLayout.add("group");
gCols.add("statictext", undefined, "Grid sütun sayı:");
var ddlColumns = gCols.add("dropdownlist", undefined, ["1","2","3","4"]);
ddlColumns.selection = defaults.columns -1;
ddlColumns.preferredSize = [80,22];

var gFirst = grpLayout.add("group");
gFirst.add("statictext", undefined, "İlk sütun əlavə genişlik (%):");
var etFirstCol = gFirst.add("edittext", undefined, defaults.firstColExtraPercent.toString());
etFirstCol.preferredSize = [60,22];
var chkEnableFirst = gFirst.add("checkbox", undefined, "Aktiv et"); chkEnableFirst.value = false;

var gImg = grpLayout.add("group");
gImg.add("statictext", undefined, "Şəkil sahəsi (% hüceyrə hündürlüyü):");
var sliderImg = gImg.add("slider", undefined, defaults.imageRatio, 20, 60);
sliderImg.preferredSize = [300,22];
var txtImg = gImg.add("statictext", undefined, defaults.imageRatio + "%");
txtImg.preferredSize = [40,22];
sliderImg.onChanging = function(){ txtImg.text = Math.round(this.value) + "%"; };

var gPad = grpLayout.add("group");
gPad.add("statictext", undefined, "Padding (pt):");
var ddlPadding = gPad.add("dropdownlist", undefined, ["0","3","5","8","10"]);
ddlPadding.selection = 2;
ddlPadding.preferredSize = [80,22];

// Pages selection
var grpPages = tab1.add("panel", undefined, "Səhifələr (page2..page8)");
grpPages.margins = 10;
var chkPages = [];
var rowPages = grpPages.add("group");
for (var p=2;p<=8;p++){ var c = rowPages.add("checkbox", undefined, "S."+p); c.value = true; chkPages.push(c); }
var pageBtns = grpPages.add("group");
var btnAll = pageBtns.add("button", undefined, "Hamısını seç"); var btnNone = pageBtns.add("button", undefined, "Hamısını götür");
btnAll.onClick = function(){ for(var i=0;i<chkPages.length;i++) chkPages[i].value = true; };
btnNone.onClick = function(){ for(var i=0;i<chkPages.length;i++) chkPages[i].value = false; };

// Typography tab
var tab2 = tabPanel.add("tab", undefined, "Tipoqrafiya");
tab2.orientation = "column"; tab2.alignChildren = ["fill","top"]; tab2.spacing = 8;
var grpTitle = tab2.add("panel", undefined, "Başlıq"); grpTitle.margins = 10;
var rt = grpTitle.add("group"); rt.add("statictext", undefined, "Font ölçüsü:"); var ddlTitleSize = rt.add("dropdownlist", undefined, ["12","14","16","18","20","24"]); ddlTitleSize.selection = 1; ddlTitleSize.preferredSize=[80,22];
rt.add("statictext", undefined, "Hizalama:"); var ddlTitleAlign = rt.add("dropdownlist", undefined, ["Sol","Mərkəz","Sağ"]); ddlTitleAlign.selection=0; ddlTitleAlign.preferredSize=[100,22];
var chkTitleUpper = grpTitle.add("checkbox", undefined, "Böyük hərflərlə"); var chkTitleBold = grpTitle.add("checkbox", undefined, "Qalın"); chkTitleBold.value = true;
var grpBody = tab2.add("panel", undefined, "Mətn"); grpBody.margins = 10;
var rb = grpBody.add("group"); rb.add("statictext", undefined, "Font ölçüsü:"); var ddlBodySize = rb.add("dropdownlist", undefined, ["8","9","10","11","12","14"]); ddlBodySize.selection=2; ddlBodySize.preferredSize=[80,22];
rb.add("statictext", undefined, "Hizalama:"); var ddlBodyAlign = rb.add("dropdownlist", undefined, ["Sol","İki tərəfə","Mərkəz"]); ddlBodyAlign.selection=1; ddlBodyAlign.preferredSize=[120,22];
var rlead = grpBody.add("group"); rlead.add("statictext", undefined, "Sətir aralığı:"); var ddlLeading = rlead.add("dropdownlist", undefined, ["Auto","110%","120%","130%","140%","150%"]); ddlLeading.selection=0; ddlLeading.preferredSize=[120,22];

// Images tab
var tab3 = tabPanel.add("tab", undefined, "Şəkillər");
tab3.orientation = "column"; tab3.alignChildren = ["fill","top"]; tab3.spacing = 8;
var gi = tab3.add("panel", undefined, "Şəkil");
gi.margins = 10;
var gf = gi.add("group"); gf.add("statictext", undefined, "Yerləşdirmə:"); var ddlFitOptions = gf.add("dropdownlist", undefined, ["Proporsional doldur","Çərçivəyə sığdır","Məzmunu sığdır"]); ddlFitOptions.selection=0; ddlFitOptions.preferredSize=[180,22];
var chkImgBorder = gi.add("checkbox", undefined, "Şəkil sərhədi"); chkImgBorder.value = true;
var gbw = gi.add("group"); gbw.add("statictext", undefined, "Sərhəd (pt):"); var ddlBW = gbw.add("dropdownlist", undefined, ["0.5","1","2","3"]); ddlBW.selection=1; ddlBW.preferredSize=[80,22];
var chkCaption = gi.add("checkbox", undefined, "Caption əlavə et");

// Extra tab (overflow etc.)
var tab4 = tabPanel.add("tab", undefined, "Əlavə");
tab4.orientation = "column"; tab4.alignChildren = ["fill","top"]; tab4.spacing = 8;
var gextra = tab4.add("panel", undefined, "Seçimlər"); gextra.margins=10;
var chkClear = gextra.add("checkbox", undefined, "Mövcud elementləri sil"); chkClear.value = true;
var chkLayers = gextra.add("checkbox", undefined, "Layer yarat"); var chkBg = gextra.add("checkbox", undefined, "Alternativ arxa fon");
gextra.add("statictext", undefined, "────────────────────────");
var go = gextra.add("group"); go.add("statictext", undefined, "Overflow rejimi:"); var ddlOverflow = go.add("dropdownlist", undefined, ["Heç biri","Avto-resize","Linked frames"]); ddlOverflow.selection=1; ddlOverflow.preferredSize=[140,22];
go.add("statictext", undefined, "Max linked:"); var etMaxLinked = go.add("edittext", undefined, "3"); etMaxLinked.preferredSize=[40,22];
go.add("statictext", undefined, "Min font:"); var etMinFont = go.add("edittext", undefined, "8"); etMinFont.preferredSize=[40,22];
var chkVerbose = gextra.add("checkbox", undefined, "Verbose log (konsola yaz)"); chkVerbose.value = true;

// Bottom
var btm = win.add("group"); btm.alignment = "right";
var btnTest = btm.add("button", undefined, "🔍 Test Et"); btnTest.preferredSize=[120,36];
var btnRun = btm.add("button", undefined, "✅ Yerləşdir"); btnRun.preferredSize=[160,36];
var btnClose = btm.add("button", undefined, "❌ Bağla", {name:"cancel"}); btnClose.preferredSize=[100,36];
var txtProgress = win.add("statictext", undefined, "Hazır..."); txtProgress.preferredSize=[600,22];


// Helpers
function safeSwatchByName(docRef, name) {
    try { var s = docRef.swatches.itemByName(name); if (s && s.isValid) return s; } catch(e){} return null;
}
function readTextFile(file) {
    if (!file || !file.exists) return "";
    try {
        file.encoding = "UTF-8";
        if (!file.open("r")) return "";
        var content = file.read();
        file.close();
        if (content && content.length>0 && content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
        return content;
    } catch(e) { log("readTextFile error: " + e); return ""; }
}
function getNumberedFiles(folder, filterRegex) {
    if (!folder || !folder.exists) return [];
    var all = folder.getFiles();
    if (!all) return [];
    var out = [];
    for (var i=0;i<all.length;i++){ try { if (all[i] instanceof File && filterRegex.test(all[i].name)) out.push(all[i]); } catch(e){} }
    out.sort(function(a,b){ var na = parseInt(a.name.match(/^\d+/)) || 0; var nb = parseInt(b.name.match(/^\d+/)) || 0; return na-nb; });
    return out;
}
function findImageFiles(folder, groupNum) {
    if (!folder || !folder.exists) return [];
    var pattern = new RegExp("^" + groupNum + "[-_]?(\\d+)\\.(jpe?g|png|tiff?|gif|bmp)$","i");
    var all = folder.getFiles(); if (!all) return [];
    var res = [];
    for (var i=0;i<all.length;i++){ try { if (all[i] instanceof File && pattern.test(all[i].name)) res.push(all[i]); } catch(e){} }
    res.sort(function(a,b){ var ma = a.name.match(/[-_](\d+)\./); var mb = b.name.match(/[-_](\d+)\./); var na = ma?parseInt(ma[1]):0; var nb = mb?parseInt(mb[1]):0; return na-nb; });
    return res;
}

// Events
btnBrowse.onClick = function() {
    var f = Folder.selectDialog("Ana qovluğu seçin (page2..page8)");
    if (f) etFolder.text = f.fsName;
};

btnTest.onClick = function() {
    debugLog = [];
    log("=== TEST START ===");
    var root = new Folder(etFolder.text);
    if (!root || !root.exists) { alert("Qovluq yoxdur"); return; }
    var totalTxt = 0, totalImg = 0;
    for (var p=2;p<=8;p++){
        var fld = new Folder(root + "/page" + p);
        if (!fld.exists) { log("page" + p + " qovluq yoxdur"); continue; }
        var t = getNumberedFiles(fld, /\.txt$/i).length;
        var im = getNumberedFiles(fld, /\.(jpe?g|png|tiff?|gif|bmp)$/i).length;
        log("page" + p + ": txt=" + t + ", img=" + im);
        totalTxt += t; totalImg += im;
    }
    log("=== TEST END ===");
    alert("Test tamamlandı\n" + totalTxt + " mətn\n" + totalImg + " şəkil\nKonsola baxın.");
};

btnRun.onClick = function() {
    debugLog = []; totalPlaced = 0; totalErrors = 0;
    try {
        log("=== RUN START ===");
        var root = new Folder(etFolder.text);
        if (!root || !root.exists) { alert("Ana qovluq seçin"); return; }

        var cols = parseInt(ddlColumns.selection.text) || 2;
        var imgRatio = Math.round(sliderImg.value)/100;
        var padding = parseFloat(ddlPadding.selection.text) || defaults.padding;
        var titleSize = parseInt(ddlTitleSize.selection.text) || defaults.titleSize;
        var bodySize = parseInt(ddlBodySize.selection.text) || defaults.bodySize;
        var titleAlign = [Justification.LEFT_ALIGN, Justification.CENTER_ALIGN, Justification.RIGHT_ALIGN][ddlTitleAlign.selection.index];
        var bodyAlign = [Justification.LEFT_ALIGN, Justification.FULLY_JUSTIFIED, Justification.CENTER_ALIGN][ddlBodyAlign.selection.index];
        var fitOption = [FitOptions.FILL_PROPORTIONALLY, FitOptions.CONTENT_TO_FRAME, FitOptions.FRAME_TO_CONTENT][ddlFitOptions.selection.index];

        var overflowMode = ddlOverflow.selection.text;
        var maxLinked = parseInt(etMaxLinked.text) || defaults.maxLinked;
        var minFont = parseFloat(etMinFont.text) || defaults.minFontSize;
        var firstEnabled = chkEnableFirst.value;
        var firstPercent = parseFloat(etFirstCol.text) || 0;

        for (var pageIndex=1; pageIndex<=7; pageIndex++){
            if (!chkPages[pageIndex-1].value) continue;
            var pageNum = pageIndex + 1;
            var folder = new Folder(root + "/page" + pageNum);
            log("\n-- Page " + pageNum + " --");
            if (!folder.exists) { log("folder missing: " + folder.fsName); continue; }
            var page = doc.pages[pageIndex];

            if (chkClear.value) {
                try {
                    var items = page.allPageItems;
                    if (items && items.length) {
                        for (var it = items.length -1; it >= 0; it--) {
                            try { items[it].remove(); } catch(e){ log("remove err: " + e); }
                        }
                    }
                    log("Existing items cleared");
                } catch(e){ log("clear error: " + e); }
            }

            if (chkLayers.value) {
                try {
                    var lname = "Page " + pageNum;
                    var layer = doc.layers.itemByName(lname);
                    if (!layer || !layer.isValid) layer = doc.layers.add({name: lname});
                    doc.activeLayer = layer;
                    log("Layer active: " + lname);
                } catch(e){ log("layer error: " + e); }
            }

            var txtFiles = getNumberedFiles(folder, /\.txt$/i);
            if (!txtFiles || txtFiles.length === 0) { log("no txt files"); continue; }
            log("txt count: " + txtFiles.length);

            var bounds = page.bounds;
            var margin = page.marginPreferences || {top:12.7,left:12.7,bottom:12.7,right:12.7};
            var usableW = (bounds[3] - bounds[1]) - margin.left - margin.right;
            var usableH = (bounds[2] - bounds[0]) - margin.top - margin.bottom;
            var startX = bounds[1] + margin.left;
            var startY = bounds[0] + margin.top;

            var colWidths = [];
            if (firstEnabled && firstPercent > 0 && cols >1) {
                var ratioFirst = 1 + (firstPercent/100);
                var totalRatio = ratioFirst + (cols -1) * 1;
                colWidths.push(usableW * (ratioFirst / totalRatio));
                for (var cc=2; cc<=cols; cc++) colWidths.push(usableW * (1 / totalRatio));
            } else {
                for (var cc=0; cc<cols; cc++) colWidths.push(usableW / cols);
            }

            var rows = Math.ceil(txtFiles.length / cols);
            var cellH = usableH / rows;

            txtProgress.text = "Page " + pageNum + " ...";
            win.update();

            for (var i=0;i<txtFiles.length;i++){
                var row = Math.floor(i/cols);
                var col = i % cols;
                var cellW = colWidths[col];
                var x = startX;
                for (var k=0;k<col;k++) x += colWidths[k];
                var y = startY + row * cellH;

                log("Processing file: " + txtFiles[i].name);
                var content = readTextFile(txtFiles[i]);
                if (!content) { log("empty content"); continue; }
                var lines = content.split(/\r?\n/);
                var clean = [];
                for (var ln=0;ln<lines.length;ln++){ var t = lines[ln].replace(/^\s+|\s+$/g,''); if (t !== "") clean.push(t); }
                if (clean.length === 0) { log("no clean lines"); continue; }

                var title = clean[0] || "";
                var bodyLines = [];
                for (var b=1;b<clean.length;b++) bodyLines.push(clean[b]);
                var body = bodyLines.join("\r");
                if (chkTitleUpper.value) title = title.toUpperCase();

                var groupNum = parseInt(txtFiles[i].name.match(/^\d+/)) || (i+1);
                var imgFiles = findImageFiles(folder, groupNum);

                var currentY = y;

                // background
                if (chkBg.value && (i % 2 === 1)) {
                    try {
                        var bg = page.rectangles.add();
                        bg.geometricBounds = [y, x, y + cellH, x + cellW];
                        var paper = safeSwatchByName(doc, "Paper");
                        if (paper) { bg.fillColor = paper; bg.fillTint = 8; }
                        bg.strokeWeight = 0;
                        bg.sendToBack();
                    } catch(e) { log("bg error: " + e); }
                }

                // Images
                if (imgFiles && imgFiles.length > 0) {
                    var imgHeight = cellH * imgRatio;
                    var imgCols = Math.min(imgFiles.length, 2);
                    var imgWidth = (cellW - padding*2) / imgCols;
                    for (var j=0;j<imgFiles.length && j<4;j++){
                        var imgCol = j % imgCols;
                        var imgRow = Math.floor(j / imgCols);
                        var imgX = x + padding + (imgCol * imgWidth);
                        var imgY = currentY + padding + (imgRow * (imgHeight/2));
                        try {
                            var rect = page.rectangles.add();
                            rect.geometricBounds = [ imgY, imgX, imgY + (imgHeight/2) - padding, imgX + imgWidth - padding ];
                            rect.place(imgFiles[j]);
                            try { rect.fit([FitOptions.FILL_PROPORTIONALLY, FitOptions.CONTENT_TO_FRAME, FitOptions.FRAME_TO_CONTENT][ddlFitOptions.selection.index]); } catch(e){}
                            if (chkImgBorder.value) { rect.strokeWeight = parseFloat(ddlBW.selection.text); try{ rect.strokeColor = safeSwatchByName(doc,"Black") || doc.swatches.itemByName("Black"); } catch(e){} } else rect.strokeWeight = 0;
                            if (chkCaption.value) {
                                try {
                                    var cap = page.textFrames.add();
                                    cap.geometricBounds = [ imgY + (imgHeight/2) - padding - 15, imgX, imgY + (imgHeight/2) - padding, imgX + imgWidth - padding ];
                                    cap.contents = imgFiles[j].name.replace(/\.(jpe?g|png|tiff?|gif|bmp)$/i,'');
                                    cap.parentStory.characters.everyItem().pointSize = Math.max(7, bodySize - 2);
                                    cap.parentStory.paragraphs.everyItem().justification = Justification.CENTER_ALIGN;
                                } catch(e){ log("caption err: " + e); }
                            }
                            log("Placed image: " + imgFiles[j].name);
                            incPlaced(1);
                        } catch(e){ log("image place err: " + e); totalErrors++; }
                    }
                    currentY += imgHeight + padding;
                }

                // Title
                if ((title || "").replace(/^\s+|\s+$/g,'') !== "") {
                    try {
                        var tH = titleSize + 8;
                        var tFrame = page.textFrames.add();
                        tFrame.geometricBounds = [ currentY, x + padding, currentY + tH, x + cellW - padding ];
                        tFrame.contents = title;
                        try { if (chkTitleBold.value) { var bf = app.fonts.itemByName("Arial\tBold"); if (bf && bf.isValid) tFrame.parentStory.characters.everyItem().appliedFont = bf; } } catch(e){}
                        tFrame.parentStory.characters.everyItem().pointSize = titleSize;
                        try { tFrame.parentStory.paragraphs.everyItem().justification = [Justification.LEFT_ALIGN, Justification.CENTER_ALIGN, Justification.RIGHT_ALIGN][ddlTitleAlign.selection.index]; } catch(e){}
                        log("Placed title: " + title);
                        incPlaced(1);
                        currentY += tH + padding;
                    } catch(e){ log("title err: " + e); totalErrors++; }
                }

                // Body w/ overflow
                if ((body || "").replace(/^\s+|\s+$/g,'') !== "") {
                    try {
                        var bottom = y + cellH - padding;
                        var availTop = currentY;
                        var availH = bottom - availTop;
                        if (availH <= 6) { log("not enough vertical space for body"); }
                        else {
                            var tf = page.textFrames.add();
                            tf.geometricBounds = [ availTop, x + padding, bottom, x + cellW - padding ];
                            tf.contents = body;
                            try { tf.parentStory.characters.everyItem().pointSize = bodySize; } catch(e){}
                            try { tf.parentStory.paragraphs.everyItem().justification = bodyAlign; } catch(e){}
                            if (ddlLeading.selection.index > 0) {
                                var mult = [1,1.1,1.2,1.3,1.4,1.5][ddlLeading.selection.index];
                                try { tf.parentStory.paragraphs.everyItem().leading = bodySize * mult; } catch(e){}
                            }

                            if (overflowMode === "Avto-resize") {
                                if (tf.overflows) {
                                    var curSize = bodySize;
                                    while (tf.overflows && curSize > minFont) {
                                        curSize = Math.max(minFont, curSize - 0.5);
                                        try { tf.parentStory.characters.everyItem().pointSize = curSize; } catch(e){}
                                    }
                                    if (tf.overflows) log("Overflow persists after min font: " + minFont);
                                    else log("Auto-resize successful, final font: " + curSize);
                                }
                            } else if (overflowMode === "Linked frames") {
                                if (tf.overflows) {
                                    var prev = tf;
                                    var linked = 0;
                                    // shrink first frame to 60% to give room
                                    try { prev.geometricBounds = [ availTop, x + padding, availTop + Math.max(20, availH * 0.6), x + cellW - padding ]; } catch(e){}
                                    var nextTop = availTop + Math.max(20, availH * 0.6) + padding;
                                    var remaining = bottom - nextTop;
                                    while (prev.overflows && linked < maxLinked && remaining > 10) {
                                        var h = Math.max(20, Math.min(Math.ceil(remaining / (maxLinked - linked)), remaining));
                                        var nf = page.textFrames.add();
                                        nf.geometricBounds = [ nextTop, x + padding, nextTop + h, x + cellW - padding ];
                                        try { prev.nextTextFrame = nf; } catch(e){}
                                        try { nf.parentStory.characters.everyItem().pointSize = bodySize; } catch(e){}
                                        try { nf.parentStory.paragraphs.everyItem().justification = bodyAlign; } catch(e){}
                                        linked++;
                                        nextTop += h + padding;
                                        remaining = bottom - nextTop;
                                        prev = nf;
                                    }
                                    if (tf.overflows) log("Overflow persists after linked frames (max " + maxLinked + ")");
                                    else log("Linked frames ok, added: " + linked);
                                }
                            } else {
                                if (tf.overflows) log("Overflow present (no handling selected)");
                            }
                            log("Placed body");
                            incPlaced(1);
                        }
                    } catch(e){ log("body err: " + e); totalErrors++; }
                }
            } // end files loop
        } // end pages

        log("=== RUN END === placed=" + totalPlaced + " errors=" + totalErrors);
        txtProgress.text = "✅ placed: " + totalPlaced + " errors: " + totalErrors;

        // If verbose, show first part of debug log
        if (chkVerbose.value) {
            // debugLog əvvəldən yaradılmışdır
            var out = (debugLog && debugLog.length) ? debugLog.join("\n") : "";
            var preview = out.length > 2000 ? out.substring(0, 2000) + "\n\n... (truncated)" : out;
            alert("Debug log (ilk 2000 simvol):\n\n" + preview);
            
        } else {
            alert("Tamamlandı: " + totalPlaced + " placed, " + totalErrors + " errors. Konsola baxın.");
        }
    } catch (e) {
        log("Fatal error: " + e);
        try { log("Line: " + (e.line ? e.line : "unknown")); } catch(err){}
        alert("Xəta: " + e + "\nKonsola baxın.");
    }
};

win.center();
win.show();