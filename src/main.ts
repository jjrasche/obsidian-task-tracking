import { ModifyTaskService } from 'modify-task.service';
import { Status } from 'model/status';
import { Editor, MarkdownView, Plugin, View } from 'obsidian';
import { DEFAULT_SETTINGS, Settings } from 'settings';
import { TaskTrackingView, VIEW_ID } from 'task-tracking-view';
import { DataViewService } from 'data-view.service';
import { isActive, TaskDataService } from 'task-data.service';

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

		const editorCallback = (status: Status) => (check: boolean, editor: Editor) => {
			if (!!check) {
				return !!editor;
			}
			(new ModifyTaskService(this.app, this.settings, editor, this.statusBar)).setup().then(mts => mts.changeCurrentTask(status));
		};

		this.addCommand({ id: 'activate-task-command', name: 'Activate Task', hotkeys: [{ modifiers: ["Alt"], key: "a" }], editorCheckCallback: editorCallback(Status.Active) });
		this.addCommand({ id: 'inactivate-task-command', name: 'Inactivate Task', hotkeys: [{ modifiers: ["Alt"], key: "i" }], editorCheckCallback: editorCallback(Status.Inactive) });
		this.addCommand({ id: 'complete-task-command', name: 'Complete Task', hotkeys: [{ modifiers: ["Alt"], key: "c" }], editorCheckCallback: editorCallback(Status.Complete) });

		await this.initializeStatusBar();
		// setup view
		this.registerView(VIEW_ID, (leaf) => new TaskTrackingView(leaf, this.app, this.settings));
		// this.activateView();
		this.addRibbonIcon("dice", "Activate view", () => this.activateView());
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
		await this.app.workspace.getLeaf(true, 'horizontal').setViewState({ type: VIEW_ID, active: true });
		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_ID)[0]
		);
	}

	async initializeStatusBar() {
		// create status bar
		this.statusBar = this.addStatusBarItem();
		// pull active task and find corresponding sourceTask
		const tds = await new TaskDataService(this.app, this.settings).setup();
		const taskID = tds.getMostRecentID();
		const tasks = new DataViewService(this.app).getManagedTasks()
		const currentTask = tasks.find(task => task.taskID === taskID);
		// initialize status bar
		if (!!currentTask) {
			const mts = await new ModifyTaskService(this.app, this.settings, undefined, this.statusBar).setup();
			mts.modifyStatusBar(currentTask, Status.Active);
		} else {
			console.log("tried to set but currentTask was undefined")
		}
	}
}

