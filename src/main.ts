import { Status } from 'model/status';
import { Editor, MarkdownView, Platform, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS } from 'settings';
import { TaskTrackingView, VIEW_ID } from 'task-tracking-view';
import { updateTaskFromEditor } from 'service/modify-task.service';
import * as app from 'state/app.state';
import * as settings from 'state/settings.state';
import * as statusBar from 'service/status-bar.service';
import * as taskSource from 'service/task-source.service';
import * as dv from 'service/data-view.service';
import * as wait from 'service/wait.service';


// due to limitations of obsidian adding icons, I must use icon swapper and inject new svgs to get icons I want
const circleAIcon = "dot-network";
const circleCIcon = "double-down-arrow-glyph";
const circleIIcon = "double-up-arrow-glyph";

export default class TaskTrackingPlugin extends Plugin {
    public editor_handler: Editor;
	statusBar: HTMLElement;


	async onload() {
		app.set(this.app);
		settings.set(Object.assign({}, DEFAULT_SETTINGS, await this.loadData()));
		statusBar.set(this.addStatusBarItem());
		wait.until(() => dv.ready(), this.setup, 200);
	}
	
	setup = async() => {
		const editorCallback = (status: Status) => (check: boolean, editor: Editor) => {
			if (!!check) {
				return !!editor;
			}
			updateTaskFromEditor(editor, status);
		};

		this.addCommand({ id: 'activate-task-command', icon: circleAIcon, name: 'Activate Task', hotkeys: [{ modifiers: ["Alt"], key: "a" }], editorCheckCallback: editorCallback(Status.Active) });
		this.addCommand({ id: 'inactivate-task-command', icon: circleIIcon, name: 'Inactivate Task', hotkeys: [{ modifiers: ["Alt"], key: "i" }], editorCheckCallback: editorCallback(Status.Inactive) });
		this.addCommand({ id: 'complete-task-command', icon: circleCIcon, name: 'Complete Task', hotkeys: [{ modifiers: ["Alt"], key: "c" }], editorCheckCallback: editorCallback(Status.Complete) });

		// taskSource.nukeAllIdsOnSourceTasks();
		statusBar.set(this.addStatusBarItem());
		this.registerView(VIEW_ID, (leaf) => new TaskTrackingView(leaf));
		if (Platform.isMobile) {
			this.addRibbonIcon(circleAIcon, "Activate Task", () => updateTaskFromEditor(this.editor, Status.Active));
		} else {
			this.addRibbonIcon("view", "Show Task View", () => this.activateView());

		}
		// this.activateView();

		statusBar.initialize(); 
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

    get editor(): Editor {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			throw Error("view is undefined");
		}
        const editor = view.editor;
        if (!editor) {
            throw Error("editor is undefined");
        }
        return editor;
    }
}

