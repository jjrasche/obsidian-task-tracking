import { SessionStatus } from "model/session-status";
import { TaskData } from "model/task-data";
import { App, Editor } from "obsidian";
import { Settings } from "Settings";
import { TaskLine, TaskModification } from "./model/taskline";

export async function changeTask(app: App, editor: Editor, settings: Settings, status: SessionStatus): Promise<number | undefined> {
	let line = new TaskLine(editor);
	if (line.isTask === false || (!line.taskID && status !== SessionStatus.active)) {
		return undefined;
	}
	// Task file manipulations
	if (status === SessionStatus.active && !line.taskID) {
		await line.modifyTask(TaskModification.AddTaskID);
	}
	if (status === SessionStatus.complete) {
		await line.modifyTask(TaskModification.MarkComplete);
	}
	// data manipulations
	const data = await new TaskData(app, settings).setup();
	data.addSession(status, line.taskID);
	await data.save();
	return line.taskID;
}
