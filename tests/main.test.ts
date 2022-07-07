import { Editor, MarkdownView, Plugin, TFile } from "obsidian";
import { expect } from "chai";
import { Session } from "model/session";
import { InactivateTaskTests } from "./inactivate.test";
import { ActivateTaskTests } from "./activate.test";
import { CompleteTaskTests } from "./complete.test";
import { TaskDataType } from "task-data.service";
import { DEFAULT_SETTINGS, Settings } from "settings";
import { FileService } from "file.service";


export const PLUGIN_NAME = "obsidian-task-tracking";
export const TARGET_FILE_NAME = "TargetFile.md";
export const DATA_FILE_NAME = "DataFile.json";

/*
    left off: with fixing test cases after resorting to importing settings in test
*/

export default class TestTaskTrackingPlugin extends Plugin {
    tests: Array<{ name: string; suite?: string; fn: () => Promise<void> }>;
    // plugin: TaskTrackingPlugin;
    settings: Settings;
    data_file: TFile;
    target_file: TFile;
    file: FileService = new FileService(this.app);

    // todo: try to code around this limitaion
    async load_settings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS);
    }

    async onload() {
        await this.load_settings();
        this.run();
    }

    async run() {
        await this.setup();
        await this.load_tests();
        await this.run_tests();
        await this.teardown();
    }

    async setup() {
        this.tests = new Array();
        this.target_file = await this.file.createOrFind(TARGET_FILE_NAME);
        this.data_file = await this.file.createOrFind(DATA_FILE_NAME);
        this.settings.taskDataFileName = DATA_FILE_NAME;
        await this.app.workspace.getLeaf().openFile(this.target_file);  // replicates the use case of interacting with a file in editor
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
        await this.loadTestSuite(CompleteTaskTests);
        // await this.loadTestSuite(TaskLineTests);
        const focusedTests = this.tests.filter(t => t.name.startsWith("fff"));
        if (focusedTests.length > 0) {
            this.tests = focusedTests;
        }
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

    async getData(): Promise<TaskDataType> {
        const dataString = await this.file.read(this.data_file);
        const data = JSON.parse(dataString);
        Object.keys(data).forEach(key => {
            data[key].forEach((session: Session) => {
                session.time = new Date(session.time);
            });
        });
        return data;
    }

    /*
        shared methods used across test suites
    */
    async setupTest(fileContent: string, intialData = {}, line = 0) {
        await this.file.modify(TARGET_FILE_NAME, fileContent);
        await this.file.modify(DATA_FILE_NAME, JSON.stringify(intialData));
        this.editor.setCursor(line);
    }
    
    async expectTaskInData(expected: TaskDataType) {
        const actual = await this.getData();
        expect(Object.keys(actual).sort()).to.eql(Object.keys(expected).sort());  // every expected task is present
        Object.keys(actual).forEach(key => {    // each task
            const actualSessions = actual[key];
            const expectedSessions = expected[key];
            expect(actualSessions.length).to.eql(expectedSessions.length);
            actualSessions.forEach((actualSession, idx) => {    // each session
                const expectedSession = expectedSessions[idx];
                expect(actualSession.status).to.eql(expectedSession.status);
                expect(actualSession.time)      // actual time should be before expected time
                    .greaterThan(new Date(expectedSession.time.getTime() - 2000))  
                    .lessThan(new Date(expectedSession.time.getTime() + 500));
            });
        });        
    }
    
    /*
        same keys -> concatenate values
        different keys add 
    */
    combineData(current: TaskDataType, updated: TaskDataType): TaskDataType {
        Object.keys(current).forEach(key => {
            const matchingUpdate = updated[key];
            if (!!matchingUpdate) {
                current[key] = current[key].concat(matchingUpdate)
                delete updated[key];
            }
        });
        return {...current, ...updated};
    }

    async expectTargetFile(expectedFileContent: string) {
        const targetFile = await this.file.read(this.target_file);
        expect(targetFile).to.eql(expectedFileContent);     // taskID added to selected task
    }
    
    async expectNoChanges(fileContent: string, initialData = {}) {
        const data = await this.getData();
        await expect(JSON.stringify(data)).to.eql(JSON.stringify(initialData));  // data file unchanged 
        expect(await this.file.read(this.target_file)).to.eql(fileContent) // target file unchanged
    }
}
