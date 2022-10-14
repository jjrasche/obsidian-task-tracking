import { Session } from "./session";
import { Status } from "./status";

export class ViewData {
	id: number;
	status?: Status;
	text?: string;
	start: Date;
	lastActive?: Date;
	timeSpent?: number;	// in seconds
	timeSpentToday?: number;	// in seconds
	timeSpentThisSprint?: number;
	timeToClose?: number;	// in seconds
	numSwitches: number;
	fileName?: string;
	tags: string[];
	line: number;
	sessions: Session[];
};