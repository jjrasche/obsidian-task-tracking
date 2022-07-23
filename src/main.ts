import { Status } from 'model/status';
import { Editor, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS } from 'settings';
import { TaskTrackingView, VIEW_ID } from 'task-tracking-view';
import * as app from 'state/app.state';
import * as settings from 'state/settings.state';
import * as statusBar from 'service/status-bar.service';
import { updateTaskFromEditor } from 'service/modify-task.service';

export default class TaskTrackingPlugin extends Plugin {
    public editor_handler: Editor;
	statusBar: HTMLElement;

	async onload() {
		app.set(this.app);
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

