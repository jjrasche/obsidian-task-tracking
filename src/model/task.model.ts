import {  } from "service/file.service";
import { Pos } from "obsidian";
import { STask } from "obsidian-dataview";
import { Session } from "./session";
import { Status, StatusIndicator } from "./status";
import { ViewData } from "./view-data.model";
import * as date from 'service/date.service';

export class Task {
	// task data properties
	id: number;
	sessions: Session[] = [];
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
	dirty = false;

	constructor(stask: STask) {
		Object.keys(stask).forEach(key => (this as any)[key] = stask[key]);
		// todo: set status
		this.sourceID = getTaskTextID(this.text);
		this.text = getTaskText(this.text);
	}
	
	public toString(): string {
		const tabs = [...Array(this.position.start.col)].reduce((acc) => acc += "\t", "");
		return `${tabs}${this.symbol} [${this.status === undefined ? ' ' : StatusIndicator[this.status]}] ${this.text?.trim()} id:${this.id}`;
	}

	get viewText(): string {
		let textWords = this.text.split(/\s/);
		while(textWords?.last()?.contains("#")) {
			textWords.pop();
		}
		textWords = textWords?.map(w => w.replace("#", ""));
		return textWords?.join(" ");
	}

	// todo: breakout
	toView(): ViewData {
		const timeSpent = this.sessions.reduce((acc, cur, idx) => {
			if (cur.status === Status.Active) {
				const next = this.sessions[idx+1] ?? {time: date.now()};
				const currentSessionLength = (next.time.getTime() - cur.time.getTime())/1000;
				return acc + currentSessionLength;
			}
			return acc;
		}, 0);
		const first = this.sessions[0];
		const last = this.sessions[this.sessions.length - 1];
		return {
			id: this.id,
			status: this.status,
			text: this.viewText,
			start: first.time,
			lastActive: date.from(Math.max(...this.sessions.filter(s => s.status === Status.Active).map(session => session.time.getTime()))),
			timeSpent,
			timeToClose: (!!last && last.status === Status.Complete) ? ((last.time.getTime() - first.time.getTime()) / 1000) : undefined,
			numSwitches: this.sessions.filter(session => session.status === Status.Active).length,
			fileName: this.path,
			tags: this.tags,
			line: this.line
		}
	}
	
	setStatus(status: Status) {
		if (this.status === status) return;	// do not add the same status as current status
		this.sessions.push({ time: date.now(), status });
		this.status = status;
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