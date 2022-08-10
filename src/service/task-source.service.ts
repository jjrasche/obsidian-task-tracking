import { DataviewApi, STask } from "obsidian-dataview";
import { EditorPosition } from 'obsidian';
import { Task } from 'model/task.model';
import * as dv from 'service/data-view.service';
import * as file from "service/file.service";
import * as poll from 'service/poll.service';

// todo: there is a race condition here where dataview does not yet have access to a newly created task
export const get = (): STask[] => {
    return dv.allManagedTasks();
}
export const getByCursor = (path: string = "", cursor: EditorPosition): STask => {
    const taskAtCursor = dv.allTasks().find(t => t.path == path && t.line == cursor.line);
    if (!taskAtCursor) {
        throw new Error(`couldn't find task from file:'${path}' on line:'${cursor.line}'`);
    }
    return taskAtCursor;
}
// save all dirty Task Source
// optimization: can group changes by file to minimize.
export const save = async (tasks: Task[]) => {
    const dirtyTasks = tasks.filter(task => task.dirty && !task.error);
    let waitingOnNewTasks = [];
    for(const task of dirtyTasks) {
        let originalContent = await file.read(task.path);
        const lines = originalContent.split("\n")
        lines[task.line] = task.toString();
        const updatedContent = lines.join("\n");
        await file.write(task.path, updatedContent);
        console.log(`saved task ${task.id} in file ${task.path}`);
        // wait till data view has pulled this task
        if (task.saved === false) {
            waitingOnNewTasks.push(task.id);
            task.saved = true;
        }
        // await poll.run(() => dv.taskInDv(task.id), () => {}, 10, 2000);
        task.dirty = false;
    };
    await Promise.all(waitingOnNewTasks.map(id => poll.run(() => dv.taskInDv(id), () => {}, 500, 2000))).catch((e) => console.log(e));
    console.log("1");
}

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
