import { ActivityData, Session, SessionStatus } from "model";
import { App, Editor, EditorPosition, MarkdownView, TFile, Vault } from "obsidian";
import { DATA_FILE_NAME, delay, TARGET_FILE_NAME } from "../tests/Util.test";

const onlyOneActive = true;

export function getCurrentLine(editor: Editor): string {
	return editor.getLine(editor.getCursor().line);
}

export function replaceCurrentLine(editor: Editor, changedLine: string) {
	const line = editor.getCursor().line;
	editor.setLine(line, changedLine);
} 

export function lineIsTask(line: string): boolean {
	return !!line.match(/\- \[.{1}\].{1}/g);
}

export function getTaskID(line: string): number | null {
	const matches = line.match(/\- \[.{1}\] [0-9]+\s/g);
	if (!!matches) {
		if (matches.length > 1) {
			throw new Error("found more than 1 task on this line");
		}
		const match = (matches[0].match(/[0-9]+/) ?? [])[0];
		try {
			return parseInt(match);
		} catch(e){}
	}
	return null;
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
	const line = getCurrentLine(editor);
	const isTask = lineIsTask(line);
	let taskID = getTaskID(line);
	if (!isTask) {
		return null;
	}
	if (isTask && !taskID) {
		taskID = await addTaskIdToTask(editor, line);
	}
	taskID = taskID as number;
	const data = await getActivityData(app);
	inactivateAllActiveTasks(data);
	addActiveTaskSession(data, taskID);
	await overwriteActivityData(app, data);
	return taskID;
}

function inactivateAllActiveTasks(data: ActivityData) {
	const activeTaskIds = getAllActiveTaskIDs(data);
	if (!onlyOneActive) {
		activeTaskIds.forEach(id => {
			const t = data[id];
		})
	}
}

function addActiveTaskSession(data: ActivityData, taskID: number) {
	const activeSession = {time: new Date(), status: SessionStatus.active} as Session;
	if (!data[taskID]) {
		data[taskID] = [activeSession];
	} else {
		data[taskID].push(activeSession);
	}
}


async function addTaskIdToTask(editor: Editor, line: string): Promise<number> {
	const split = line.split(/\- \[.{1}\] /);
	const taskPrefix = (line.match(/\- \[.{1}\] /)?? [])[0];
	const taskMessage = split[1];
	const taskID = (new Date()).getTime();
	const modifiedLine = `${taskPrefix}${taskID} ${taskMessage}`;
	replaceCurrentLine(editor, modifiedLine);
	await app.workspace.getActiveViewOfType(MarkdownView)?.save()
	return taskID;
}

function getActivityDataFile(): TFile {
	// const fileName = "Scripts\\activity-data.json";
	const fileName = DATA_FILE_NAME;
	return findFile(fileName);
}

async function getActivityData(app: App): Promise<ActivityData> {
	const data = await app.vault.read(getActivityDataFile());
	return JSON.parse(data)
}

async function overwriteActivityData(app: App, data: ActivityData) {
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

function getAllActiveTaskIDs(data: ActivityData): number[] {
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