import { ObsidianFileService } from "obsidian-file.service";
import { Status } from "model/status";
import { App } from "obsidian";
import { Settings } from "settings";
import { Session } from "./model/session";
import { FileService } from "file.service";
import { ManagedTask } from "model/managed-task";

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
        this.file = new FileService();
    }

    async setup(): Promise<this> {
        const data = this.file.find(this.settings.taskDataFileName);
        this.data = JSON.parse(data);
        this.formatData();
        return this;
    }

    private formatData() {
        Object.keys(this.data).forEach(key =>
            this.data[key].forEach(session => session.time = new Date(session.time)));
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
        this.file.save("", dataString);
    }
    
    getTaskIDs(filter: TaskFilter): number[] {
        return Object.keys(this.data)
        .map(taskKey => parseInt(taskKey))
        .filter((taskID: number) => {
            const sessions = this.data[taskID];
            return filter(taskID, sessions);
        });
    }

    getMostRecentID(): number | undefined {
        let mostRecentID = "";
        let mostRecentTime: Date = new Date(0);
        Object.keys(this.data).forEach(id => {
            this.data[id].forEach(session => {
                if (session.time > mostRecentTime) {
                    mostRecentTime = session.time;
                    mostRecentID = id;
                }
            });
        });
        return parseInt(mostRecentID); 
    }
}
