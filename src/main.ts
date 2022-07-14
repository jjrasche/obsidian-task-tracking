import { ModifyTaskService } from 'modify-task.service';
import { Status } from 'model/status';
import { Editor, MarkdownView, Plugin, View } from 'obsidian';
import { DEFAULT_SETTINGS, Settings } from 'settings';
import { TaskTrackingView, VIEW_ID } from 'task-tracking-view';

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
			editorCheckCallback: (check: boolean, editor: Editor) => {
				if (!!check) {
					return !!editor;
				}
				(new ModifyTaskService(this.app, editor, this.settings, this.statusBar)).setup().then(mts => mts.changeCurrentTask(Status.Active));
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
				(new ModifyTaskService(this.app, editor, this.settings, this.statusBar)).setup().then(mts => mts.changeCurrentTask(Status.Inactive));
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
				(new ModifyTaskService(this.app, editor, this.settings, this.statusBar)).setup().then(mts => mts.changeCurrentTask(Status.Complete));
			}
		});
		this.statusBar = this.addStatusBarItem();

		// setup view
		this.registerView(VIEW_ID, (leaf) => new TaskTrackingView(leaf, this.app, this.settings));
		this.addRibbonIcon("dice", "Activate view", () => this.activateView());

		// testing run the activateveiw command initially
		this.activateView();

		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {});
		// this.registerInterval(window.setInterval(() => conole.log('setInterval'), 5 * 60 * 1000)); // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_ID);
	}

	async save_settings(): Promise<void> {
        await this.saveData(this.settings);
    }

    async load_settings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

	async activateView() {
		this.app.workspace.detachLeavesOfType(VIEW_ID);
		await this.app.workspace.getLeaf(false).setViewState({ type: VIEW_ID, active: true });
		this.app.workspace.revealLeaf(
		  this.app.workspace.getLeavesOfType(VIEW_ID)[0]
		);
	  }
}

