import { ActivityData, Session, SessionStatus } from "model";
import { Editor, EditorPosition, Vault } from "obsidian";

const onlyOneActive = true;

export function getCurrentLine(editor: Editor): string {
	return editor.getLine(editor.getCursor().line);
}

export function modifyCurrentLine(editor: Editor, changedLine: string) {
	const line = editor.getCursor().line;
	editor.replaceRange(changedLine, {line, ch: 0} as EditorPosition)
} 

export function lineIsTask(line: string): boolean {
	return !!line.match(/\- \[.{1}\].{1]/g);
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
export async function activateTodo(editor: Editor) {
	const line = getCurrentLine(editor);
	const isTask = lineIsTask(line);
	let taskID = getTaskID(line);
	if (!isTask) {
		return false;
	}
	if (isTask && !taskID) {
		taskID = addTaskIdToTask(editor, line);
	}
	const data = await getActivityData();
	const activeTaskIds = getAllActiveTaskIDs(data);
	if (!onlyOneActive) {
		activeTaskIds.forEach(id => {
			const t = data[id];
		})
	}
}

function addTaskIdToTask(editor: Editor, line: string): number {
	const split = line.split(/\- \[.{1}\] /);
	const taskPrefix = split[0];
	const taskMessage = split[1];
	const taskID = (new Date()).getTime();
	const modifiedLine = `${taskPrefix} ${taskID} ${taskMessage}`;
	modifyCurrentLine(editor, modifiedLine);
	return taskID;
}

async function getActivityData(): Promise<ActivityData> {
	const path = "Scripts\\activity-data.json";
	const vault = new Vault();
	const file = vault.getFiles().find(f => f.path.contains(path));
	if (!!file) {
		const data = await vault.read(file);
		return JSON.parse(data)
	} else {
		throw new Error(`could not find activity json in path ${path}`)
	}
}

function getAllActiveTaskIDs(data: ActivityData): number[] {
	let activeTodos = [];
	for (var i = 0; i < data.length; i++) {
		const taskID = parseInt(Object.keys(data[i])[0]);
		const sessions = data[i][taskID];
		const mostRecentSession = sessions[sessions.length - 1];
		if (!!mostRecentSession) {
			if (mostRecentSession.status == SessionStatus.active) {
				activeTodos.push(taskID);
				if (onlyOneActive) {
					return activeTodos;
				}
			}
		}
	}
	return activeTodos;
}