import { Status } from "model/status"
import { getTaskTextID, Task } from "model/task.model";
import { Editor, EditorPosition } from "obsidian"
import * as app from 'state/app.state';
import * as settings from 'state/settings.state';
import * as tasks from 'state/tasks.state';
import * as taskSource from 'service/task-source.service';
import * as statusBar from 'service/status-bar.service';

export const updateTaskFromEditor = async (editor: Editor, status: Status) => {
    const cursor = editor.getCursor();
    if (!cursor) return; // didn't find an acitve cursor 
    const line = editor.getLine(cursor.line);
    if (!line) return; // no active cursor
    if (!isTask(line)) return; // line is not a task

    const task = await createNewTaskIfNeeded(cursor, line);
    await changeTaskStatus(task, status);
}

export const updateTaskFromClick = async (id: number)  => {
    // when I don't call await on the caller, does this await work 
    const task = await tasks.find(id);
    console.log(!!task.id ? "caller not awaiting waits insied" : "need to await on the calling function");
    const newStatus = task.status === Status.Active ? Status.Inactive : Status.Active;
    changeTaskStatus(task, newStatus);
}

export const changeTaskStatus = async (task: Task, status: Status) => {
    if (task.sessions.last()?.status === status) return; // do not add the same status as current status
    if (settings.get().onlyOneTaskActive && status === Status.Active) {
        inactivateAllActiveTasks();
    }
    task.setStatus(status);
    await tasks.persist();
    await statusBar.modify(task) // test if you need to wait for the persist.
}

export const inactivateAllActiveTasks = async () => {
    const activeTasks = await tasks.get(tasks.isActive);
    for (const task of activeTasks) {
        task.setStatus(Status.Inactive);
    }
}


const isTask = (line: string): boolean => !!line.match(/^\t*- \[.{1}\]\s/g);

const createNewTaskIfNeeded = async (cursor: EditorPosition, line: string): Promise<Task> => {
    const file = app.get().workspace.getActiveFile();
    const sourceTaskID = getTaskTextID(line);
    if (!sourceTaskID) {
        const sourceTask = taskSource.getByCursor(file?.path, cursor);
        const newTask = new Task(sourceTask);
        newTask.id = await tasks.getNextID();
        await tasks.add(newTask);
        return newTask;
    }
    return await tasks.find(sourceTaskID);
} 
