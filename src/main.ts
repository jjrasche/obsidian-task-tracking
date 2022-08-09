import { Status } from 'model/status';
import { Editor, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS } from 'settings';
import { TaskTrackingView, VIEW_ID } from 'task-tracking-view';
import { updateTaskFromEditor } from 'service/modify-task.service';
import * as app from 'state/app.state';
import * as settings from 'state/settings.state';
import * as statusBar from 'service/status-bar.service';
import * as dv from 'service/data-view.service';


export default class TaskTrackingPlugin extends Plugin {
    public editor_handler: Editor;
	statusBar: HTMLElement;

	async doTheThing() {
		console.log("doTheThing");
		settings.set(Object.assign({}, DEFAULT_SETTINGS, await this.loadData()));
		statusBar.set(this.addStatusBarItem());

		const editorCallback = (status: Status) => (check: boolean, editor: Editor) => {
			if (!!check) {
				return !!editor;
			}
			updateTaskFromEditor(editor, status);
		};

		this.addCommand({ id: 'activate-task-command', name: 'Activate Task', hotkeys: [{ modifiers: ["Alt"], key: "a" }], editorCheckCallback: editorCallback(Status.Active) });
		this.addCommand({ id: 'inactivate-task-command', name: 'Inactivate Task', hotkeys: [{ modifiers: ["Alt"], key: "i" }], editorCheckCallback: editorCallback(Status.Inactive) });
		this.addCommand({ id: 'complete-task-command', name: 'Complete Task', hotkeys: [{ modifiers: ["Alt"], key: "c" }], editorCheckCallback: editorCallback(Status.Complete) });

		statusBar.set(this.addStatusBarItem());
		this.registerView(VIEW_ID, (leaf) => new TaskTrackingView(leaf));
		this.addRibbonIcon("dice", "Activate view", () => this.activateView());
		// this.activateView();

		statusBar.initialize(); 
	}


	async onload() {
		app.set(this.app);
		this.pollForDataViewPagesLoaded();
	}
	
	async pollForDataViewPagesLoaded() {
		if(!dv.ready()) {
			setTimeout(() => this.pollForDataViewPagesLoaded(), 100, this);
		 } else {
		   this.doTheThing();
		}
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_ID);
	}

	async activateView() {
		this.app.workspace.detachLeavesOfType(VIEW_ID);
		await this.app.workspace.getLeaf(true, 'horizontal').setViewState({ type: VIEW_ID, active: true });
		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(VIEW_ID)[0]
		);
	}
}

