/*
	A session describes a period of time spent on a todo
*/
export class Session {
	time: Date;
	status: SessionStatus
}

export enum SessionStatus {
	active,		// this task is currently being worked on 
	inactive,	// the task is not currently being worked on and is not finished
	paused,		// the task in not currently being worked on, but can be resumed by unpausing
	complete	// the task is finished
}

export type ActivityData = {[key: number]: Session[]}[];