import { Status } from "./status";

/*
	A session describes a period of time spent on a task
*/
export class Event {
	taskID?: number;
	taskText?: string;
	status: Status;
	time: Date;
  }