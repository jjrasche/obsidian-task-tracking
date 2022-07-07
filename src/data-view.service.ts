import { ManagedTask } from "model/activity-task";
import { App } from "obsidian";
import { DataviewApi, getAPI, STask } from "obsidian-dataview";

export class DataViewService {

    constructor(private app: App) { }
    /*
        path, line, status, text
    */
    getManagedTasks(): ManagedTask[] {
        const tasks = this.getAllTasks()
            .filter(t => t.text.contains("id:"))    // filter for tasks with an ID
            .map(task => new ManagedTask(task, app.vault));
        return tasks;
    }

    private getAllTasks(): STask[] {
        app.workspace.containerEl
        const dv = getAPI(this.app) as DataviewApi;
        return dv.pages().file.tasks;
    }

}
