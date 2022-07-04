import { assert } from "console";
import { TaskData, Session, SessionStatus } from "model";
import { App, Editor, EditorPosition, MarkdownView, TFile, Vault } from "obsidian";
import { DATA_FILE_NAME } from "../tests/main.test";

const onlyOneActive = true;
const notATask = -1;
const noTaskID = -2;

export function getCurrentLine(editor: Editor): string {
	return editor.getLine(editor.getCursor().line);
}

export function replaceCurrentText(editor: Editor, changedLine: string) {
	const line = editor.getCursor().line;
	editor.setLine(line, changedLine);
} 

export function lineIsTask(line: string): boolean {
	return !!line.match(/\- \[.{1}\].{1}/g);
}

class TaskLine {
	constructor(
		public fullLine: string,
		public isTask: boolean,
		public prefix?: string,
		public taskID?: number,
		public text?: string) {}
	
	public toString(): string {
		return `${this.prefix} ${this.taskID} ${this.text?.trim()}`;
	}
}

export function getTaskLine(editor: Editor): TaskLine {
	const fullLine = getCurrentLine(editor);
	const prefixMatch = fullLine.match(/^- \[.{1}\]\s/g); // begins with "- [ ] "
	const isTask = !!prefixMatch;
	if (!isTask) {
		return new TaskLine(fullLine, false);
	}
	if (prefixMatch.length > 1) {
		throw new Error("found more than 1 task on this line");
	}
	const prefix = prefixMatch[0].trim();
	const taskID = getTaskID(fullLine);
	const text = getTaskText(fullLine);
	if (!!text) {
		text.trim();
	}
	return new TaskLine(fullLine, isTask, prefix, taskID, text);
}

function getTaskID(line: string): number {
	const startTaskMatch = line.match(/^- \[.{1}\]\s[0-9]+/g);
	const taskID = ((startTaskMatch ?? [""])[0].match(/[0-9]+/) ?? [])[0];
	return parseInt(taskID);
}

function getTaskText(line: string): string {
	const startTaskMatch = line.split(/^- \[.{1}\]\s[0-9]*/g);
	return startTaskMatch[1];
}

/*
	- attempt to pull taskID from line cursor is on
	- if currently on a task, but no taskID
		* add taskID to beginning of task
	- read in data from JSON file
	- if onlyOneActive
		* find currently active task and mark inactive
	- find task by taskID and mark active
	* persist data
*/
export async function changeTask(editor: Editor, app: App, status: SessionStatus): Promise<number | undefined> {
	let line = getTaskLine(editor);
	if (line.isTask === false || (!line.taskID && status !== SessionStatus.active)) {
		return undefined;
	}
	await makeModifications(app, editor, line, status)
	return line.taskID;
}


export async function makeModifications(app: App, editor: Editor, line: TaskLine, status: SessionStatus) {
	if (status === SessionStatus.active && !line.taskID) {
		line = await modifyTask(editor, line, TaskModification.AddTaskID);
	}
	if (status === SessionStatus.complete) {
		line = await modifyTask(editor, line, TaskModification.MarkComplete);
	}
	const data = await getActivityData(app);
	inactivateAllActiveTasks(data);
	addTaskSession(data, status, line.taskID);
	await overwriteActivityData(app, data);
}

function inactivateAllActiveTasks(data: TaskData) {
	const activeTaskIds = getAllActiveTaskIDs(data);
	if (!onlyOneActive) {
		activeTaskIds.forEach(id => {
			const t = data[id];
		})
	}
}

function addTaskSession(data: TaskData, status: SessionStatus, taskID?: number) {
	if (!taskID) {
		return;
	}
	const session = {time: new Date(), status} as Session;
	// do not add the same status as current status
	if (!!data[taskID] && data[taskID].last()?.status === status) {
		return;
	}
	if (!data[taskID]) {
		assert(status === SessionStatus.active);
		data[taskID] = [session];
	} else {
		data[taskID].push(session);
	}
}

enum TaskModification {
	AddTaskID,
	MarkComplete
}

async function modifyTask(editor: Editor, line: TaskLine, mod: TaskModification): Promise<TaskLine> {
	if (!line.text) {
		return line;
	}
	if (mod === TaskModification.AddTaskID) {
		line.taskID = (new Date()).getTime();			
	} else if (mod === TaskModification.MarkComplete) {
		line.prefix = "- [C]";
	}
	const modifiedLine = line.toString();
	replaceCurrentText(editor, modifiedLine);
	await app.workspace.getActiveViewOfType(MarkdownView)?.save()
	return line;
}

function getActivityDataFile(): TFile {
	// const fileName = "Scripts\\activity-data.json";
	const fileName = DATA_FILE_NAME;
	return findFile(fileName);
}

async function getActivityData(app: App): Promise<TaskData> {
	const data = await app.vault.read(getActivityDataFile());
	return JSON.parse(data)
}

async function overwriteActivityData(app: App, data: TaskData) {
	const dataFile = getActivityDataFile();
	const dataString = JSON.stringify(data);
	const file = findFile(DATA_FILE_NAME);  // todo: push these to a settings object
	await tryDeleteFile(app, file);
	await app.vault.create(DATA_FILE_NAME, dataString);
}

function findFile(fileName: string): TFile {
	const f = this.app.vault.getFiles().find((f: TFile) => f.name === fileName);
	if (!f) {
		throw Error(`file ${fileName} not found.`);
	}
	return f;
}

async function tryDeleteFile(app: App, file: TFile): Promise<boolean> {
	try {
		await app.vault.delete(file);
		return true;
	} catch (e) {
		return false;
	}
}

function getAllActiveTaskIDs(data: TaskData): number[] {
	let activeTasks = [];
	const taskKeys = Object.keys(data);
	for (var i = 0; i < taskKeys.length; i++) {
		const taskID = parseInt(taskKeys[i]);
		const sessions = data[taskID];
		const mostRecentSession = sessions[sessions.length - 1];
		if (!!mostRecentSession) {
			if (mostRecentSession.status == SessionStatus.active) {
				activeTasks.push(taskID);
				if (onlyOneActive) {
					return activeTasks;
				}
			}
		}
	}
	return activeTasks;
}