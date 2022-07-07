import { DataViewService } from "data-view.service";
import { Status } from "model/status";
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

	constructor(private app: App, private editor: Editor, private settings: Settings) {
		this.cursor = this.editor.getCursor();
		const line = this.editor.getLine(this.cursor.line);
		this.isTask = !!line.match(/^\t*- \[.{1}\]\s/g);
	}

	async setup(): Promise<this> {
		if (this.isTask) {
			this.tds = await new TaskDataService(this.app, this.settings).setup();
			this.file = this.app.workspace.getActiveFile() as TFile;
			this.tasks = (new DataViewService(this.app)).getManagedTasks(this.file.path, this.cursor);
			this.fs = new FileService(this.app);
		}
		return this
	}

	async changeCurrentTask(status: Status) {
		if (!this.isTask) {
			return;
		}
		const currentTask = this.tasks.find(task => task.path == this.file?.path && task.line === this.cursor.line)
		if (!currentTask) {
			throw Error(`could not find current task in file: ${this.file?.name} on line: ${this.cursor.line}`)
		}
		// only activate should allow for adding an id to a task without one
		if (!currentTask.taskID && status !== Status.active)	{
			return;
		}
		// do not add the same status as current status
		const currentTaskData = this.tds.data[currentTask.taskID];
		if (!!currentTaskData && currentTaskData.last()?.status === status) {
			return;
		}
		// setting specific logic for only allowing 1 task active at a time
		if (!this.settings.onlyOneTaskActive && status === Status.active) {
			this.inactivateAllActiveTasks();
		}
		
		if (!currentTask.taskID && status === Status.active) {
			currentTask.taskID = this.getNextTaskID();
		}
		this.changeTaskStatus(currentTask.taskID, status);
		await this.tds.save();
		return currentTask.taskID;
	}
	
	// data is the source of truth
	private inactivateAllActiveTasks() {
		// update backing data
		this.tds.getTaskIDs(isActive).forEach((taskID: number) => {
			this.changeTaskStatus(taskID, Status.inactive);
		});
	}
	
	private changeTaskStatus(taskID: number, status: Status) {
		this.tds.addSession(taskID, Status.inactive);
		const sourceTask = this.tasks.find(task => task.taskID === taskID);
		if (!sourceTask) {
			throw new Error(`could not find sourceTask with id:${taskID}`);
		}
		sourceTask.status = status;
		sourceTask.modifyTaskSourceFile(this.fs);
	}

	private getNextTaskID(): number {
		return parseInt(Object.keys(this.tds.data).sort()[0]) + 1;
	}
}

