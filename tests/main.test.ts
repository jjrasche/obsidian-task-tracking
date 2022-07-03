import { Editor, MarkdownView, Plugin, TAbstractFile, TFile, TFolder, View } from "obsidian";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import TodoTrackingPlugin from "main";
import { cache_update, delay, PLUGIN_NAME, TARGET_FILE_NAME, DATA_FILE_NAME } from "./Util.test";
import { ActivateToDoTests } from "./activate.test";
import { ActivityData, Session } from "model";
import { threadId } from "worker_threads";

chai.use(chaiAsPromised);

export default class TestTodoTrackingPlugin extends Plugin {
    tests: Array<{ name: string; fn: () => Promise<void> }>;
    plugin: TodoTrackingPlugin;
    // editor: Editor;
    // view: MarkdownView;
    data_file: TFile;
    target_file: TFile;

    async onload() {
        // this.addCommand({
        //     id: "run-todo-tracking-tests",
        //     name: "Run Todo Tracking Tests",
        //     hotkeys: [{ modifiers: ["Mod", "Shift"], key: "r" }],
        //     editorCallback: async (editor, view) => {
        //         this.editor = editor;
        //         this.view = view;
        //         this.run();
        //     },
        // });
        this.run()
    }

    async run() {
        await this.setup();
        await this.load_tests();
        await this.run_tests();
        await this.teardown();
    }

    async setup() {
        // await delay(300);
        this.tests = new Array();
        this.plugin = this.plugins.getPlugin(PLUGIN_NAME);
        this.target_file = await this.createOrFindFile(TARGET_FILE_NAME);
        this.data_file = await this.createOrFindFile(DATA_FILE_NAME);
        // await delay(300);
        await this.app.workspace.getLeaf().openFile(this.target_file);
    }

    async teardown() {
        await this.app.vault.delete(this.target_file, true);
        await this.app.vault.delete(this.data_file, true);
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

    async createOrFindFile(fileName: string): Promise<TFile> {
        try {
            return await this.app.vault.create(fileName, "");
        } catch(e) {
            return this.findFile(fileName);
        }
    }

    // setCursorAndGetEditor(line: number = 0, column: number = 0): Editor {
    //     const editor = this.editor;
    //     editor.setCursor(line, column);
    //     return editor;
    // }

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
        Object.keys(data).forEach(key => {
            data[key].forEach((session: Session) => {
                session.time = new Date(session.time);
            });
        });
        return data;
    }

    async readFile(file: TFile): Promise<string> {
        return this.app.vault.read(file);
    }
}
