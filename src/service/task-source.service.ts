import { STask } from "obsidian-dataview";
import { EditorPosition } from 'obsidian';
import { Task } from 'model/task.model';
import * as dv from 'service/data-view.service';
import * as file from "service/file.service";
import * as wait from 'service/wait.service';
import * as log from 'service/logging.service';

export const get = (): STask[] => dv.allManagedTasks();

export const getByCursor = (path: string = "", cursor: EditorPosition): STask => {
    const taskAtCursor = dv.allTasks().find(t => t.path == path && t.line == cursor.line);
    if (!taskAtCursor) {
        throw new Error(`couldn't find task from file:'${path}' on line:'${cursor.line}'`);
    }
    return taskAtCursor;
}

// optimization: can group changes by file to minimize.
export const save = async (tasks: Task[]) => {
    const dirtyTasks = tasks.filter(task => task.dirty && !task.error);
    let sourceUpdateWaits: Promise<void>[] = [];
    for(const task of dirtyTasks) {
        // update the text of the task when status is changed or an id is set
        let originalContent = await file.read(task.path);
        const lines = originalContent.split("\n")
        const originalLine = lines[task.line];
        const newLine = task.toString();
        lines[task.line] = newLine
        const updatedContent = lines.join("\n");
        await file.write(task.path, updatedContent);
        // mark task and wait for dataview to update its task list to prevent race conditions of altering source prior to task objects updating
        task.dirty = false;
        task.saved = true;
        sourceUpdateWaits.push(wait.until(() => dv.taskInDv(task.id), () => {}, 500));
        await log.toConsoleAndFile(`updated task source: ${task.toLog()}\tfrom:'${originalLine}'\tupdated:${newLine}`);
    };
    await Promise.all(sourceUpdateWaits);
}

// use to wipe out all managed tasks in source files
export const nukeAllIdsOnSourceTasks = async () => {
    const tasks = get().map(st => { 
        let task = new Task(st)
        task.status = undefined;
        return task;
    });
    for(const task of tasks) {
        if (!!task.sourceID) {
            let originalContent = await file.read(task.path);
            const lines = originalContent.split("\n")
            lines[task.line] = task.toString(false);
            console.log(lines[task.line]);
            const updatedContent = lines.join("\n");
            file.write(task.path, updatedContent);
        }
    }
}


// export const setAllTasksGetter = (method: () => STask[]) => allTasks = method;
