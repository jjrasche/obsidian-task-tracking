export enum Status {
	active = "A",		// this task is currently being worked on 
	inactive = "I",		// the task is not currently being worked on and is not finished
	paused = "P",		// the task in not currently being worked on, but can be resumed by unpausing
	complete = "C"		// the task is finished
}