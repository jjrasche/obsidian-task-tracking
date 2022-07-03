import { assert } from "console";
import { TaskData, Session, SessionStatus } from "model";
import { App, Editor, EditorPosition, MarkdownView, TFile, Vault } from "obsidian";
import { DATA_FILE_NAME, delay, TARGET_FILE_NAME } from "../tests/Util.test";

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

interface taskLine {
	isTask: boolean;
	taskID: number;
	text: string;
}

export function getTaskLine(editor: Editor): taskLine {
	const text = getCurrentLine(editor);
	const isTask = lineIsTask(text);
	if (!isTask) {
		return { isTask: false } as taskLine;
	}
	const matches = text.match(/\- \[.{1}\] [0-9]+\s/g);
	if (!!matches) {
		if (matches.length > 1) {
			throw new Error("found more than 1 task on this line");
		}
		const match = (matches[0].match(/[0-9]+/) ?? [])[0];
		try {
			return { taskID: parseInt(match), text } as taskLine;
		} catch(e){}
	}
	return { text } as taskLine;
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
export async function activateTask(editor: Editor, app: App): Promise<number | null> {
	let line = getTaskLine(editor);
	if (line.isTask === false) {
		return null;
	}
	if (!line.taskID) {
		line.taskID = await addTaskIdToTask(editor, line.text);
	}
	const data = await getActivityData(app);
	inactivateAllActiveTasks(data);
	addTaskSession(data, line.taskID, SessionStatus.active);
	await overwriteActivityData(app, data);
	return line.taskID;
}


export async function inactivateTask(editor: Editor, app: App): Promise<number | null> {
	let line = getTaskLine(editor);
	if (line.isTask === false || !line.taskID) {
		return null;
	}
	const data = await getActivityData(app);
	inactivateAllActiveTasks(data);
	addTaskSession(data, line.taskID, SessionStatus.inactive);
	await overwriteActivityData(app, data);
	return line.taskID;
}


function inactivateAllActiveTasks(data: TaskData) {
	const activeTaskIds = getAllActiveTaskIDs(data);
	if (!onlyOneActive) {
		activeTaskIds.forEach(id => {
			const t = data[id];
		})
	}
}

function addTaskSession(data: TaskData, taskID: number, status: SessionStatus) {
	const session = {time: new Date(), status} as Session;
	if (!data[taskID]) {
		assert(status === SessionStatus.active);
		data[taskID] = [session];
	} else {
		if (data[taskID].last()?.status !== SessionStatus.active) {
			data[taskID].push(session);
		}
	}
}

async function addTaskIdToTask(editor: Editor, text: string): Promise<number> {
	const split = text.split(/\- \[.{1}\] /);
	const taskPrefix = (text.match(/\- \[.{1}\] /)?? [])[0];
	const taskMessage = split[1];
	const taskID = (new Date()).getTime();
	const modifiedText = `${taskPrefix}${taskID} ${taskMessage}`;
	replaceCurrentText(editor, modifiedText);
	await app.workspace.getActiveViewOfType(MarkdownView)?.save()
	return taskID;
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
	const file = findFile(DATA_FILE_NAME);
	await tryDeleteFile(app, file);
	await app.vault.create(DATA_FILE_NAME, dataString);
	// await delay(300);
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