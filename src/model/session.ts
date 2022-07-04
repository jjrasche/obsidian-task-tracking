import { SessionStatus } from "./session-status";

/*
	A session describes a period of time spent on a task
*/
export class Session {
	time: Date;
	status: SessionStatus
}
