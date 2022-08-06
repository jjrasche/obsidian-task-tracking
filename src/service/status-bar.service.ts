import { Task } from "model/task.model";
import { updateTaskFromClick } from "service/modify-task.service";
import * as tasks from 'state/tasks.state';

let _statusBar: HTMLElement;

export const set = (statusBar: HTMLElement) => _statusBar = statusBar;

export const initialize = async () => {
    const mostRecentTask = await tasks.getMostRecent();
    if (!!mostRecentTask) {
        modify(mostRecentTask);
    }
}

export const modify = (task: Task) => {
    _statusBar?.firstChild?.remove();   // wipe previous html
    const ele = _statusBar?.createEl("span", { text: task.toString()});
    console.log("updated status bar");
    ele.onclick = () => {
        updateTaskFromClick(task.id);
        modify(task);
    }
}