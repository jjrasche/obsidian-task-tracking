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
import { Event } from 'model/event';

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
        task.events.forEach(event => {
            if (event.time > mostRecentTime) {
                mostRecentTask = task;
                mostRecentTime = event.time;
            }
        });
    });
    return mostRecentTask;
}
export const getViewData = async (day = new Date(), filter ?: TaskFilter): Promise<ViewData[]> => {
    return (await get(filter)).map(task => task.toView(day));
}
export const getEvents = async (day = new Date(), filter ?: TaskFilter): Promise<Event[]> => {
    return (await get(filter)).reduce((acc: Event[], task) => acc.concat(task.events.map()), []);
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
    // check for duplicates
    const sourcesText = source.map(s => s.text);
    const dupSources = sourcesText.filter((text, index) => sourcesText.indexOf(text) != index);
    if (dupSources.length != 0) {
        log.toConsoleAndFile(`duplicate source tasks found: [${dupSources.join(", ")}]`);
    }
    // check that source and data counts match
    log.toConsoleAndFile(`refreshTasks:\tdata: #tasks:${Object.keys(data).length} #events:${Object.keys(data).map((id: string) => data[parseInt(id)]).reduce((acc, cur) => acc + cur.events.length, 0)}\tsource: #tasks:${source.length}`);
    if (Object.keys(data).length != source.length) {
        // const sourceTaskText = source.map(s => new Task(s)).sort((a, b) => a.sourceID - b.sourceID).map(s => {
        //     const text = s.text.replaceAll(/'/g, "").replaceAll(/"/g, "").replaceAll(/`/g, "").replaceAll(/\[\[/g, "").replaceAll(/]]/g, "");
        //     if (s.text.contains("`")) {
        //         // debugger;
        //     }
        //     return `'${text} id:${s.sourceID}'`
        // }).join(", ");

        // log.toConsoleAndFile(`{data:[${data.map(d => d.id)}], source:[${sourceTaskText}`);
        // data without source task
        const sourceIDs = source.map(s => new Task(s).sourceID);
        const dataIDsWithNoSource = data.map(d => d.id).filter(id => !sourceIDs.includes(id));
        if (dataIDsWithNoSource.length != 0) {
            log.errorToConsoleAndFile(`data has no source\n[${dataIDsWithNoSource.join(", ")}]`);
        }
        const dataIDs = data.map(d => d.id);
        const sourceIDsWithoutData = sourceIDs.filter(id => !dataIDs.includes(id));
        if (sourceIDsWithoutData.length != 0) {
            log.errorToConsoleAndFile(`source has no data\n[${sourceIDsWithoutData.join(", ")}]`);
        }
        let idMap: {[key: number]: number} = {};
        sourceIDs.forEach(id => {
            if (idMap[id] !== undefined) {
                idMap[id] = idMap[id] + 1;
            } else {
                idMap[id] = 1;
            }
        });
        const duplicateSourceIDs = Object.keys(idMap).filter(id => idMap[parseInt(id)] > 1);
        if (duplicateSourceIDs.length != 0) {
            log.errorToConsoleAndFile(`source has duplicate ids\n[${duplicateSourceIDs.join(", ")}]`);
        }

    }
    let tasks = source.map(sourceTask => new Task(sourceTask))
    tasks = tasks.map(task => {
        const matchingDataTask = data.find(dataTask => dataTask.id === task.sourceID);
        if (!!matchingDataTask) {
            task.id = matchingDataTask?.id;
            task.setEvents(matchingDataTask.events);
            task.status = task.events.last()?.status;
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
    const mostRecentEvent = task.events[task.events.length - 1];
    if (!!mostRecentEvent) {
        if (mostRecentEvent.status === Status.Active) {
            return true;
        }
    }
    return false;
}

