import { Editor, MarkdownView, Plugin, TAbstractFile, TFile, TFolder } from "obsidian";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import TodoTrackingPlugin from "main";
import { cache_update, delay, PLUGIN_NAME, TARGET_FILE_NAME, DATA_FILE_NAME } from "./Util.test";
import { ActivateToDoTests } from "./activate.test";
import { ActivityData } from "model";

chai.use(chaiAsPromised);

export default class TestTodoTrackingPlugin extends Plugin {
    tests: Array<{ name: string; fn: () => Promise<void> }>;
    plugin: TodoTrackingPlugin;
    data_file: TFile;
    target_file: TFile;

    async onload() {
        this.run();
        this.addCommand({
            id: "run-todo-tracking-tests",
            name: "Run Todo Tracking Tests",
            callback: async () => this.run(),
        });
    }

    async run() {
        await this.setup();
        await this.load_tests();
        await this.run_tests();
        await this.teardown();
    }

    async setup() {
        await delay(300);
        this.tests = new Array();
        // const tp = this.plugins.getPlugin(PLUGIN_NAME);
        // this.plugin = tp.plugin
        this.plugin = this.plugins.getPlugin(PLUGIN_NAME);
        try {
            this.target_file = await this.app.vault.create(TARGET_FILE_NAME, "");
            this.data_file = await this.app.vault.create(DATA_FILE_NAME, "");
        } catch(e) {
            this.target_file = this.findFile(TARGET_FILE_NAME);
            this.data_file = this.findFile(DATA_FILE_NAME);
        }
        //await this.disable_external_plugins();
    }

    async teardown() {
        await this.app.vault.delete(this.target_file, true);
        await this.app.vault.delete(this.data_file, true);
        //await this.enable_external_plugins();
    }

    async disable_external_plugins() {
        for (const plugin_name of Object.keys(this.plugins.plugins)) {
            if (plugin_name !== PLUGIN_NAME && plugin_name !== this.manifest.id) {
                await this.plugins.plugins[plugin_name].unload();
            }
        }
    }

    async enable_external_plugins() {
        for (const plugin_name of Object.keys(this.plugins.plugins)) {
            if (plugin_name !== PLUGIN_NAME && plugin_name !== this.manifest.id) {
                await this.plugins.plugins[plugin_name].load();
            }
        }
    }

    async load_tests() {
        // todo: load tests 
        await ActivateToDoTests(this);

    }

    test(name: string, fn: () => Promise<void>) {
        this.tests.push({ name, fn });
    }

    async run_tests() {
        for (let t of this.tests) {
            try {
                await t.fn();
                console.log("✅", t.name);
            } catch (e) {
                console.log("❌", t.name);
                console.error(e);
            }
        }
    }


    async modifyFile(fileName: string, file_content: string = "") {
        const f = this.findFile(fileName);
        if (f && f instanceof TFile) {
            await this.app.vault.modify(f, file_content);
        }
    }

    findFile(fileName: string): TFile {
        const f = this.app.vault.getFiles().find(f => f.name === fileName);
        if (!f) {
            throw Error(`file ${fileName} not found.`);
        }
        return f;
    }

    setCursorAndGetEditor(line: number = 0, column: number = 0) {
        const editor = this.editor;
        editor.setCursor(line, column);
    }

    get view(): MarkdownView {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) {
            throw Error("view is undefined");
        }
        return view;
    }

    get editor(): Editor {
        const editor = this.view.editor;
        if (!editor) {
            throw Error("editor is undefined");
        }
        return editor;
    }

    get plugins(): any { 
        // @ts-ignore 
        return this.app.plugins
    }

    async getData(): Promise<ActivityData> {
        const dataString = await this.readFile(this.data_file);
        const data = JSON.parse(dataString);
        return data;
    }

    async readFile(file: TFile): Promise<string> {
        return this.app.vault.read(file);
    }
}
