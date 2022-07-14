export enum Status {
	Active,		// this task is currently being worked on 
	Inactive,	// the task is not currently being worked on and is not finished
	Paused,		// the task in not currently being worked on, but can be resumed by unpausing
	Complete,	// the task is finished
}

export const StatusIndicator: { [key in Status]: string } = {
	[Status.Active]: "A",
	[Status.Inactive]: "I",
	[Status.Paused]: "P",
	[Status.Complete]: "C"
}

export const StatusWord: { [key in Status]: string } = {
	[Status.Active]: "Active",
	[Status.Inactive]: "Inactive",
	[Status.Paused]: "Paused",
	[Status.Complete]: "Complete"
}