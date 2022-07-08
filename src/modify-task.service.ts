import { DataViewService } from "data-view.service";
import { Status, StatusIndicator } from "model/status";
import { isActive, TaskDataService, TaskDataType } from "task-data.service";
import { App, Editor, EditorPosition, TFile, Vault } from "obsidian";
import { Settings } from "settings";
import { ManagedTask } from "./model/activity-task";
import { FileService } from "file.service";

export class ModifyTaskService {
	tds: TaskDataService;
	tasks: ManagedTask[];
	cursor: EditorPosition;
	file: TFile;
	fs: FileService;
	isTask: boolean;

	constructor(private app: App, private editor: Editor, private settings: Settings, private statusBar: HTMLElement) {
	}

	async setup(): Promise<this> {
		this.cursor = this.editor.getCursor();
		const line = this.editor.getLine(this.cursor.line);
		this.isTask = !!line.match(/^\t*- \[.{1}\]\s/g);
		if (this.isTask) {
			this.tds = await new TaskDataService(this.app, this.settings).setup();
			this.file = this.app.workspace.getActiveFile() as TFile;
			this.tasks = (new DataViewService(this.app)).getManagedTasks(this.file.path, this.cursor);
			this.fs = new FileService(this.app);
		}
		return this;
	}

	async changeCurrentTask(status: Status): Promise<ManagedTask | undefined> {
		if (!this.isTask) {
			return;
		}
		const currentTask = this.tasks.find(task => task.path == this.file?.path && task.line === this.cursor.line)
		if (!currentTask) {
			throw Error(`could not find current task in file: ${this.file?.name} on line: ${this.cursor.line}`)
		}
		// only activate should allow for adding an id to a task without one
		if (!currentTask.taskID && status !== Status.Active)	{
			return;
		}
		// do not add the same status as current status
		if (!!currentTask.taskID && !!this.tds.data[currentTask.taskID] && this.tds.data[currentTask.taskID].last()?.status === status) {
			return;
		}
		// setting specific logic for only allowing 1 task active at a time
		if (this.settings.onlyOneTaskActive && status === Status.Active) {
			await this.inactivateAllActiveTasks();
		}
		if (!currentTask.taskID && status === Status.Active) {
			currentTask.taskID = this.getNextTaskID();
		}
		await this.changeTaskStatus(currentTask.taskID as number, status);
		await this.tds.save();
		this.modifyStatusBar(currentTask);
		return currentTask;
	}
	
	// data is the source of truth
	private async inactivateAllActiveTasks() {
		// update backing data
		const activeTaskIDs = this.tds.getTaskIDs(isActive)
		for (const taskID of activeTaskIDs) {
			await this.changeTaskStatus(taskID, Status.Inactive);
		}
	}
	
	private async changeTaskStatus(taskID: number, status: Status) {
		this.tds.addSession(taskID, status);
		const sourceTask = this.tasks.find(task => task.taskID === taskID);
		if (!sourceTask) {
			throw new Error(`could not find sourceTask with id:${taskID}`);
		}
		sourceTask.status = StatusIndicator[status];
		await sourceTask.modifyTaskSourceFile(this.fs);
	}

	private getNextTaskID(): number {
		const keys = Object.keys(this.tds.data).sort();
		const num = keys.length === 0 ? 0 : parseInt(Object.keys(this.tds.data).sort()[0]);
		return num + 1;
	}

	private modifyStatusBar(currentTask: ManagedTask) {
		this.statusBar.firstChild?.remove();
		this.statusBar.createEl("span", { text: currentTask.toString() });
	}
}

