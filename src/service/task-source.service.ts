import * as dv from 'service/data-view.service';
import { STask } from "obsidian-dataview";
import { EditorPosition } from 'obsidian';
import { Task } from 'model/task.model';
import * as file from "service/file.service";

export const get = (): STask[] => {
    return allTasks().filter(t => t.text.contains("id:"));
}
export const getByCursor = (path: string = "", cursor: EditorPosition): STask => {
    const taskAtCursor = allTasks().find(t => t.path == path && t.line == cursor.line);
    if (!taskAtCursor) {
        throw new Error(`couldn't find task from file:'${path}' on line:'${cursor.line}'`);
    }
    return taskAtCursor;
}
// save all dirty Task Source
// optimization: can group changes by file to minimize.
export const save = async (tasks: Task[]) => {
    const dirtyTasks = tasks.filter(task => task.dirty);
    for(const task of dirtyTasks) {
        let originalContent = await file.readByPath(task.path);
        const lines = originalContent.split("\n")
        lines[task.line] = task.toString();
        const updatedContent = lines.join("\n");
        file.write(task.path, updatedContent);
    };
}


const allTasks = (): STask[] => dv.api().pages().file.tasks as STask[];