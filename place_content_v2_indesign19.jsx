// QƏZET MƏZMUN YERLƏŞDİRİCİSİ v2.1 — Overflow, first-column genişliyi, export ləğv edildi
// Uyğunluq: InDesign 19.x (ExtendScript)
// Yeniləmə: 2025-10-20
// Dəyişikliklər:
// - Overflow rejimləri əlavə olundu: "Heç biri", "Avto-resize", "Linked frames"
// - Min font size və max linked frames UI əlavə edildi
// - İlk sütunu genişləndirmək üçün seçim əlavə edildi (faizlə)
// - Export hissəsi tamamilə çıxarıldı (istək üzrə ləğv edildi)
// - Daha etibarlı nil-check və fallback-lar
// - Səhifələri təmizləmək seçimləri və layer yaradılması saxlanıldı

#targetengine "session"

if (!app.documents.length) {
    alert("❌ Heç bir sənəd açıq deyil!");
    exit();
}

var doc = app.activeDocument;
if (doc.pages.length < 8) {
    alert("❗ Heç olmasa 8 səhifə olmalıdır — hal-hazırda: " + doc.pages.length);
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

// SIMPLE CONFIG DEFAULTS
var defaults = {
    columns: 2,
    imageRatio: 40,
    padding: 5,
    titleSize: 14,
    bodySize: 10,
    overflowMode: "Avto-resize", // "Heç biri" | "Avto-resize" | "Linked frames"
    maxLinked: 3,
    minFontSize: 8,
    firstColExtraPercent: 0 // 0 means no extra
};

// UI
var win = new Window("dialog", "Qəzet Məzmun Yerləşdiricisi v2.1", undefined, {resizeable:true});
win.orientation = "column";
win.alignChildren = ["fill","top"];
win.margins = 12;
win.spacing = 8;

var tabPanel = win.add("tabbedpanel");
tabPanel.preferredSize = [620,520];
tabPanel.alignChildren = ["fill","fill"];

// TAB: Əsas
var tab1 = tabPanel.add("tab", undefined, "Əsas");
tab1.orientation = "column"; tab1.alignChildren = ["fill","top"]; tab1.spacing = 8;

var grpFolder = tab1.add("panel", undefined, "Qovluq Seçimi");
grpFolder.margins = 10;
grpFolder.add("statictext", undefined, "Ana qovluq (page2/, page3/, ...):");
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

var gFirstCol = grpLayout.add("group");
gFirstCol.add("statictext", undefined, "İlk sütun əlavə genişlik (%):");
var etFirstCol = gFirstCol.add("edittext", undefined, defaults.firstColExtraPercent.toString());
etFirstCol.preferredSize = [60,22];
var chkEnableFirstCol = gFirstCol.add("checkbox", undefined, "Aktiv et");
chkEnableFirstCol.value = false;

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

// page selection
var grpPages = tab1.add("panel", undefined, "Səhifələr (page2..page8)");
grpPages.margins = 10;
var chkPages = [];
var row1 = grpPages.add("group");
row1.orientation = "row";
for (var p=2;p<=8;p++){
    var c = row1.add("checkbox", undefined, "S." + p);
    c.value = true;
    chkPages.push(c);
}
var rowBtns = grpPages.add("group");
var btnAll = rowBtns.add("button", undefined, "Hamısını seç"); btnAll.onClick = function(){ for(var i=0;i<chkPages.length;i++) chkPages[i].value = true; };
var btnNone = rowBtns.add("button", undefined, "Hamısını götür"); btnNone.onClick = function(){ for(var i=0;i<chkPages.length;i++) chkPages[i].value = false; };

// TAB: Tipoqrafiya
var tab2 = tabPanel.add("tab", undefined, "Tipoqrafiya");
tab2.orientation = "column"; tab2.alignChildren = ["fill","top"]; tab2.spacing = 8;

var grpTitle = tab2.add("panel", undefined, "Başlıq");
grpTitle.margins = 10;
var rowTitle = grpTitle.add("group");
rowTitle.add("statictext", undefined, "Font ölçüsü:");
var ddlTitleSize = rowTitle.add("dropdownlist", undefined, ["12","14","16","18","20","24"]);
ddlTitleSize.selection = 1;
ddlTitleSize.preferredSize = [80,22];
rowTitle.add("statictext", undefined, "Hizalama:");
var ddlTitleAlign = rowTitle.add("dropdownlist", undefined, ["Sol","Mərkəz","Sağ"]);
ddlTitleAlign.selection = 0;
ddlTitleAlign.preferredSize = [100,22];
var chkTitleUpper = grpTitle.add("checkbox", undefined, "Böyük hərflərlə");
var chkTitleBold = grpTitle.add("checkbox", undefined, "Qalın (Bold)");
chkTitleBold.value = true;

var grpBody = tab2.add("panel", undefined, "Mətn");
grpBody.margins = 10;
var rowBody = grpBody.add("group");
rowBody.add("statictext", undefined, "Font ölçüsü:");
var ddlBodySize = rowBody.add("dropdownlist", undefined, ["8","9","10","11","12","14"]);
ddlBodySize.selection = 2;
ddlBodySize.preferredSize = [80,22];
rowBody.add("statictext", undefined, "Hizalama:");
var ddlBodyAlign = rowBody.add("dropdownlist", undefined, ["Sol","İki tərəfə","Mərkəz"]);
ddlBodyAlign.selection = 1;
ddlBodyAlign.preferredSize = [120,22];
var rowLead = grpBody.add("group");
rowLead.add("statictext", undefined, "Sətir aralığı:");
var ddlLeading = rowLead.add("dropdownlist", undefined, ["Auto","110%","120%","130%","140%","150%"]);
ddlLeading.selection = 0;
ddlLeading.preferredSize = [120,22];

// TAB: ŞƏKİLLƏR
var tab3 = tabPanel.add("tab", undefined, "Şəkillər");
tab3.orientation = "column"; tab3.alignChildren = ["fill","top"]; tab3.spacing = 8;
var grpImgSet = tab3.add("panel", undefined, "Parametrlər");
grpImgSet.margins = 10;
var rowFit = grpImgSet.add("group");
rowFit.add("statictext", undefined, "Yerləşdirmə:");
var ddlFit = rowFit.add("dropdownlist", undefined, ["Proporsional doldur","Çərçivəyə sığdır","Məzmunu sığdır"]);
ddlFit.selection = 0;
ddlFit.preferredSize = [180,22];
var chkImgBorder = grpImgSet.add("checkbox", undefined, "Şəkil sərhədi"); chkImgBorder.value = true;
var rowBW = grpImgSet.add("group");
rowBW.add("statictext", undefined, "Sərhəd qalınlığı (pt):");
var ddlBW = rowBW.add("dropdownlist", undefined, ["0.5","1","2","3"]); ddlBW.selection = 1; ddlBW.preferredSize = [80,22];
var chkCaption = grpImgSet.add("checkbox", undefined, "Caption əlavə et");

// TAB: ƏLAVƏ (overflow / cleanup)
var tab4 = tabPanel.add("tab", undefined, "Əlavə");
tab4.orientation = "column"; tab4.alignChildren = ["fill","top"]; tab4.spacing = 8;
var grpExtra = tab4.add("panel", undefined, "Seçimlər");
grpExtra.margins = 10;
var chkClear = grpExtra.add("checkbox", undefined, "Mövcud elementləri sil"); chkClear.value = true;
var chkLayers = grpExtra.add("checkbox", undefined, "Hər səhifə üçün layer yarat");
var chkBg = grpExtra.add("checkbox", undefined, "Alternativ arxa fon");

grpExtra.add("statictext", undefined, "────────────────────────");

var gOverflow = grpExtra.add("group");
gOverflow.orientation = "row";
gOverflow.add("statictext", undefined, "Overflow rejimi:");
var ddlOverflow = gOverflow.add("dropdownlist", undefined, ["Heç biri","Avto-resize","Linked frames"]);
if (defaults.overflowMode === "Avto-resize") ddlOverflow.selection = 1;
else ddlOverflow.selection = 1;
ddlOverflow.preferredSize = [140,22];

gOverflow.add("statictext", undefined, "Max linked:");
var etMaxLinked = gOverflow.add("edittext", undefined, defaults.maxLinked.toString());
etMaxLinked.preferredSize = [40,22];
gOverflow.add("statictext", undefined, "Min font (pt):");
var etMinFont = gOverflow.add("edittext", undefined, defaults.minFontSize.toString());
etMinFont.preferredSize = [40,22];

// Bottom buttons
var btnGroup = win.add("group");
btnGroup.alignment = "right";
var btnTest = btnGroup.add("button", undefined, "🔍 Test Et"); btnTest.preferredSize = [110,36];
var btnRun = btnGroup.add("button", undefined, "✅ Yerləşdir"); btnRun.preferredSize = [140,36];
var btnClose = btnGroup.add("button", undefined, "❌ Bağla", {name:"cancel"}); btnClose.preferredSize = [100,36];

var txtProgress = win.add("statictext", undefined, "Hazır...");
txtProgress.preferredSize = [600,22];

// Helper functions (font apply etc.)
function safeCharCodeAtZero(s){ return (s && s.length>0)? s.charCodeAt(0) : -1; }

function readTextFile(file) {
    if (!file || !file.exists) return "";
    try {
        file.encoding = "UTF-8";
        if (!file.open("r")) return "";
        var content = file.read();
        file.close();
        if (content && content.length > 0 && content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
        return content;
    } catch (e) {
        log("Fayl oxuma xətası: " + e);
        return "";
    }
}

function getNumberedFiles(folder, filterRegex) {
    if (!folder || !folder.exists) return [];
    var all = folder.getFiles();
    if (!all) return [];
    var out = [];
    for (var i=0;i<all.length;i++){
        try { if (all[i] instanceof File && filterRegex.test(all[i].name)) out.push(all[i]); } catch(e){}
    }
    out.sort(function(a,b){
        var na = parseInt(a.name.match(/^\d+/)) || 0;
        var nb = parseInt(b.name.match(/^\d+/)) || 0;
        return na - nb;
    });
    return out;
}

function findImageFiles(folder, groupNum) {
    if (!folder || !folder.exists) return [];
    var pattern = new RegExp("^" + groupNum + "[-_]?(\\d+)\\.(jpe?g|png|tiff?|gif|bmp)$","i");
    var all = folder.getFiles();
    if (!all) return [];
    var res = [];
    for (var i=0;i<all.length;i++){
        try { if (all[i] instanceof File && pattern.test(all[i].name)) res.push(all[i]); } catch(e){}
    }
    res.sort(function(a,b){
        var ma = a.name.match(/[-_](\d+)\./);
        var mb = b.name.match(/[-_](\d+)\./);
        var na = ma ? parseInt(ma[1]) : 0; var nb = mb ? parseInt(mb[1]) : 0;
        return na - nb;
    });
    return res;
}

function applyFontAndSizeToStory(story, fontName, size) {
    try {
        if (fontName) {
            try { story.characters.everyItem().appliedFont = app.fonts.item(fontName); } catch(e) {}
        }
    } catch(e){}
    try { if (size) story.characters.everyItem().pointSize = size; } catch(e){}
}

function safeSwatchByName(docRef, name) {
    try {
        var s = docRef.swatches.itemByName(name);
        if (s && s.isValid) return s;
    } catch(e){}
    return null;
}

// UI events
btnBrowse.onClick = function() {
    var f = Folder.selectDialog("Ana qovluğu seçin (page2, page3...)");
    if (f) etFolder.text = f.fsName;
};

btnTest.onClick = function() {
    debugLog = [];
    log("TEST BAŞLADI");
    var root = new Folder(etFolder.text);
    if (!root || !root.exists) { alert("Qovluq yoxdur"); return; }
    var totalTxt=0, totalImg=0;
    for (var p=2;p<=8;p++){
        var fld = new Folder(root + "/page" + p);
        if (!fld.exists) continue;
        var t = getNumberedFiles(fld, /\.txt$/i).length;
        var im = getNumberedFiles(fld, /\.(jpe?g|png|tiff?|gif|bmp)$/i).length;
        log("page" + p + ": txt=" + t + ", img=" + im);
        totalTxt += t; totalImg += im;
    }
    alert("Test tamamlandı\n" + totalTxt + " mətn, " + totalImg + " şəkil\nKonsola baxın.");
};

// Core placing logic with overflow and first-column width support
btnRun.onClick = function() {
    debugLog = [];
    totalPlaced = 0; totalErrors = 0;
    try {
        log("YERLƏŞDİRMƏ BAŞLADI");

        var root = new Folder(etFolder.text);
        if (!root || !root.exists) { alert("Ana qovluq seçin"); return; }

        var cols = parseInt(ddlColumns.selection.text) || 2;
        var imgRatio = Math.round(sliderImg.value)/100;
        var padding = parseFloat(ddlPadding.selection.text) || 5;
        var titleSize = parseInt(ddlTitleSize.selection.text) || defaults.titleSize;
        var bodySize = parseInt(ddlBodySize.selection.text) || defaults.bodySize;
        var titleAlign = [Justification.LEFT_ALIGN, Justification.CENTER_ALIGN, Justification.RIGHT_ALIGN][ddlTitleAlign.selection.index];
        var bodyAlign = [Justification.LEFT_ALIGN, Justification.FULLY_JUSTIFIED, Justification.CENTER_ALIGN][ddlBodyAlign.selection.index];
        var fitOption = [FitOptions.FILL_PROPORTIONALLY, FitOptions.CONTENT_TO_FRAME, FitOptions.FRAME_TO_CONTENT][ddlFit.selection.index];

        var overflowMode = ddlOverflow.selection.text;
        var maxLinked = parseInt(etMaxLinked.text) || defaults.maxLinked;
        var minFont = parseFloat(etMinFont.text) || defaults.minFontSize;
        var firstColEnabled = chkEnableFirstCol.value;
        var firstColPercent = parseFloat(etFirstCol.text) || 0;
        if (firstColPercent < 0) firstColPercent = 0;

        for (var pageIndex=1; pageIndex<=7; pageIndex++) {
            if (!chkPages[pageIndex-1].value) continue;
            var pageNum = pageIndex + 1;
            var pageFolder = new Folder(root + "/page" + pageNum);
            log("\nSəhifə: " + pageNum);
            if (!pageFolder.exists) { log("Qovluq yoxdur: " + pageFolder.fsName); continue; }

            var page = doc.pages[pageIndex];

            // clear existing
            if (chkClear.value) {
                try {
                    var items = page.allPageItems;
                    if (items && items.length) {
                        for (var it=items.length-1; it>=0; it--) {
                            try { items[it].remove(); } catch(e){ log("Item remove error: " + e); }
                        }
                    }
                    log("Mövcud elementlər silindi");
                } catch(e){ log("Clear error: " + e); }
            }

            // layer
            if (chkLayers.value) {
                try {
                    var lname = "Səh. " + pageNum;
                    var layer = doc.layers.itemByName(lname);
                    if (!layer || !layer.isValid) layer = doc.layers.add({name: lname});
                    doc.activeLayer = layer;
                } catch(e){ log("Layer error: " + e); }
            }

            var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
            if (!txtFiles || txtFiles.length === 0) { log("Heç bir .txt yoxdur"); continue; }

            var bounds = page.bounds;
            var margin = page.marginPreferences || {top:12.7,left:12.7,bottom:12.7,right:12.7};
            var usableW = (bounds[3] - bounds[1]) - margin.left - margin.right;
            var usableH = (bounds[2] - bounds[0]) - margin.top - margin.bottom;
            var startX = bounds[1] + margin.left;
            var startY = bounds[0] + margin.top;

            // compute column widths with optional first-column extra percent
            var colWidths = [];
            if (firstColEnabled && firstColPercent > 0 && cols > 1) {
                var ratioFirst = 1 + (firstColPercent/100);
                var totalRatio = ratioFirst + (cols -1) * 1;
                var firstW = usableW * (ratioFirst / totalRatio);
                colWidths.push(firstW);
                var otherW = usableW * (1 / totalRatio);
                for (var c=2;c<=cols;c++) colWidths.push(otherW);
            } else {
                for (var c=0;c<cols;c++) colWidths.push(usableW / cols);
            }

            var rows = Math.ceil(txtFiles.length / cols);
            var cellH = usableH / rows;

            txtProgress.text = "Səhifə " + pageNum + " işlənir...";
            win.update();

            for (var i=0;i<txtFiles.length;i++){
                var row = Math.floor(i/cols);
                var col = i % cols;
                var cellW = colWidths[col];
                // x offset needs to account for previous columns' widths
                var x = startX;
                for (var cc=0; cc<col; cc++) x += colWidths[cc];
                var y = startY + row * cellH;

                log("  ➤ " + txtFiles[i].name);

                var content = readTextFile(txtFiles[i]);
                if (!content) continue;
                var lines = content.split(/\r?\n/);
                var clean = [];
                for (var ln=0; ln<lines.length; ln++){
                    var t = lines[ln].replace(/^\s+|\s+$/g,'');
                    if (t !== "") clean.push(t);
                }
                if (clean.length === 0) continue;

                var title = clean[0] || "";
                var bodyLines = [];
                for (var b=1;b<clean.length;b++) bodyLines.push(clean[b]);
                var body = bodyLines.join("\r");

                if (chkTitleUpper.value) title = title.toUpperCase();

                var groupNum = parseInt(txtFiles[i].name.match(/^\d+/)) || (i+1);
                var imgFiles = findImageFiles(pageFolder, groupNum);

                var currentY = y;

                // background alternate
                if (chkBg.value && (i % 2 === 1)) {
                    try {
                        var bg = page.rectangles.add();
                        bg.geometricBounds = [y, x, y + cellH, x + cellW];
                        var paper = safeSwatchByName(doc, "Paper");
                        if (paper) { bg.fillColor = paper; bg.fillTint = 8; }
                        bg.strokeWeight = 0;
                        bg.sendToBack();
                    } catch(e){ log("BG error: " + e); }
                }

                // Images
                if (imgFiles && imgFiles.length > 0) {
                    var imgHeight = cellH * (Math.round(sliderImg.value)/100);
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
                            try { rect.fit(fitOption); } catch(e){}
                            if (chkImgBorder.value) {
                                rect.strokeWeight = parseFloat(ddlBW.selection.text);
                                var black = safeSwatchByName(doc, "Black");
                                try { rect.strokeColor = black ? black : doc.swatches.itemByName("Black"); } catch(e){}
                            } else rect.strokeWeight = 0;

                            if (chkCaption.value) {
                                try {
                                    var cap = page.textFrames.add();
                                    cap.geometricBounds = [ imgY + (imgHeight/2) - padding - 15, imgX, imgY + (imgHeight/2) - padding, imgX + imgWidth - padding ];
                                    cap.contents = imgFiles[j].name.replace(/\.(jpe?g|png|tiff?|gif|bmp)$/i,'');
                                    cap.parentStory.characters.everyItem().pointSize = Math.max(7, bodySize-2);
                                    cap.parentStory.paragraphs.everyItem().justification = Justification.CENTER_ALIGN;
                                } catch(e){ log("Caption error: " + e); }
                            }

                            totalPlaced++;
                        } catch(e){ log("Image place error: " + e); totalErrors++; }
                    }
                    currentY += imgHeight + padding;
                }

                // Title
                var ttrim = title.replace(/^\s+|\s+$/g,'');
                if (ttrim !== "") {
                    try {
                        var titleH = titleSize + 8;
                        var tFrame = page.textFrames.add();
                        tFrame.geometricBounds = [ currentY, x + padding, currentY + titleH, x + cellW - padding ];
                        tFrame.contents = title;
                        try {
                            if (chkTitleBold.value) {
                                var boldFont = null;
                                try { boldFont = app.fonts.itemByName("Arial\tBold"); } catch(e){}
                                if (boldFont && boldFont.isValid) tFrame.parentStory.characters.everyItem().appliedFont = boldFont;
                            }
                        } catch(e){}
                        tFrame.parentStory.characters.everyItem().pointSize = titleSize;
                        try { tFrame.parentStory.paragraphs.everyItem().justification = [Justification.LEFT_ALIGN, Justification.CENTER_ALIGN, Justification.RIGHT_ALIGN][ddlTitleAlign.selection.index]; } catch(e){}
                        currentY += titleH + padding;
                        totalPlaced++;
                    } catch(e){ log("Title error: " + e); totalErrors++; }
                }

                // Body + Overflow handling
                var btrim = body.replace(/^\s+|\s+$/g,'');
                if (btrim !== "") {
                    try {
                        var bottom = y + cellH - padding;
                        var availTop = currentY;
                        var availHeight = bottom - availTop;
                        if (availHeight <= 6) {
                            log("  Mətn üçün kifayət qədər sahə yoxdur");
                        } else {
                            // create initial frame occupying available area (we start with full height)
                            var tf = page.textFrames.add();
                            tf.geometricBounds = [ availTop, x + padding, bottom, x + cellW - padding ];
                            tf.contents = btrim;
                            // set initial font size
                            try { tf.parentStory.characters.everyItem().pointSize = bodySize; } catch(e){}
                            try { tf.parentStory.paragraphs.everyItem().justification = bodyAlign; } catch(e){}
                            if (ddlLeading.selection.index > 0) {
                                var mult = [1,1.1,1.2,1.3,1.4,1.5][ddlLeading.selection.index];
                                try { tf.parentStory.paragraphs.everyItem().leading = bodySize * mult; } catch(e){}
                            }

                            if (overflowMode === "Avto-resize") {
                                // if overflows, reduce font stepwise until fits or minFont reached
                                if (tf.overflows) {
                                    var currentSize = bodySize;
                                    while (tf.overflows && currentSize > minFont) {
                                        currentSize = Math.max(minFont, currentSize - 0.5);
                                        try { tf.parentStory.characters.everyItem().pointSize = currentSize; } catch(e){}
                                    }
                                    if (tf.overflows) log("  ⚠️ Overflow qalır (min fonta çatıldı: " + minFont + ")");
                                    else log("  ✓ Avto-resize ilə uyğunlaşdırıldı (font: " + currentSize + ")");
                                }
                            } else if (overflowMode === "Linked frames") {
                                // if overflows, create up to maxLinked additional frames within the same cell
                                if (tf.overflows) {
                                    var prev = tf;
                                    var linkedCreated = 0;
                                    var remainingTop = availTop + (availHeight * 0.6) + padding; // start next frames after first ~60%
                                    // shrink first frame to 60% height
                                    try {
                                        prev.geometricBounds = [ availTop, x + padding, availTop + Math.max(20, availHeight * 0.6), x + cellW - padding ];
                                    } catch(e){}
                                    var nextTop = availTop + Math.max(20, availHeight * 0.6) + padding;
                                    var remainingArea = bottom - nextTop;
                                    while (prev.overflows && linkedCreated < maxLinked && remainingArea > 10) {
                                        var thisH = Math.max(20, Math.min( Math.ceil(remainingArea/(maxLinked-linkedCreated)), remainingArea) );
                                        var newFrame = page.textFrames.add();
                                        newFrame.geometricBounds = [ nextTop, x + padding, nextTop + thisH, x + cellW - padding ];
                                        try { prev.nextTextFrame = newFrame; } catch(e){}
                                        // apply same formatting to story (they are same story as overflow flows)
                                        try { newFrame.parentStory.characters.everyItem().pointSize = bodySize; } catch(e){}
                                        try { newFrame.parentStory.paragraphs.everyItem().justification = bodyAlign; } catch(e){}
                                        linkedCreated++;
                                        nextTop += thisH + padding;
                                        remainingArea = bottom - nextTop;
                                        prev = newFrame;
                                    }
                                    if (tf.overflows) log("  ⚠️ Overflow qalır (linked max: " + maxLinked + ")");
                                    else log("  ✓ Linked frames ilə sığdırıldı (əlavə frames: " + linkedCreated + ")");
                                }
                            } else {
                                if (tf.overflows) log("  ⚠️ Overflow mövcuddur (Heç biri rejimi seçilib)");
                            }

                            totalPlaced++;
                        }
                    } catch(e){ log("Body place error: " + e); totalErrors++; }
                }
            } // txtFiles loop
        } // pages loop

        // DONE — Export removed as requested
        log("\nTAMAMLANDI — Yerləşdirilən elementlər: " + totalPlaced + ", xətalar: " + totalErrors);
        txtProgress.text = "✅ " + totalPlaced + " yerləşdirildi, " + totalErrors + " xətalar";
        alert("Tamamlandı:\n" + totalPlaced + " element\n" + totalErrors + " xətalar\nKonsola baxın.");
    } catch (e) {
        log("Xəta: " + e);
        try { log("Sətir: " + (e.line ? e.line : "bilinmir")); } catch(e){}
        alert("Xəta: " + e);
        txtProgress.text = "Xəta!";
    }
};

win.center();
win.show();