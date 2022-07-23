import { Status } from 'model/status';
import { Task } from 'model/task.model';
import * as taskData from 'service/task-data.service';
import * as taskSource from 'service/task-source.service';

let _tasks: Task[];

export const add = async (task: Task) => {
    await initialize();
    _tasks.push(task);
}

export const find = async (id: number): Promise<Task> => {
    await initialize();
    const task = _tasks.find(task => task.id === id);
    debugger; 
    if (!task) {
        throw new Error(`could not find task with id:'${id}'`);
    }
    return task;
}

export const get = async (filter ?: TaskFilter): Promise<Task[]> => {
    await initialize();
    return !!filter ? _tasks.filter(task => filter(task)) : _tasks;
}
export const set = (tasks: Task[]) => _tasks = tasks;

export const persist = async () => {
    const tasks = await get();
    // todo: consider not awaiting 
    await taskSource.save(tasks);
    await taskData.save(tasks);
    await refreshTasks();
}

export const getNextID = async (): Promise<number> => {
    const tasks = await get();
    const taskIDs = tasks.map(task => task.id).sort((a,b) => b - a)
    return taskIDs.length === 0 ? 1 : taskIDs[0] + 1;
}

/*
    create task objcet from task source and task data
    scenarios
    - data with no source
    - source with no data
*/
const refreshTasks = async () => {
    const data = await taskData.getArray();
    const source = taskSource.get();
    const tasks = source.map(sourceTask => {
        const newTask = new Task(sourceTask);
        const matchingDataTask = data.find(dataTask => dataTask.id === newTask.id);
        debugger;
        if (!!matchingDataTask) {
            newTask.id = matchingDataTask?.id;
            newTask.sessions = [];
            newTask.status = newTask.sessions.last()?.status;
        }
        return newTask;
    });
    set(tasks);
}

const initialize = async () => {
    if (!_tasks) {
        await refreshTasks();
    }
}

type TaskFilter = (task: Task) => boolean;

export const isActive: TaskFilter = (task: Task): boolean => {
    const mostRecentSession = task.sessions[task.sessions.length - 1];
    if (!!mostRecentSession) {
        if (mostRecentSession.status === Status.Active) {
            return true;
        }
    }
    return false;
}

