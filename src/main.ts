import { Status } from 'model/status';
import { Editor, MarkdownView, Platform, Plugin, TFile } from 'obsidian';
import { DEFAULT_SETTINGS } from 'settings';
import { TaskTrackingView, VIEW_ID } from 'task-tracking-view';
import { updateTaskFromEditor } from 'service/modify-task.service';
import * as app from 'state/app.state';
import * as settings from 'state/settings.state';
import * as statusBar from 'service/status-bar.service';
import * as taskSource from 'service/task-source.service';
import * as dv from 'service/data-view.service';
import * as wait from 'service/wait.service';
import { TaskToggleModal } from 'task-toggle-modal';
import * as taskState from 'state/tasks.state';
import { SecondsToFractionalHours, SecondsToTime } from 'component/task-tracking-view';


// due to limitations of obsidian adding icons, I must use icon swapper and inject new svgs to get icons I want
const circleAIcon = "dot-network";
const circleCIcon = "double-down-arrow-glyph";
const circleIIcon = "double-up-arrow-glyph";
const circleITcon = "yesterday-glyph";

export default class TaskTrackingPlugin extends Plugin {
	public editor_handler: Editor;
	statusBar: HTMLElement;


	async onload() {
		app.set(this.app);
		const logFile = Platform.isMobile ? ".obsidian/plugins/obsidian-activity-tracking/log(mobile).txt"
			: ".obsidian/plugins/obsidian-activity-tracking/log(computer).txt"
		settings.set(Object.assign({}, { ...DEFAULT_SETTINGS, logFileName: logFile }, await this.loadData()));
		statusBar.set(this.addStatusBarItem());
		wait.until(() => dv.ready(), this.setup, 200);
	}

	getTaskTimeByFile = async (file: TFile | null): Promise<string> => {
		if (!file) {
			file = this.app.workspace.getActiveFile();
		}
		if (file == null) {
			return "0";
		}
		const tasks = await taskState.get();
		const seconds = tasks.filter(t => t.path == file?.path).reduce((acc, t) => acc + t.getTimes().timeSpent, 0);
		return (seconds / 3600).toFixed(2)
	}

	setup = async () => {
		// setup ease of use hotkey modal for finding and modifying a task
		this.addCommand({ id: "toggle-task", icon: circleITcon, name: "Toggle Task", hotkeys: [{ modifiers: ["Alt"], key: "t" }], callback: async () => new TaskToggleModal(this.app).open() });

		const editorCallback = (status: Status) => (check: boolean, editor: Editor) => {
			if (!!check) {
				return !!editor;
			}
			updateTaskFromEditor(editor, status);
		};

		this.addCommand({ id: 'activate-task-command', icon: circleAIcon, name: 'Activate Task', hotkeys: [{ modifiers: ["Alt"], key: "a" }], editorCheckCallback: editorCallback(Status.Active) });
		this.addCommand({ id: 'inactivate-task-command', icon: circleIIcon, name: 'Inactivate Task', hotkeys: [{ modifiers: ["Alt"], key: "i" }], editorCheckCallback: editorCallback(Status.Inactive) });
		this.addCommand({ id: 'complete-task-command', icon: circleCIcon, name: 'Complete Task', hotkeys: [{ modifiers: ["Alt"], key: "c" }], editorCheckCallback: editorCallback(Status.Complete) });
		this.addCommand({ id: 'show-task-view', icon: "view", name: 'Show Task View', hotkeys: [{ modifiers: ["Alt"], key: "b" }], callback: () => this.activateView() });
		this.addCommand({ id: 'print-total-task-time-for-current-page', name: 'Print Total Task Time For Current Page', callback: () => this.getTaskTimeByFile(this.app.workspace.getActiveFile()) });

		// taskSource.nukeAllIdsOnSourceTasks();
		statusBar.set(this.addStatusBarItem());
		this.registerView(VIEW_ID, (leaf) => new TaskTrackingView(leaf));
		this.addRibbonIcon("view", "Show Task View", () => this.activateView());
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

