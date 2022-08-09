import { Status } from "./status";

export class ViewData {
	id: number;
	status?: Status;
	text?: string;
	start: Date;
	lastActive?: Date;
	timeSpent?: number;	// in seconds
	timeToClose?: number;	// in seconds
	numSwitches: number;
	fileName?: string;
	tags: string[];
	line: number;
};