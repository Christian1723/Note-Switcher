'use strict';

var obsidian = require('obsidian');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, [])).next());
    });
}

const DEFAULT_SETTINGS = {
    targetFolder: ""
};
class NextNotePlugin extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        this.fileList = [];
    }
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("NextNotePlugin geladen");
            yield this.loadSettings();
            this.addSettingTab(new NextNoteSettingTab(this.app, this));
            this.addCommand({
                id: "open-next-note",
                name: "Open next note",
                hotkeys: [{ modifiers: ["Mod"], key: "j" }],
                callback: () => this.openAdjacentNote(1),
            });
            this.addCommand({
                id: "open-previous-note",
                name: "Open previous note",
                hotkeys: [{ modifiers: ["Mod"], key: "k" }],
                callback: () => this.openAdjacentNote(-1),
            });
            this.updateFileList();
            this.registerEvent(this.app.vault.on("modify", () => this.updateFileList()));
            this.registerEvent(this.app.vault.on("delete", () => this.updateFileList()));
            this.registerEvent(this.app.vault.on("create", () => this.updateFileList()));
        });
    }
    onunload() {
        console.log("NextNotePlugin entladen");
    }
    updateFileList() {
        const basePath = this.settings.targetFolder.trim();
        this.fileList = this.app.vault.getFiles()
            .filter(f => {
            const pathMatches = basePath === "." || basePath === "" || f.path.startsWith(basePath + "/");
            const isRelevantFile = f.extension === 'md' || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(f.extension);
            return pathMatches && isRelevantFile;
        })
            .sort((a, b) => a.path.localeCompare(b.path)); // Nach vollständigem Pfad sortieren
    }
    openAdjacentNote(direction) {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile || this.fileList.length === 0)
            return;
        const currentIndex = this.fileList.findIndex(f => f.path === activeFile.path);
        if (currentIndex === -1)
            return;
        let newIndex = currentIndex + direction;
        // Zyklisches Verhalten
        if (newIndex >= this.fileList.length)
            newIndex = 0;
        if (newIndex < 0)
            newIndex = this.fileList.length - 1;
        const newFile = this.fileList[newIndex];
        this.app.workspace.openLinkText(newFile.path, "", false);
    }
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
        });
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveData(this.settings);
            this.updateFileList();
        });
    }
}
class NextNoteSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl("h2", { text: "Next/Previous Note – Settings" });
        new obsidian.Setting(containerEl)
            .setName("Target Folder")
            .setDesc("Select the folder from which to cycle notes. Use '.' to include the entire vault.")
            .addDropdown((dropdown) => __awaiter(this, void 0, void 0, function* () {
            const folders = new Set();
            const files = this.app.vault.getFiles();
            // "." als Option für den ganzen Vault
            folders.add(".");
            for (const file of files) {
                const parts = file.path.split("/");
                parts.pop(); // Entferne Dateinamen
                for (let i = 1; i <= parts.length; i++) {
                    folders.add(parts.slice(0, i).join("/"));
                }
            }
            const sortedFolders = Array.from(folders).sort();
            for (const folder of sortedFolders) {
                dropdown.addOption(folder, folder === "." ? "(Entire Vault)" : folder);
            }
            dropdown
                .setValue(this.plugin.settings.targetFolder || ".")
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.settings.targetFolder = value;
                yield this.plugin.saveSettings();
            }));
        }));
    }
}

module.exports = NextNotePlugin;
