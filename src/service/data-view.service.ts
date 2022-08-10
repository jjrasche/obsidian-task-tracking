import { getTaskTextID } from "model/task.model";
import { DataviewApi, getAPI, STask } from "obsidian-dataview";
import * as app from 'state/app.state';

let _api: DataviewApi;

export const api = (): DataviewApi => {
    if (!_api) {
        _api = getAPI(app.get()) as DataviewApi;
    }
    return _api;
}

export const ready = (): boolean => !!api() && !!api().pages() && api().pages().length > 0;
export const allTasks: () => STask[] = () => api().pages().file.tasks as STask[];
export const allManagedTasks: () => STask[] = () => allTasks().filter(t => t.text.contains("id:"));



// export const taskInDv = (id: number | undefined): boolean => ready() && !!allTasks().find(t => getTaskTextID(t.text) === id);

export const taskInDv = (id: number | undefined): boolean => {
    const r = ready()
    const tasks = allManagedTasks();
    const task = tasks.find(t => getTaskTextID(t.text) === id);
    const ret = r && !!task
    console.log(`taskInDv - id:${id}  task:${task?.text}  numTasks:${tasks.length}    ret:${ret}`);
    return ret;
}