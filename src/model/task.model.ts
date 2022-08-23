import { Pos } from "obsidian";
import { STask } from "obsidian-dataview";
import { Session } from "./session";
import { Status, StatusIndicator, StatusWord } from "./status";
import { ViewData } from "./view-data.model";
import * as date from 'service/date.service';
import * as log from 'service/logging.service';
import { Observable } from "rxjs";


export class Task {
	// task data properties
	id: number;
	private _sessions: Session[] = [];
	status?: Status;
	// task source properties
	sourceID?: number
	symbol: string;
	path: string;
	line: number;
	position: Pos;
	text: string;
	tags: string[];
	// housekeeping
	fileChangeListener: Observable<void>;
	lastActive?: Date;
	dirty = false;
	error = false;
	saved = true;

	constructor(stask: STask) {
		Object.keys(stask).forEach(key => (this as any)[key] = stask[key]);
		this.sourceID = getTaskTextID(this.text);
		this.text = getTaskText(this.text);
	}
	
	public toString(addID: boolean = true): string {
		const tabs = [...Array(this.position.start.col)].reduce((acc) => acc += "\t", "");
		let ret = `${tabs}${this.symbol} [${this.status === undefined ? ' ' : StatusIndicator[this.status]}] ${this.text?.trim()}`;
		if (addID) {
			ret += ` id:${this.id}`;
		}
		return ret;
	}

	public toLog(): string {
		return `sourceId:${this.sourceID}, dataID:${this.id}, text:${this.text}, sessions:${this.sessions.length}, file:${this.path}, line:${this.line}, dirty:${this.dirty}, saved:${this.saved}`;
	}

	get viewText(): string {
		let textWords = this.text.split(/\s/);
		// while(textWords?.last()?.contains("#")) { 
		// 	textWords.pop();
		// }
		textWords = textWords?.map(w => w.replace("#", ""));
		return textWords?.join(" ");
	}

	toView(): ViewData {``
		let timeSpent = 0, timeSpentToday = 0;
		this._sessions.forEach((session, idx) => {
			if (session.status === Status.Active) {
				const next = this._sessions[idx+1] ?? {time: date.now()};
				timeSpent += (next.time.getTime() - session.time.getTime()) / 1000;
				if (date.isToday(session.time) || date.isToday(next.time)) {
					const startOfDay = (new Date())
					startOfDay.setHours(0,0,0,0);
					timeSpentToday += (
						(date.isToday(next.time) ?  next.time.getTime() : date.now().getTime()) -
						(date.isToday(session.time) ?  session.time.getTime() : startOfDay.getTime())
						) / 1000;
				}
			}
		}, 0);
		const first = this._sessions[0];
		const last = this._sessions[this._sessions.length - 1];
		return {
			id: this.id,
			status: this.status,
			text: this.viewText,
			start: first?.time,
			lastActive: this.lastActive,
			timeSpent,
			timeSpentToday,
			timeToClose: (!!last && last.status === Status.Complete) ? ((last.time.getTime() - first.time.getTime()) / 1000) : undefined,
			numSwitches: this._sessions.filter(session => session.status === Status.Active).length,
			fileName: this.path,
			tags: this.tags,
			line: this.line
		}
	}

	setSessions(sessions: Session[]) {
		this._sessions = sessions;
		this.setLastActive();
	}
	addSession(session: Session) {
		this._sessions.push(session);
		this.setLastActive();
	}
	setLastActive() {
		const activeSessionTimes = this._sessions.filter(s => s.status === Status.Active).map(session => session.time.getTime());
		this.lastActive = activeSessionTimes.length === 0 ? date.min : date.from(Math.max(...activeSessionTimes));
	}
	get sessions(): Session[] {
		return this._sessions;
	}
	
	async setStatus(status: Status) { 
		if (this.status === status) return;	// do not add the same status as current status
		const time = date.now();
		await log.toConsoleAndFile(`changing status of task ${this.toLog()}\t\t${this.status !== undefined ? StatusWord[this.status] : "<blank>"} -> ${StatusWord[status]}`);
		this.addSession({ time, status });
		this.status = status;
		this.dirty = true;
	}
}

export const getTaskTextID = (line: string): number | undefined => {
    const idMatch = line.match(/id:[0-9]+$/g);
    const id = ((idMatch ?? [""])[0].match(/[0-9]+/) ?? [])[0];
    return !!id ? parseInt(id) : undefined;
}

export const getTaskText = (line: string): string => {
	const text = line.split("id:")[0]?.trim();
	return text;
}