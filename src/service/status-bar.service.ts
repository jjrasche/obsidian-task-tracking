import { Task } from "model/task.model";
import { updateTaskFromClick } from "service/modify-task.service";

let _statusBar: HTMLElement;

export const set = (statusBar: HTMLElement) => _statusBar = statusBar;

// export const initializeStatusBar = () {
//     // create status bar
//     // pull active task and find corresponding sourceTask
//     const tds = await new TaskDataService(this.app, this.settings).setup();
//     const taskID = tds.getMostRecentID();
//     const tasks = new DataViewService(this.app).getManagedTasks()
//     const currentTask = tasks.find(task => task.taskID === taskID);
//     // initialize status bar
//     if (!!currentTask) {
//         const mts = await new ModifyTaskService(this.app, this.settings, undefined, this.statusBar).setup();
//         mts.modifyStatusBar(currentTask, Status.Active);
//     } else {
//         console.log("tried to set but currentTask was undefined")
//     }
//     /*
//     // getMostRecentDataTask
//     */
// }

export const modify = (task: Task) => {
    _statusBar?.firstChild?.remove();   // wipe previous html
    const ele = _statusBar?.createEl("span", { text: task.toString()});
    ele.onclick = () => {
        updateTaskFromClick(task.id);
        modify(task);
    }
}