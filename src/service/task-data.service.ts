import { Session } from "../model/session";
import * as file from 'service/file.service';
import * as settings from 'state/settings.state';
import { Task } from "model/task.model";

export type TaskDataType = {[key: string]: Session[]};
export type TaskData = {id: number, sessions: Session[]};
let _taskData: TaskDataType | undefined;
// todo: pull from settings

export const get = async (): Promise<TaskDataType> => {
    if (!!_taskData) {
        return _taskData;
    }
    const fileContent = await file.read(settings.get().taskDataFileName);
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
    reset();
    let taskData: TaskDataType = {};
    tasks.forEach(task => {
        if (!task.id) {
            throw new Error(`was about to save an undefined task ID`);
        }
        taskData[task.id] = task.sessions
    });
    const dataString = JSON.stringify(taskData);
    await file.write(settings.get().taskDataFileName, dataString);
}