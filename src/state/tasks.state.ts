import { Status } from 'model/status';
import { Task } from 'model/task.model';
import { ViewData } from 'model/view-data.model';
import { BehaviorSubject, Observable } from 'rxjs';
import * as taskData from 'service/task-data.service';
import * as taskSource from 'service/task-source.service';

let _tasks = new BehaviorSubject<Task[] | undefined>(undefined);

export const add = async (task: Task) => {
    const tasks = await initialize();
    tasks.push(task);
}

export const find = async (id: number): Promise<Task> => {
    const tasks = await initialize();
    const task = tasks.find(task => task.id === id);
    if (!task) {
        throw new Error(`could not find task with id:'${id}'`);
    }
    return task;
}
export const set = (tasks: Task[] | undefined) => _tasks.next(tasks);
export const getChangeListener = (): Observable<Task[] | undefined> => _tasks.asObservable();
export const get = async (filter ?: TaskFilter): Promise<Task[]> => {
    const tasks = await initialize();
    return !!filter ? tasks.filter(task => filter(task)) : tasks;
}
export const getMostRecent = async (): Promise<Task | undefined> => {
    const tasks = await initialize();
    let mostRecentTask: Task | undefined;
    let mostRecentTime = new Date(0);
    tasks.forEach(task => {
        task.sessions.forEach(session => {
            if (session.time > mostRecentTime) {
                mostRecentTask = task;
                mostRecentTime = session.time;
            }
        });
    });
    return mostRecentTask;
}
export const getViewData = async (filter ?: TaskFilter): Promise<ViewData[]> => {
    return (await get(filter)).map(task => task.toView());
}

export const persist = async () => {
    // need ot refresh 
    const tasks = await refreshTaskSource(); 
    // todo: consider not awaiting 
    await taskSource.save(tasks);
    await taskData.save(tasks);
    await refreshTasks();  // do a refresh here so we are not waiting when this data is needed 
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
const refreshTasks = async (): Promise<Task[]> => {
    const data = await taskData.getArray();
    const source = taskSource.get();
    const tasks = source.map(sourceTask => {
        const newTask = new Task(sourceTask);
        const matchingDataTask = data.find(dataTask => dataTask.id === newTask.sourceID);
        if (!!matchingDataTask) {
            newTask.id = matchingDataTask?.id;
            newTask.sessions = matchingDataTask.sessions;
            newTask.status = newTask.sessions.last()?.status;
        }
        return newTask;
    });
    set([...tasks]);
    return [...tasks]
}

// need to update the line the source task is on in case the location on file has changed
// pull source data and update certain properties on _task
const refreshTaskSource = async () => {
    const sourceTasks = taskSource.get().map(source => new Task(source));
    let tasks = await get();
    tasks.filter(t => t.dirty && t.saved).forEach(task => {
        const match = sourceTasks.find(st => st.sourceID === task.id);
        if (!!match) {
            task.line = match.line;
        } else {
            task.error = true;
            console.error(`source for task:${task.id} cannot be found in file ${task.path}`);
        }
    });
    set([...tasks]);
    return [...tasks]
}

const initialize = async (): Promise<Task[]> => {
    if (!_tasks.value) {
        return await refreshTasks();
    }
    return _tasks.value;
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

