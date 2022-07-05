import { FileService } from "file.service";
import { App } from "obsidian";
import { Settings } from "Settings";
import { Session } from "./session";
import { SessionStatus } from "./session-status";
import { TaskLine } from "./taskline";

export type TaskDataType = {[key: string]: Session[]};
export class TaskData {
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

    getActiveTaks(): TaskLine[] {
        const activeTaskIDs = this.getAllActiveTaskIDs();
        // this.file.find
        return [];
    }
    
    addSession(status: SessionStatus, taskID?: number) {
        if (!taskID) {
            return;
        }
        const session = {time: new Date(), status} as Session;
        // do not add the same status as current status
        if (!!this.data[taskID] && this.data[taskID].last()?.status === status) {
            return;
        }
        if (!this.settings.onlyOneTaskActive && status === SessionStatus.active) {
            this.inactivateAllActiveTasks();
        }
        if (!this.data[taskID]) {
            if (status !== SessionStatus.active) {
                throw Error("should only be allowed to ad a new task to data via an activation change.");
            }
            this.data[taskID] = [session];
        } else {
            this.data[taskID].push(session);
        }
    }

    // todo: test this when enablign onlyOntTaskActive functionality
    inactivateAllActiveTasks() {
        const activeTaskIds = this.getAllActiveTaskIDs();
        activeTaskIds.forEach(id => this.addSession(SessionStatus.inactive, id))
    }
    
    async save() {
        const dataString = JSON.stringify(this.data);
        // todo: test if all 3 steps are needed to ave
        const file = await this.file.createOrFind(this.settings.taskDataFileName);
        await this.file.tryDelete(this.app, file);
        await this.app.vault.create(this.settings.taskDataFileName, dataString);
    }
    
    private getAllActiveTaskIDs(): number[] {
        let activeTasks = [];
        const taskKeys = Object.keys(this.data);
        for (var i = 0; i < taskKeys.length; i++) {
            const taskID = parseInt(taskKeys[i]);
            const sessions = this.data[taskID];
            const mostRecentSession = sessions[sessions.length - 1];
            if (!!mostRecentSession) {
                if (mostRecentSession.status == SessionStatus.active) {
                    activeTasks.push(taskID);
                    // short circuit if you know only 1 task should be active and it was found
                    if (this.settings.onlyOneTaskActive) {
                        return activeTasks;
                    }
                }
            }
        }
        return activeTasks;
    }

}
