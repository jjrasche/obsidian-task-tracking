import { Session } from "../model/session";
import * as file from 'service/file.service';
import * as settings from 'state/settings.state';
import * as log from 'service/logging.service';
import { Task } from "model/task.model";

export type TaskDataType = {[key: string]: Session[]};
export type TaskData = {id: number, sessions: Session[]};
let _taskData: TaskDataType | undefined;

export const get = async (): Promise<TaskDataType> => {
    if (!!_taskData) {
        return _taskData;
    }
    let fileContent = "{}";
    try {
        fileContent = await file.read(settings.get().taskDataFileName);
    } catch(e) {
        await file.write(settings.get().taskDataFileName, fileContent);
    }
    const newData: TaskDataType = JSON.parse(fileContent);
    Object.keys(newData).forEach(id => newData[id].forEach(session => session.time = new Date(session.time)))
    _taskData = newData;
    return newData;
}
export const reset = () => _taskData = undefined;

export const getArray = async (): Promise<TaskData[]> => {
    const taskData = await get();
    return Object.keys(taskData).map(key => ({id: parseInt(key), sessions: taskData[key]}));
}
export const save = async (tasks: Task[]) => {
    let taskData: TaskDataType = {};
    console.log(`saved task data ${tasks.length}`);
    tasks.forEach(task => {
        if (!task.id) {
            log.errorToConsoleAndFile(`was about to save an undefined task:${task.toLog()}`, true);
            return;
        }
        taskData[task.id] = task.sessions
    });
    // check to not delete task data key
    reset()
    const currentData = await get();
    const currentIds = Object.keys(currentData).map(id => parseInt(id));
    const taskIds = new Set(tasks.map(task => task.id));
    const idsToDelete = currentIds.filter(id => !taskIds.has(id));
    if (idsToDelete.length !== 0) {
        log.errorToConsoleAndFile(`was about to delete ${idsToDelete}`, true);
    }
    // save
    const dataString = JSON.stringify(taskData);
    await file.write(settings.get().taskDataFileName, dataString);
    reset();
}