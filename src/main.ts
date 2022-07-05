import { changeTask } from 'logic';
import { SessionStatus } from 'model/session-status';
import { Editor, MarkdownView, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, Settings } from 'settings';

/*
	functionality:
	create commands for:
		- Active task activating task at current cursor

	? is a JSON file the best place to keep task data?
	data structure, what do operations should be prioritized.
	- finding task by ID 
	- find active task
	- adding a task by ID
	- reports
		- filter for all active tasks
	data structures
	- array: find task by ID = O(n), find active task = O(n), add task = O(1)
	- hash: find task by ID = O(1), find active task = O(n), add task = O(1)

*/



export default class TaskTrackingPlugin extends Plugin {
    public editor_handler: Editor;
    public settings: Settings;
	statusBar: HTMLElement;

	async onload() {
		await this.load_settings();

		this.addCommand({
			id: 'activate-task-command',
			name: 'Activate Task',
			hotkeys: [{ modifiers: ["Alt"], key: "a" }],
			editorCheckCallback:  (check: boolean, editor: Editor) => {
				if (!!check) {
					return !!editor;
				}
				changeTask(this.app, editor, this.settings, SessionStatus.active);
			}
		});
		this.addCommand({
			id: 'inactivate-task-command',
			name: 'Inactivate Task',
			hotkeys: [{ modifiers: ["Alt"], key: "i" }],
			editorCheckCallback:  (check: boolean, editor: Editor) => {
				if (!!check) {
					return !!editor;
				}
				changeTask(this.app, editor, this.settings, SessionStatus.inactive);
			}
		});
		this.addCommand({
			id: 'complete-task-command',
			name: 'Complete Task',
			hotkeys: [{ modifiers: ["Alt"], key: "c" }],
			editorCheckCallback:  (check: boolean, editor: Editor) => {
				if (!!check) {
					return !!editor;
				}
				changeTask(this.app, editor, this.settings, SessionStatus.complete);
			}
		});
		this.statusBar = this.addStatusBarItem();

		// this.addRibbonIcon('up-arrow-with-tail', 'Activity Tracker Plugin', (evt: MouseEvent) => {});
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {});
		// this.registerInterval(window.setInterval(() => conole.log('setInterval'), 5 * 60 * 1000)); // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
	}

	onunload() {
	}

	async save_settings(): Promise<void> {
        await this.saveData(this.settings);
    }

    async load_settings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
}

