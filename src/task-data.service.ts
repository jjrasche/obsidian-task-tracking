import { FileService } from "file.service";
import { Status } from "model/status";
import { App } from "obsidian";
import { Settings } from "settings";
import { Session } from "./model/session";

export type TaskDataType = {[key: string]: Session[]};

export type TaskFilter = (taskID: number, sessions: Session[]) => boolean;

export const isActive: TaskFilter = (taskID: number, sessions: Session[]) => {
    const mostRecentSession = sessions[sessions.length - 1];
    if (!!mostRecentSession) {
        if (mostRecentSession.status === Status.Active) {
            return true;
        }
    }
    return false;
}

export class TaskDataService {
    data: TaskDataType;
    file: FileService;

    constructor(private app: App, private settings: Settings) {
        this.file = new FileService(app);
    }

    async setup(): Promise<this> {
        const file = await this.file.createOrFind(this.settings.taskDataFileName);
        const data = await this.file.read(file);
        this.data = JSON.parse(data);
        return this;
    }

    addSession(taskID: number, status: Status) {
        // do not add the same status as current status
        if (!!this.data[taskID] && this.data[taskID].last()?.status === status) {
            return;
        }
        const session = { time: new Date(), status };
        if (!this.data[taskID]) {
			if (status !== Status.Active) {
				throw Error("should only be allowed to ad a new task to data via an activation change.");
			}
			this.data[taskID] = [session];
		} else {
			this.data[taskID].push(session);
		}
    }

    async save() {
        const dataString = JSON.stringify(this.data);
        // todo: test if all 3 steps are needed to ave
        const file = await this.file.createOrFind(this.settings.taskDataFileName);
        await this.file.tryDelete(this.app, file);
        await this.app.vault.create(this.settings.taskDataFileName, dataString);
    }
    
    getTaskIDs(filter: TaskFilter): number[] {
        return Object.keys(this.data)
        .map(taskKey => parseInt(taskKey))
        .filter((taskID: number) => {
            const sessions = this.data[taskID];
            return filter(taskID, sessions);
        });
    }

}
