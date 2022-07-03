import { Editor, MarkdownView, Plugin, TFile } from "obsidian";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import TaskTrackingPlugin from "main";
import { TaskData, Session, SessionStatus } from "model";
import { InactivateTaskTests } from "./inactivate.test";
import { ActivateTaskTests } from "./activate.test";


export const PLUGIN_NAME = "obsidian-activity-tracking";
export const TARGET_FILE_NAME = "TargetFile.md";
export const DATA_FILE_NAME = "DataFile.json";

export default class TestTaskTrackingPlugin extends Plugin {
    tests: Array<{ name: string; suite?: string; fn: () => Promise<void> }>;
    plugin: TaskTrackingPlugin;
    data_file: TFile;
    target_file: TFile;

    async onload() {
        this.run()
    }

    async run() {
        await this.setup();
        await this.load_tests();
        await this.run_tests();
        await this.teardown();
    }

    async setup() {
        this.tests = new Array();
        this.plugin = this.plugins.getPlugin(PLUGIN_NAME);
        this.target_file = await this.createOrFindFile(TARGET_FILE_NAME);
        this.data_file = await this.createOrFindFile(DATA_FILE_NAME);
        await this.app.workspace.getLeaf().openFile(this.target_file);  // duplicates the use case of interacting with a file in editor
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
        await this.loadTestSuite(ActivateTaskTests)
        await this.loadTestSuite(InactivateTaskTests);
    }

    async loadTestSuite(loadSuite: Function) {
        await loadSuite(this);
        this.tests.filter(t => !t.suite).forEach(t => t.suite = loadSuite.name);
    }

    test(name: string, fn: () => Promise<void>) {
        this.tests.push({ name, fn })
    }

    async run_tests() {
        for (let test of this.tests) {
            try {
                await test.fn();
                console.log(`✅ ${test.suite}: ${test.name}`);
            } catch (e) {
                console.log(`❌ ${test.suite}: ${test.name}`);
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

    async getData(): Promise<TaskData> {
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

    /*
        shared methods used across test suites
    */
    async setupTest(fileContent: string, intialData = {}, line = 0) {
        await this.modifyFile(TARGET_FILE_NAME, fileContent);
        await this.modifyFile(DATA_FILE_NAME, JSON.stringify(intialData));
        this.editor.setCursor(line);
    }
    
    async expectTaskInData(initialData: {}, taskID: number, expectedNumTasks = 1, expecteNumSessions = 1, expectedMostRecentSessionStatus = SessionStatus.active) {
        const data = await this.getData();
        const mostRecentSession = (data[taskID].last() ?? {}) as Session;
        expect(Object.keys(data)).to.have.lengthOf(expectedNumTasks);               // 1 task
        expect(data[taskID]).to.not.be.null;                                        // taskID exists in data
        expect(data[taskID]).to.have.lengthOf(expecteNumSessions);                  // task has 1 session
        expect(mostRecentSession.status).to.eql(expectedMostRecentSessionStatus);   // session has active status
        expect(mostRecentSession.time)
            .lessThan(new Date())
            .greaterThan(new Date((new Date()).setSeconds(-10)));                   // session has active status
        data[taskID].pop();
        if (data[taskID].length === 0) {
            delete data[taskID];
        }
        expect(JSON.stringify(data)).to.eql(JSON.stringify(initialData))            // only 1 session added
    }
    
    async expectTargetFile(expectedFileContent: string) {
        const targetFile = await this.readFile(this.target_file);
        expect(targetFile).to.eql(expectedFileContent);     // taskID added to selected task
    }
    
    async expectNoChanges(fileContent: string, initialData = {}) {
        const data = await this.getData();
        await expect(JSON.stringify(data)).to.eql(JSON.stringify(initialData));  // data file unchanged
        expect(await this.readFile(this.target_file)).to.eql(fileContent); // target file unchanged
    }
}
