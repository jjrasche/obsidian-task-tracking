import { access } from 'fs';
import { Status } from 'model/status';
import { Task } from 'model/task.model';
import { ViewData } from 'model/view-data.model';
import { EventRef, TAbstractFile, TFile } from 'obsidian';
import { BehaviorSubject, Observable } from 'rxjs';
import * as taskData from 'service/task-data.service';
import * as taskSource from 'service/task-source.service';
import * as app from 'state/app.state';
import * as settings from 'state/settings.state';
import * as log from 'service/logging.service';

let _fileListener: EventRef;
let _tasks = new BehaviorSubject<Task[] | undefined>(undefined);

export const add = async (task: Task) => {
    const existingTasks = await initialize();
    const tasks = [...existingTasks, task];
    await set(tasks);
}

export const find = async (id: number): Promise<Task> => {
    const tasks = await initialize();
    const task = tasks.find(task => task.id === id);
    if (!task) {
        const message = `could not find task with id:'${id}'`;
        log.errorToConsoleAndFile(message);
        throw new Error(message);
    }
    return task;
}
export const set = async(tasks: Task[]) => {
    _tasks.next(tasks);
    await setupFileChangeListener(tasks);
}
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
    const tasks = await refreshTaskSource(); 
    await taskSource.save(tasks);
    await taskData.save(tasks);
    await refreshTasks();  // do a refresh here so we are not waiting when this data is needed 
}

export const getNextID = async (): Promise<number> => {
    const tasks = await get();
    const taskIDs = tasks.map(task => task.id).sort((a,b) => b - a)
    return taskIDs.length === 0 ? 1 : taskIDs[0] + 1;
}

const setupFileChangeListener = async (tasks: Task[]) => {
    const taskFiles = new Set([...tasks.map((task) => task.path), settings.get().taskDataFileName]);
    if (!!_fileListener) {
        app.get().metadataCache.offref(_fileListener);
    }

    _fileListener = app.get().metadataCache.on("changed", async (file: TFile) => {
        if (taskFiles.has(file.path)) {
            await new Promise(r => setTimeout(r, 1000)); // wait for change to propigate through obsidian data
            taskData.reset();
            refreshTasks();
        }
    });
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
    log.toConsoleAndFile(`refreshTasks:\tdata: #tasks:${Object.keys(data).length} #sessions:${Object.keys(data).map((id: string) => data[parseInt(id)]).reduce((acc, cur) => acc + cur.sessions.length, 0)}\tsource: #tasks:${source.length}`);
    if (Object.keys(data).length != source.length) {
        log.toConsoleAndFile(`{data:[${Object.keys(data)}], source:[${source.map(s => s.text).join(", ")}]}`);
    }
    const tasks = source.map(sourceTask => {
        const task = new Task(sourceTask);
        const matchingDataTask = data.find(dataTask => dataTask.id === task.sourceID);
        if (!!matchingDataTask) {
            task.id = matchingDataTask?.id;
            task.setSessions(matchingDataTask.sessions);
            task.status = task.sessions.last()?.status;
        } else {
            // sources without data
            log.errorToConsoleAndFile(`source task has no data\t${task.toLog()}`);
        }
        return task;
    });
    await set([...tasks]);
    return [...tasks]
}

// need to update the line the source task is on in case the location on file has changed
// pull source data and update certain properties on _task
const refreshTaskSource = async () => {
    const sourceTasks = taskSource.get().map(source => new Task(source));
    let tasks = await get();
    // testing
    for (const task of tasks) {
        const match = sourceTasks.find(st => st.sourceID === task.id);
        if (match?.text != task.text) {
            await log.toConsoleAndFile(`refreshTaskSource[${(task.dirty && task.saved) ? 'dirty' : 'clean'}]:task state:'${task.text}' is different than source:'${match?.text}'\t\tfor:${task.toLog()}`);
        }
    }

    tasks.filter(t => t.dirty && t.saved).forEach(task => {
        const match = sourceTasks.find(st => st.sourceID === task.id);
        if (!!match) {
            task.line = match.line;
        } else {
            // persist is called after ever trigger, so this should only happen when a task is changed then deleted. 
            task.error = true;
            log.errorToConsoleAndFile(`source was deleted for task:${task.toLog()}\t\tcannot be found at file:${task.path}, line:${task.line}`);
        }
    });
    await set([...tasks]);
    return [...tasks]
}

const initialize = async (): Promise<Task[]> => {
    if (!_tasks.value) {
        await log.toConsoleAndFile('initializing');
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

