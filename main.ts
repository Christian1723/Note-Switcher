import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile
} from "obsidian";

interface NextNotePluginSettings {
  targetFolder: string;
}

const DEFAULT_SETTINGS: NextNotePluginSettings = {
  targetFolder: ""
};

export default class NextNotePlugin extends Plugin {
  settings: NextNotePluginSettings;
  private fileList: TFile[] = [];

  async onload() {
    console.log("NextNotePlugin geladen");

    await this.loadSettings();
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

  openAdjacentNote(direction: 1 | -1) {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile || this.fileList.length === 0) return;

    const currentIndex = this.fileList.findIndex(f => f.path === activeFile.path);

    if (currentIndex === -1) return;

    let newIndex = currentIndex + direction;

    // Zyklisches Verhalten
    if (newIndex >= this.fileList.length) newIndex = 0;
    if (newIndex < 0) newIndex = this.fileList.length - 1;

    const newFile = this.fileList[newIndex];
    this.app.workspace.openLinkText(newFile.path, "", false);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.updateFileList();
  }
}

class NextNoteSettingTab extends PluginSettingTab {
  plugin: NextNotePlugin;

  constructor(app: App, plugin: NextNotePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
  
    containerEl.createEl("h2", { text: "Next/Previous Note – Settings" });
  
    new Setting(containerEl)
      .setName("Target Folder")
      .setDesc("Select the folder from which to cycle notes. Use '.' to include the entire vault.")
      .addDropdown(async (dropdown) => {
        const folders = new Set<string>();
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
          .onChange(async (value) => {
            this.plugin.settings.targetFolder = value;
            await this.plugin.saveSettings();
          });
      });
  }
  
  }
}
