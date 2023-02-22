export enum Status {
	Active,		// this task is currently being worked on 
	Inactive,	// the task is not currently being worked on and is not finished
	Complete,	// the task is finished
}

export const StatusIndicator: { [key in Status]: string } = {
	[Status.Active]: "*",
	[Status.Inactive]: "/",
	[Status.Complete]: "x"
}

export const StatusWord: { [key in Status]: string } = {
	[Status.Active]: "Active",
	[Status.Inactive]: "Inactve",
	[Status.Complete]: "Complete"
}