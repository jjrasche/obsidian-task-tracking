import { Session } from "../model/session";
import * as file from 'service/file.service';
import * as settings from 'state/settings.state';
import { Task } from "model/task.model";

export type TaskDataType = {[key: string]: Session[]};
export type TaskData = {id: number, sessions: Session[]};
let _taskData: TaskDataType;
// todo: pull from settings

export const get = async (): Promise<TaskDataType> => {
    if (!_taskData) {
        const fileContent = await file.readByPath(settings.get().taskDataFileName);
        _taskData = JSON.parse(fileContent);
    }
    return _taskData;
}
export const getArray = async (): Promise<TaskData[]> => {
    const taskData = await get();
    return Object.keys(taskData).map(key => ({id: parseInt(key), sessions: taskData[key]}));
}
export const save = async (tasks: Task[]) => {
    _taskData = {};
    tasks.forEach(task => _taskData[task.id] = task.sessions);
    const dataString = JSON.stringify(await get());
    await file.write(settings.get().taskDataFileName, dataString);
}