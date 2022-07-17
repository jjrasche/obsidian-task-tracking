import { DataViewService } from "data-view.service";
import { Status, StatusIndicator } from "model/status";
import { isActive, TaskDataService, TaskDataType } from "task-data.service";
import { App, Editor, EditorPosition, TFile, Vault } from "obsidian";
import { Settings } from "settings";
import { ManagedTask } from "./model/managed-task";
import { ObsidianFileService } from "obsidian-file.service";

export class ModifyTaskService {
	tds: TaskDataService;
	tasks: ManagedTask[];
	cursor?: EditorPosition;
	file: TFile | null;
	fs: ObsidianFileService;
	isTask: boolean;

	constructor(private app: App, private settings: Settings, private editor?: Editor, private statusBar?: HTMLElement) { }

	async setup(): Promise<this> {
		this.cursor = this.editor?.getCursor();
		const line = !!this.cursor?.line ? this.editor?.getLine(this.cursor?.line) : undefined;
		this.isTask = !!line ? !!line.match(/^\t*- \[.{1}\]\s/g) : true;
		if (this.isTask) {
			this.tds = await new TaskDataService(this.app, this.settings).setup();
			this.file = this.app.workspace.getActiveFile();
			this.tasks = (new DataViewService(this.app)).getManagedTasks(this.file?.path, this.cursor);
			this.fs = new ObsidianFileService(this.app);
		}
		return this;
	}

	async changeCurrentTask(status: Status): Promise<ManagedTask | undefined> {
		if (!this.isTask) {
			return;
		}
		const currentTask = this.tasks.find(task => task.path == this.file?.path && task.line === this.cursor?.line)
		if (!currentTask) {
			throw Error(`could not find current task in file: ${this.file?.name} on line: ${this.cursor?.line}`)
		}
		// only activate should allow for adding an id to a task without one
		if (!currentTask.taskID && status !== Status.Active) {
			return;
		}
		// do not add the same status as current status
		if (!!currentTask.taskID && !!this.tds.data[currentTask.taskID] && this.tds.data[currentTask.taskID].last()?.status === status) {
			return;
		}
		if (status === Status.Active) {
			this.modifyStatusBar(currentTask, status);
			if (!currentTask.taskID) {
				currentTask.taskID = this.getNextTaskID();
			}
		}
		this.modifyandSaveExistingTask(currentTask, status);
		return currentTask;
	}

	async modifyandSaveExistingTask(currentTask: ManagedTask, currentStatus: Status) {
		// setting specific logic for only allowing 1 task active at a time
		if (this.settings.onlyOneTaskActive && currentStatus === Status.Active) {
			await this.inactivateAllActiveTasks();
		}
		await this.changeTaskStatus(currentTask.taskID as number, currentStatus);
		await this.tds.save();
	}

	clickStatusChange(currentStatus: Status): Status {
		return currentStatus === Status.Active ? Status.Inactive : Status.Active;
	}
	
	// data is the source of truth
	private async inactivateAllActiveTasks() {
		// update backing data
		const activeTaskIDs = this.tds.getTaskIDs(isActive)
		for (const taskID of activeTaskIDs) {
			await this.changeTaskStatus(taskID, Status.Inactive);
		}
	}
	
	async changeTaskStatus(taskID: number, status: Status) {
		this.tds.addSession(taskID, status);
		const sourceTask = this.tasks.find(task => task.taskID === taskID);
		if (!sourceTask) {
			// task is in data, but not in a file
			// todo: consider if this scenario should cause failure
			throw new Error(`could not find sourceTask with id:${taskID}`);
		}
		sourceTask.status = StatusIndicator[status];
		await sourceTask.modifyTaskSourceFile(this.fs);
	}

	private getNextTaskID(): number {
		const keys = Object.keys(this.tds.data).sort();
		const newKey = Object.keys(this.tds.data).map(key => parseInt(key)).sort((a,b) => b - a)[0];
		const num = keys.length === 0 ? 0 : newKey;
		return num + 1;
	}
	/*
		needs the sourceTask to get the name
		needs 
	*/
	modifyStatusBar(currentTask: ManagedTask, status: Status) {
		this.statusBar?.firstChild?.remove();
		const ele = this.statusBar?.createEl("span", { text: currentTask.toString()});
		if (!!ele) {
			ele.onclick = async () => {
				const updatedStatus = this.clickStatusChange(status);
				await this.modifyandSaveExistingTask(currentTask, updatedStatus);
				this.modifyStatusBar(currentTask, updatedStatus);
			}
		}
	}
}

