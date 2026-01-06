/* main.js - Pandoc Live Preview Plugin (v2.0.1: Increase Suggest Limit) */
const { Plugin, EditorSuggest, requestUrl, Notice, PluginSettingTab, Setting, FileSystemAdapter, ItemView, WorkspaceLeaf, Debounce } = require('obsidian');
const { StateField } = require('@codemirror/state');
const { Decoration, EditorView, WidgetType } = require('@codemirror/view');
const path = require('path');

// === 视图常量 ===
const VIEW_TYPE_PANDOC_OUTLINE = "pandoc-outline-view";

// === 默认设置 ===
const DEFAULT_SETTINGS = {
    picgoUrl: "http://127.0.0.1:36677/upload",
    autoUpload: true,
    addNewLineAroundImage: true, 
    hideGapAroundImage: true,    
    deleteLocal: true,
    figPrefix: "图",
    tblPrefix: "表",
    autoParentheses: true,
    enableClickToJump: true,
    
    // 样式设置
    captionColor: "#1e88e5",     
    captionBold: true,           
    captionCenter: true,         
    captionTopOffset: 6,         
    captionBottomDistance: 12,   
    referenceColor: "#1e88e5",   
    referenceBold: false         
};

// === 辅助函数 ===
function getTimestamp() {
    const now = new Date();
    return `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}`;
}

// === 1. 标签组件 (LabelWidget) ===
class LabelWidget extends WidgetType {
    constructor(text, type, isDef, caption = "", suffix = "", hasParen = false, targetPos = null, settings = null, status = "normal") {
        super();
        this.text = text;       
        this.type = type;       
        this.isDef = isDef;     
        this.caption = caption;
        this.suffix = suffix;   
        this.hasParen = hasParen;
        this.targetPos = targetPos;
        this.settings = settings;
        this.status = status; 
    }

    toDOM(view) {
        const span = document.createElement("span");
        let content = this.text;

        if (this.isDef) {
            if (this.caption) content = `${this.text} ${this.caption}`;
        } else {
            if (this.status === "broken") {
                content = `⛔ @${this.type}:${this.text}`; 
            } else {
                content = `${this.text}${this.suffix}`;
                if (this.hasParen) content = `(${content})`;
            }
        }
        
        span.innerText = content;
        span.className = `pandoc-widget pandoc-${this.type} pandoc-${this.isDef ? 'def' : 'ref'}`;
        
        if (this.isDef && this.status === "unused") {
            span.classList.add('pandoc-unused');
            span.title = "警告：此图表未被引用";
        }
        if (!this.isDef && this.status === "broken") {
            span.classList.add('pandoc-broken');
            span.title = "错误：引用的ID不存在！";
        }

        if (this.settings && this.status !== "broken") {
            if (this.isDef) {
                if (this.status !== "unused" && this.settings.captionColor) span.style.color = this.settings.captionColor;
                span.style.fontWeight = this.settings.captionBold ? '600' : '400';
                span.style.textAlign = this.settings.captionCenter ? 'center' : 'left';
                span.style.marginTop = `${this.settings.captionTopOffset}px`;
                span.style.marginBottom = `${this.settings.captionBottomDistance}px`;
            } else {
                if (this.settings.referenceColor) span.style.color = this.settings.referenceColor;
                span.style.fontWeight = this.settings.referenceBold ? '600' : '400';
            }
        }
        
        if(this.caption) span.classList.add('has-caption');

        if (!this.isDef && this.settings && this.settings.enableClickToJump && this.targetPos !== null && this.status !== "broken") {
            span.classList.add('pandoc-clickable');
            span.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                view.dispatch({ selection: { anchor: this.targetPos, head: this.targetPos }, scrollIntoView: true });
            };
        }
        return span;
    }
}

// === 2. 隐藏组件 ===
class TopGapWidget extends WidgetType {
    toDOM(view) { const span = document.createElement("span"); span.className = "pandoc-gap"; return span; }
}

// === 3. 全文审计扫描 (Audit) ===
let currentSettings = Object.assign({}, DEFAULT_SETTINGS);

function scanDocumentStats(text, settings) {
    const definitions = [];
    const definedIds = new Set();
    const references = [];
    const undefinedImages = []; 

    const FIG_PRE = settings.figPrefix;
    const TBL_PRE = settings.tblPrefix;

    // 1. 扫描定义 ({#fig:xxx})
    const defRegex = /\{#(fig|tbl):([a-zA-Z0-9_\-]+)(?:\s+.*?)?\}/g;
    let defMatch;
    let figCount = 0;
    let tblCount = 0;

    while ((defMatch = defRegex.exec(text)) !== null) {
        const type = defMatch[1];
        const id = defMatch[2];
        let label = "";
        if (type === 'fig') label = `${FIG_PRE}${++figCount}`;
        else if (type === 'tbl') label = `${TBL_PRE}${++tblCount}`;

        // 提取标题
        let caption = id; 
        const lookBackText = text.slice(Math.max(0, defMatch.index - 500), defMatch.index);
        // 修复：提取标题时也支持尖括号路径
        const imgMatch = lookBackText.match(/!\[([^\]]*)\]\((?:<[^>]+>|[^\)]+)\)\s*$/);
        if (imgMatch && imgMatch[1]) caption = imgMatch[1].trim();
        const tblMatch = lookBackText.match(/(:[^\r\n{]+)$/);
        if (tblMatch) caption = tblMatch[1].substring(1).trim();

        definitions.push({
            id: id, type: type, label: label, fullId: `${type}:${id}`, 
            position: defMatch.index, caption: caption || id,
            isUnused: true 
        });
        definedIds.add(id);
    }

    // 2. 扫描引用 (@fig:xxx)
    const refRegex = /@(fig|tbl):([a-zA-Z0-9_\-]+)/g;
    let refMatch;
    while ((refMatch = refRegex.exec(text)) !== null) {
        const id = refMatch[2];
        const isBroken = !definedIds.has(id);
        
        references.push({
            id: id, type: refMatch[1], position: refMatch.index, 
            fullText: refMatch[0], isBroken: isBroken
        });
    }

    // 3. 修正定义的未使用状态
    const usedIds = new Set(references.map(r => r.id));
    definitions.forEach(def => {
        if (usedIds.has(def.id)) def.isUnused = false;
    });

    // 4. 扫描未定义ID的图片 (【核心修复】：支持尖括号路径 <path> 和普通路径)
    // 解释：\((?:<[^>]+>|[^\)]+)\)
    // (?: ... ) 是非捕获组
    // <[^>]+> 匹配尖括号包裹的内容 (处理含括号的路径)
    // | 或者
    // [^\)]+ 匹配不含右括号的普通路径
    const imgRegex = /!\[([^\]]*)\]\((?:<[^>]+>|[^\)]+)\)/g;
    let imgM;
    while ((imgM = imgRegex.exec(text)) !== null) {
        const endPos = imgM.index + imgM[0].length;
        const nextText = text.slice(endPos, endPos + 50); 
        if (!/^\s*\{#fig:/.test(nextText)) {
            undefinedImages.push({ caption: imgM[1] || "未命名图片", position: imgM.index });
        }
    }

    // 5. 提取失效引用
    const orphanRefs = references.filter(r => r.isBroken);

    return { definitions, references, orphanRefs, undefinedImages };
}

// === 4. 核心装饰器 ===
const pandocRefField = StateField.define({
    create(state) { return Decoration.none; },
    update(oldDecorations, transaction) {
        if (!transaction.docChanged && !transaction.selection) return oldDecorations;

        const state = transaction.state;
        const text = state.doc.toString();
        const widgets = [];
        const selectionRanges = state.selection.ranges;
        
        const { definitions, definedIds } = scanDocumentStats(text, currentSettings);
        
        const figMap = new Map();
        const tblMap = new Map();
        const posMap = new Map();
        const unusedMap = new Map(); 
        const defSet = new Set();    
        
        definitions.forEach(def => {
            if (def.type === 'fig') figMap.set(def.id, def.label.replace(currentSettings.figPrefix, ''));
            if (def.type === 'tbl') tblMap.set(def.id, def.label.replace(currentSettings.tblPrefix, ''));
            posMap.set(def.id, def.position);
            unusedMap.set(def.id, def.isUnused);
            defSet.add(def.id);
        });

        function checkCursorOverlap(start, end) {
            for (const range of selectionRanges) { if (range.from <= end && range.to >= start) return true; }
            return false;
        }
        function consumeImmediateNewlines(text, currentStart) {
            let tempStart = currentStart;
            while (tempStart > 0) {
                if (text[tempStart - 1].match(/[\n\r ]/)) tempStart--; else break;
            }
            return tempStart;
        }
        function consumeHorizontalSpaces(text, pos) {
            while (pos < text.length) {
                if (text[pos] === ' ' || text[pos] === '\t') pos++; else break;
            }
            return pos;
        }

        function addDecoration(start, end, type, id, isDef, suffix = "", hasParen = false) {
            let number = "?";
            let prefix = type === 'fig' ? currentSettings.figPrefix : currentSettings.tblPrefix;
            let caption = "";
            let targetPos = null;
            let status = "normal";

            if (isDef) {
                if (unusedMap.has(id) && unusedMap.get(id)) status = "unused";
            } else {
                if (!defSet.has(id)) status = "broken";
            }

            if (type === 'fig') {
                if (figMap.has(id)) number = figMap.get(id);
                if (isDef) {
                    const lookBackLimit = Math.max(0, start - 500);
                    const precedingText = text.slice(lookBackLimit, start);
                    const imgMatch = precedingText.match(/!\[([^\]]*)\]\([^\)]+\)\s*$/);
                    
                    if (imgMatch) {
                        caption = imgMatch[1].trim(); 
                        if (currentSettings.hideGapAroundImage) {
                            const imgStartPos = start - imgMatch[0].length; 
                            if (imgStartPos > 0 && text[imgStartPos - 1] === '\n') {
                                const gapStart = imgStartPos - 1;
                                if (!checkCursorOverlap(gapStart, imgStartPos)) widgets.push(Decoration.replace({ widget: new TopGapWidget(), inclusive: false }).range(gapStart, imgStartPos));
                            }
                            start = consumeImmediateNewlines(text, start);
                        }
                    }
                    if (currentSettings.hideGapAroundImage) {
                        let checkPos = consumeHorizontalSpaces(text, end);
                        if (checkPos < text.length) {
                            if (text.startsWith('\r\n', checkPos)) end = checkPos + 2; 
                            else if (text[checkPos] === '\n') end = checkPos + 1;
                        }
                    }
                }
            } else if (type === 'tbl') {
                if (tblMap.has(id)) number = tblMap.get(id);
                if (isDef) {
                    const lookBackLimit = Math.max(0, start - 1000); 
                    const match = text.slice(lookBackLimit, start).match(/(:[^\r\n{]+)$/);
                    if (match) {
                        caption = match[1].substring(1).trim(); 
                        start = start - match[0].length;
                        start = consumeImmediateNewlines(text, start);
                    }
                }
            }

            if (!isDef && posMap.has(id)) targetPos = posMap.get(id);
            if (checkCursorOverlap(start, end)) return;

            const widgetText = (status === "broken") ? id : `${prefix}${number}`;

            const deco = Decoration.replace({
                widget: new LabelWidget(widgetText, type, isDef, caption, suffix, hasParen, targetPos, currentSettings, status),
                inclusive: false
            }).range(start, end);
            widgets.push(deco);
        }

        const defRegex = /\{#(fig|tbl):([a-zA-Z0-9_\-]+)(?:\s+.*?)?\}/g;
        let defMatch;
        while ((defMatch = defRegex.exec(text)) !== null) addDecoration(defMatch.index, defMatch.index + defMatch[0].length, defMatch[1], defMatch[2], true);

        const refRegex = /(\(?[ \t]*)@(fig|tbl):([a-zA-Z0-9_\-]+)(?:[ \t]+([a-zA-Z]))?([ \t]*\)?)/g;
        let refMatch;
        while ((refMatch = refRegex.exec(text)) !== null) {
            const hasParen = (refMatch[1].includes('(') && refMatch[5].includes(')'));
            addDecoration(refMatch.index, refMatch.index + refMatch[0].length, refMatch[2], refMatch[3], false, refMatch[4] || "", hasParen);
        }

        return Decoration.set(widgets.sort((a, b) => a.from - b.from));
    },
    provide: (field) => EditorView.decorations.from(field)
});

// === 5. 侧边栏视图 ===
class PandocOutlineView extends ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        this.updateDebounce = this.debounce(this.updateView.bind(this), 500); 
    }

    getViewType() { return VIEW_TYPE_PANDOC_OUTLINE; }
    getDisplayText() { return "图表审计 (Pandoc)"; }
    getIcon() { return "image-file"; }

    async onOpen() {
        this.registerEvent(this.app.workspace.on('editor-change', this.updateDebounce));
        this.registerEvent(this.app.workspace.on('file-open', this.updateView.bind(this)));
        this.updateView();
    }

    async updateView() {
        const container = this.contentEl;
        container.empty();
        container.addClass("pandoc-outline-container");

        const view = this.app.workspace.getActiveViewOfType(require('obsidian').MarkdownView);
        if (!view) {
            container.createEl("div", { text: "未激活 Markdown 编辑器" });
            return;
        }

        const text = view.editor.getValue();
        const { definitions, orphanRefs, undefinedImages } = scanDocumentStats(text, this.plugin.settings);

        const header = container.createEl("div", { cls: "pandoc-outline-header" });
        header.createEl("div", { text: `📊 统计概览` });
        header.createEl("small", { text: `定义: ${definitions.length} | 引用失效: ${orphanRefs.length} | 未定义: ${undefinedImages.length}`, style: "opacity:0.8" });

        if (orphanRefs.length > 0) {
            container.createEl("div", { cls: "pandoc-section-title", text: "⛔ 引用失效 (找不到定义)", style: "color: #d32f2f;" });
            orphanRefs.forEach(ref => {
                const el = container.createEl("div", { cls: "pandoc-outline-item pandoc-item-broken" });
                el.createEl("span", { text: ref.fullText });
                el.createEl("small", { text: `行 ${view.editor.offsetToPos(ref.position).line + 1}` });
                el.addEventListener("click", () => {
                    view.editor.setCursor(view.editor.offsetToPos(ref.position));
                    view.editor.focus();
                    view.editor.scrollIntoView({ from: view.editor.offsetToPos(ref.position), to: view.editor.offsetToPos(ref.position) }, true);
                });
            });
        }

        if (undefinedImages.length > 0) {
            container.createEl("div", { cls: "pandoc-section-title", text: "⚠️ 未打标签的图片", style: "color: #7f8c8d;" });
            undefinedImages.forEach(img => {
                const el = container.createEl("div", { cls: "pandoc-outline-item pandoc-item-missing-id" });
                el.createEl("span", { text: img.caption });
                el.addEventListener("click", () => {
                    view.editor.setCursor(view.editor.offsetToPos(img.position));
                    view.editor.focus();
                    view.editor.scrollIntoView({ from: view.editor.offsetToPos(img.position), to: view.editor.offsetToPos(img.position) }, true);
                });
            });
        }

        if (definitions.length > 0) {
            container.createEl("div", { cls: "pandoc-section-title", text: "📑 图表定义列表" });
            definitions.forEach(def => {
                let itemCls = "pandoc-item-normal";
                let statusText = "";
                if (def.isUnused) {
                    itemCls = "pandoc-item-unused";
                    statusText = "(未使用)";
                }
                const el = container.createEl("div", { cls: `pandoc-outline-item ${itemCls}` });
                el.createEl("span", { text: `${def.label} ${def.caption}` });
                if(statusText) el.createEl("span", { text: statusText, cls: "pandoc-tag" });
                el.addEventListener("click", () => {
                    view.editor.setCursor(view.editor.offsetToPos(def.position));
                    view.editor.focus();
                    view.editor.scrollIntoView({ from: view.editor.offsetToPos(def.position), to: view.editor.offsetToPos(def.position) }, true);
                });
            });
        }
    }

    debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
}

// === 6. 自动补全 ===
class PandocSuggest extends EditorSuggest {
    constructor(plugin) {
        super(plugin.app);
        this.plugin = plugin;
        this.limit = 1000; // 【核心修复】增加建议数量限制，解决大文档显示不全问题
    }
    onTrigger(cursor, editor, file) {
        const line = editor.getLine(cursor.line);
        const sub = line.substring(0, cursor.ch);
        const match = sub.match(/(@(fig|tbl)?:?([a-zA-Z0-9_\-]*))$/);
        if (match) return { start: { line: cursor.line, ch: match.index }, end: cursor, query: match[0] };
        return null;
    }
    getSuggestions(context) {
        const text = context.editor.getValue();
        const { definitions } = scanDocumentStats(text, this.plugin.settings);
        const query = context.query.toLowerCase();
        return definitions.filter(def => `@${def.type}:${def.id}`.toLowerCase().includes(query))
                   .map(def => ({ ...def, suggestionText: `@${def.type}:${def.id}` }));
    }
    renderSuggestion(suggestion, el) {
        el.createEl("span", { text: suggestion.label, cls: "pandoc-suggest-label" }); 
        el.createEl("small", { text: ` (${suggestion.id})`, cls: "pandoc-suggest-id" });
    }
    selectSuggestion(suggestion, event) {
        const context = this.context;
        if (!context) return;
        let textToInsert = suggestion.suggestionText;
        if (this.plugin.settings.autoParentheses) textToInsert = `( ${textToInsert} )`;
        context.editor.replaceRange(textToInsert, context.start, context.end);
    }
}

// === 7. 设置面板 ===
class PandocLivePreviewSettingTab extends PluginSettingTab {
    constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Pandoc Live Preview v2.0.1 设置' });

        new Setting(containerEl).setName('PicGo 上传接口').addText(t => t.setValue(this.plugin.settings.picgoUrl).onChange(async v => { this.plugin.settings.picgoUrl = v; await this.plugin.saveSettings(); }));
        new Setting(containerEl).setName('剪切板自动上传').addToggle(t => t.setValue(this.plugin.settings.autoUpload).onChange(async v => { this.plugin.settings.autoUpload = v; await this.plugin.saveSettings(); }));
        new Setting(containerEl).setName('图片前后增加空行').addToggle(t => t.setValue(this.plugin.settings.addNewLineAroundImage).onChange(async v => { this.plugin.settings.addNewLineAroundImage = v; await this.plugin.saveSettings(); }));
        new Setting(containerEl).setName('预览时隐藏图片空行').addToggle(t => t.setValue(this.plugin.settings.hideGapAroundImage).onChange(async v => { this.plugin.settings.hideGapAroundImage = v; this.plugin.app.workspace.updateOptions(); await this.plugin.saveSettings(); }));
        new Setting(containerEl).setName('上传后移除本地文件').addToggle(t => t.setValue(this.plugin.settings.deleteLocal).onChange(async v => { this.plugin.settings.deleteLocal = v; await this.plugin.saveSettings(); }));

        containerEl.createEl('h3', { text: '视觉与位置' });
        new Setting(containerEl).setName('图表名颜色').addColorPicker(c => c.setValue(this.plugin.settings.captionColor).onChange(async v => { this.plugin.settings.captionColor = v; currentSettings.captionColor = v; await this.plugin.saveSettings(); this.plugin.app.workspace.updateOptions(); }));
        new Setting(containerEl).setName('图表名加粗').addToggle(t => t.setValue(this.plugin.settings.captionBold).onChange(async v => { this.plugin.settings.captionBold = v; currentSettings.captionBold = v; await this.plugin.saveSettings(); this.plugin.app.workspace.updateOptions(); }));
        new Setting(containerEl).setName('图表名居中显示').addToggle(t => t.setValue(this.plugin.settings.captionCenter).onChange(async v => { this.plugin.settings.captionCenter = v; currentSettings.captionCenter = v; await this.plugin.saveSettings(); this.plugin.app.workspace.updateOptions(); }));
        
        new Setting(containerEl).setName('图表名 上方 间距').addSlider(s => s.setLimits(-50, 50, 1).setValue(this.plugin.settings.captionTopOffset).setDynamicTooltip().onChange(async v => { this.plugin.settings.captionTopOffset = v; currentSettings.captionTopOffset = v; await this.plugin.saveSettings(); this.plugin.app.workspace.updateOptions(); }));
        new Setting(containerEl).setName('图表名 下方 间距').addSlider(s => s.setLimits(0, 100, 1).setValue(this.plugin.settings.captionBottomDistance).setDynamicTooltip().onChange(async v => { this.plugin.settings.captionBottomDistance = v; currentSettings.captionBottomDistance = v; await this.plugin.saveSettings(); this.plugin.app.workspace.updateOptions(); }));

        new Setting(containerEl).setName('引用处颜色').addColorPicker(c => c.setValue(this.plugin.settings.referenceColor).onChange(async v => { this.plugin.settings.referenceColor = v; currentSettings.referenceColor = v; await this.plugin.saveSettings(); this.plugin.app.workspace.updateOptions(); }));
        new Setting(containerEl).setName('引用处加粗').addToggle(t => t.setValue(this.plugin.settings.referenceBold).onChange(async v => { this.plugin.settings.referenceBold = v; currentSettings.referenceBold = v; await this.plugin.saveSettings(); this.plugin.app.workspace.updateOptions(); }));

        new Setting(containerEl).setName('启用单击跳转').addToggle(t => t.setValue(this.plugin.settings.enableClickToJump).onChange(async v => { this.plugin.settings.enableClickToJump = v; this.plugin.app.workspace.updateOptions(); await this.plugin.saveSettings(); }));
        new Setting(containerEl).setName('引用自动加括号').addToggle(t => t.setValue(this.plugin.settings.autoParentheses).onChange(async v => { this.plugin.settings.autoParentheses = v; await this.plugin.saveSettings(); }));

        containerEl.createEl('h3', { text: '前缀设置' });
        new Setting(containerEl).setName('图片前缀').addText(t => t.setValue(this.plugin.settings.figPrefix).onChange(async v => { this.plugin.settings.figPrefix = v; currentSettings.figPrefix = v; await this.plugin.saveSettings(); this.plugin.app.workspace.updateOptions(); }));
        new Setting(containerEl).setName('表格前缀').addText(t => t.setValue(this.plugin.settings.tblPrefix).onChange(async v => { this.plugin.settings.tblPrefix = v; currentSettings.tblPrefix = v; await this.plugin.saveSettings(); this.plugin.app.workspace.updateOptions(); }));
    }
}

// === 8. 插件主类 ===
module.exports = class PandocLivePreview extends Plugin {
    async onload() {
        await this.loadSettings();
        currentSettings = this.settings;
        this.registerView(VIEW_TYPE_PANDOC_OUTLINE, (leaf) => new PandocOutlineView(leaf, this));
        this.registerEditorExtension(pandocRefField);
        this.registerEditorSuggest(new PandocSuggest(this));
        this.addSettingTab(new PandocLivePreviewSettingTab(this.app, this));
        this.addCommand({ id: 'insert-fig-id', name: 'Insert Figure ID', editorCallback: (e) => e.replaceSelection(`{#fig:${getTimestamp()}}`) });
        this.addCommand({ id: 'insert-tbl-id', name: 'Insert Table ID', editorCallback: (e) => e.replaceSelection(`{#tbl:${getTimestamp()}}`) });
        this.addCommand({ id: 'open-pandoc-outline', name: '打开图表管理面板 (Pandoc Manager)', callback: () => this.activateView() });
        this.addRibbonIcon('image-file', 'Pandoc 图表管理', () => { this.activateView(); });
        this.registerEvent(this.app.workspace.on('editor-paste', this.handleImagePaste.bind(this)));
    }

    async activateView() {
        const { workspace } = this.app;
        let leaf = workspace.getLeavesOfType(VIEW_TYPE_PANDOC_OUTLINE)[0];
        if (!leaf) {
            const rightLeaf = workspace.getRightLeaf(false);
            if (rightLeaf) { await rightLeaf.setViewState({ type: VIEW_TYPE_PANDOC_OUTLINE, active: true }); leaf = workspace.getLeavesOfType(VIEW_TYPE_PANDOC_OUTLINE)[0]; }
        }
        if (leaf) workspace.revealLeaf(leaf);
    }

    async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); }
    async saveSettings() { await this.saveData(this.settings); }

    async handleImagePaste(evt, editor, view) {
        if (!this.settings.autoUpload) return;
        if (evt.clipboardData.files.length > 0) {
            const file = evt.clipboardData.files[0];
            if (file.type.startsWith('image/')) {
                evt.preventDefault();
                evt.stopPropagation();
                const timestamp = getTimestamp();
                const placeholder = `![Uploading...](${timestamp})`;
                editor.replaceSelection(placeholder);
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const extension = file.type.split('/')[1] || 'png';
                    const fileName = `Image_${timestamp}.${extension}`;
                    const filePath = await this.app.fileManager.getAvailablePathForAttachment(fileName);
                    await this.app.vault.createBinary(filePath, arrayBuffer);
                    let absolutePath;
                    if (this.app.vault.adapter instanceof FileSystemAdapter) absolutePath = path.join(this.app.vault.adapter.getBasePath(), filePath);
                    else { new Notice("PicGo 上传仅支持桌面版"); return; }
                    const response = await requestUrl({ url: this.settings.picgoUrl, method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ list: [absolutePath] }) });
                    const resData = response.json;
                    if (resData.success && resData.result && resData.result.length > 0) {
                        const remoteUrl = resData.result[0];
                        let finalStr = `![](${remoteUrl}){#fig:${timestamp}}`;
                        if (this.settings.addNewLineAroundImage) finalStr = `\n\n${finalStr}\n\n`;
                        const doc = editor.getValue();
                        if (doc.includes(placeholder)) { editor.setValue(doc.replace(placeholder, finalStr)); new Notice(`图片上传成功!`); } else { editor.replaceSelection(finalStr); }
                        if (this.settings.deleteLocal) { const fileToDelete = this.app.vault.getAbstractFileByPath(filePath); if (fileToDelete) await this.app.vault.delete(fileToDelete); }
                    } else { new Notice("PicGo 上传失败"); editor.setValue(editor.getValue().replace(placeholder, "")); }
                } catch (error) { console.error("Upload Error:", error); new Notice(`上传出错: ${error.message}`); editor.setValue(editor.getValue().replace(placeholder, "")); }
            }
        }
    }
};