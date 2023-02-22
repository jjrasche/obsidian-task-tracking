import { Pos } from "obsidian";
import { STask } from "obsidian-dataview";
import { Event } from "./event";
import { Status, StatusIndicator, StatusWord } from "./status";
import { ViewData } from "./view-data.model";
import * as date from 'service/date.service';
import * as log from 'service/logging.service';
import { Observable } from "rxjs";
import { number } from "prop-types";


export class Task {
	// task data properties
	id: number;
	events: Event[] = [];
	status?: Status;
	// task source properties
	sourceID: number
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
	timeSpent = 0;
	timeSpentToday = 0;
	timeSpentThisSprint = 0;


	constructor(stask: STask) {
		Object.keys(stask).forEach(key => (this as any)[key] = stask[key]);
		this.text = this.text.trim();
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
		return `sourceId:${this.sourceID}, dataID:${this.id}, text:${this.text}, events:${this.events.length}, file:${this.path}, line:${this.line}, dirty:${this.dirty}, saved:${this.saved}`;
	}

	get viewText(): string {
		let textWords = this.text.split(/\s/);
		// while(textWords?.last()?.contains("#")) { 
		// 	textWords.pop();
		// }
		textWords = textWords?.map(w => w.replace("#", ""));
		return textWords?.join(" ");
	}

	getTimes(day: Date = new Date()): ({ timeSpent: number, timeSpentToday: number, timeSpentThisSprint: number}) {
		let timeSpent = 0, timeSpentToday = 0, timeSpentThisSprint = 0; 
		this.events.forEach((event, idx) => {
			if (event.status === Status.Active) {
				const next = this.events[idx+1] ?? {time: date.now()};
				timeSpent += (next.time.getTime() - event.time.getTime()) / 1000;
				if (date.sameDay(event.time, day) || date.sameDay(next.time, day)) {
					const startOfDay = new Date(day);
					startOfDay.setHours(0,0,0,0);
					timeSpentToday += (
						(date.sameDay(next.time, day) ?  next.time.getTime() : date.now().getTime()) -
						(date.sameDay(event.time, day) ?  event.time.getTime() : startOfDay.getTime())
						) / 1000;
				}
				if (date.inSprint(event.time) || date.inSprint(next.time)) {
					const startOfDay = new Date(day);
					startOfDay.setHours(0,0,0,0);
					timeSpentThisSprint += (
						(date.inSprint(next.time) ?  next.time.getTime() : date.now().getTime()) -
						(date.inSprint(event.time) ?  event.time.getTime() : startOfDay.getTime())
						) / 1000;
				}
			}
		}, 0);

		return { timeSpent, timeSpentToday, timeSpentThisSprint };
	}
	// -- how are active to inactive to complete situations handled
	toView(day: Date): ViewData {
		let {timeSpent, timeSpentToday, timeSpentThisSprint} = this.getTimes(day);
		const first = this.events[0];
		const last = this.events[this.events.length - 1];
		return {
			id: this.id,
			status: this.status,
			text: this.viewText,
			start: first?.time,
			lastActive: this.lastActive,
			timeSpent,
			timeSpentToday,
			timeSpentThisSprint,
			timeToClose: (!!last && last.status === Status.Complete) ? ((last.time.getTime() - first.time.getTime()) / 1000) : undefined,
			numSwitches: this.events.filter(event => event.status === Status.Active).length,
			fileName: this.path,
			tags: this.tags,
			line: this.line,
			events: this.events
		}
	}

	setEvents(events: Event[]) {
		this.events = events;
		this.setLastActive();
		({ timeSpent: this.timeSpent, timeSpentToday: this.timeSpentToday, timeSpentThisSprint: this.timeSpentThisSprint } = this.getTimes(new Date()));
	}
	addEvent(event: Event) {
		this.events.push(event);
		this.setLastActive();
	}
	setLastActive() {
		const activeEventTimes = this.events.filter(s => s.status === Status.Active).map(event => event.time.getTime());
		this.lastActive = activeEventTimes.length === 0 ? date.min : date.from(Math.max(...activeEventTimes));
	}
	
	async setStatus(status: Status) { 
		if (this.status === status) return;	// do not add the same status as current status
		const time = date.now();
		await log.toConsoleAndFile(`changing status of task ${this.toLog()}\t\t${this.status !== undefined ? StatusWord[this.status] : "<blank>"} -> ${StatusWord[status]}`);
		this.addEvent({ time, status });
		this.status = status;
		this.dirty = true;
	}
}

export const getTaskTextID = (line: string): number => {
    const idMatch = line.match(/id:[0-9]+$/g);
    const id = ((idMatch ?? [""])[0].match(/[0-9]+/) ?? [])[0];
	// if (id == undefined) {
	// 	throw new Error(`source id is null in task with text ${line}`);
	// }
    return parseInt(id);
}

export const getTaskText = (line: string): string => {
	const text = line.split("id:")[0]?.trim();
	return text;
}