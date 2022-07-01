// import { getCurrentLine, getTaskID } from "src/logic";
// import { activityData, SessionStatus } from "model"
// import { Editor } from "obsidian";
// // import { Editor } from "obsidian";

// // { [key: number]: FormInput; }
// export const TestSessionData = (): activityData => {
// 	return [
// 		{1656360658127: [{time: new Date(), status: SessionStatus.active }]},
// 		{1656360658150: [{time: new Date(), status: SessionStatus.inactive }]},
// 		{1656360658173: [{time: new Date(), status: SessionStatus.complete }]},
// 	];
// }
// /*
// 	test's can't run against the obsidian functional space unless running within the app.
// 	This solution allows some runtime checks while using the Obsidian API
// */
// function assert(assertion: () => boolean, message?: string) {
// 	try {
// 		const result = assertion();
// 		console.log(`${result === true ? '√' : 'x'}${message}`)
// 	} catch (e) {
// 		console.error(`error running ${message}\n${e.message}`)
// 	}

// }
// export function testTaskID() {
// 	const taskID = 198324;
// 	const taskLine = `- [ ] ${taskID} something todo about something`;
// 	// line is a task
// 	assert(() => getTaskID(taskLine) === taskID, "uncompleted task");
// 	assert(() => getTaskID(`- [x] ${taskID} something todo about something`) === taskID, "completed task");
// 	assert(() => getTaskID(`- [√] ${taskID} something todo about something`) === taskID, "task with weird thing in it");
// 	// line is not a task
// 	assert(() => getTaskID(`-[ ] ${taskID} something todo about something`) === null, "badly formatted task");
// 	assert(() => getTaskID(`- [] ${taskID} something todo about something`) === null, "badly formatted task 2");
// 	assert(() => getTaskID(`alskdjsd`) === null, "random non task line");
// }

// // export function testActivateTodo() {
// // 	const taskID = 198324;
// // 	const taskLine = `- [ ] ${taskID} something todo about something`;
// // 	// line is a task
// // 	assert(() => activateTodo()"data validation: if current line is not a task, should not change task or data"
// // 	assert(() => activateTodo()"if current line is a task without a taskID and no other task is active, create one and add it to task and to data"
// // 	assert(() => activateTodo()"if current line is a task with taskID and no other task is active, and task is active, no task should be changed"
// // 	assert(() => activateTodo()"if current line is a task with taskID and no other task is active, and task is inactive, task should be marked active"
// // 	assert(() => activateTodo()"if current line is a task with taskID and no other task is active, and task is complete, task should be marked active"
// // 	assert(() => activateTodo()"if another task is active and onlyOneActie is true then then previously active task should be marked active"
// // 	assert(() => activateTodo()"if another task is active and onlyOneActie is false then only the current task should be changed to active"
// // }




