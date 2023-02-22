import TestTaskTrackingPlugin from "./main.test";
import { Status } from "model/status";
import { expect } from "chai";
import { STask } from "obsidian-dataview";
import { getTaskText, getTaskTextID, Task } from "model/task.model";

/*
    hard to truly stub an exported function. I don't understand this fully
    https://dev.to/thekashey/please-stop-playing-with-proxyquire-11j4
    todo: understand the pattern for stubbing in TS

            // debugger;
        // const Task = proxyquire('../model/task.model', {
        //     './service/date.service': {
        //       default: function now() { return new Date(0)},
        //     },
        //   }).default;
        // debugger;
        // import * as date from 'service/date.service';

        // const myTestableFile = rewiremock(() => require('../model/task.model'), () => {
        //     rewiremock(() => require('service/date.service')).with(mock) 
        //   });
         // totaly mock `fs` with your stub 
*/
export function taskModelTests(t: TestTaskTrackingPlugin) {
    t.test("getTaskTextID", async () => {
        expect(getTaskTextID("Something #tag1 #tag2 id:2")).to.eql(2);
        expect(getTaskTextID("Something #tag1 #tag2")).to.be.undefined;
        expect(getTaskTextID("id:123")).to.eql(123);
        expect(getTaskTextID("a id:123")).to.eql(123);
    });
    t.test("getTaskText", async () => {
        expect(getTaskText("Something #tag1 #tag2")).to.eql("Something #tag1 #tag2");
        expect(getTaskText("Something #tag1 #tag2 id:2")).to.eql("Something #tag1 #tag2");    // truncates white space
        expect(getTaskText("id:123")).to.eql("");
        expect(getTaskText("a id:123")).to.eql("a");
    });
    t.test("constructor", async () => {
        const stask = getSTask()
        const task = new Task(stask);
        // assert
        expect(task.sourceID).to.eql(2);
        expect(task.text).to.eql("Create illustrative rates tickets #jira #quotebook #illustrativeRates");
        expect(task.line).to.eql(stask.line);
        expect(task.tags).to.eql(stask.tags);
        expect(task.path).to.eql(stask.path);
        expect(task.line).to.eql(stask.line);
    })

    t.test("toString", async () => {
        const stask = getSTask()
        const task = new Task(stask);
        task.id = 2;
		// happy path
        expect(task.toString()).to.eql("- [I] Create illustrative rates tickets #jira #quotebook #illustrativeRates id:2")
		// tabs
		task.position.start.col = 2
        expect(task.toString()).to.eql("		- [I] Create illustrative rates tickets #jira #quotebook #illustrativeRates id:2")
		// status
		task.position.start.col = 0
		task.status = Status.Complete
        expect(task.toString()).to.eql("- [C] Create illustrative rates tickets #jira #quotebook #illustrativeRates id:2")
		task.status = Status.Active;
        expect(task.toString()).to.eql("- [A] Create illustrative rates tickets #jira #quotebook #illustrativeRates id:2")
    })

    t.test("setStatus", async () => {
        const task = new Task(getSTask());
		const originalSession = {time: new Date(), status: Status.Inactive};
		task.setSessions([originalSession]);
        // can't set to same status
        await task.setStatus(Status.Inactive)
		expect(task.events).to.eql([originalSession]);
		// happy path
        await task.setStatus(Status.Active)
		const session2 = {time: new Date(), status: Status.Active};
		expect(task.events).to.eql([originalSession, session2]);
        // can't set to same status
        await task.setStatus(Status.Active)
		expect(task.events).to.eql([originalSession, session2]);
        // set to complete
        await task.setStatus(Status.Complete)
		const session3 = {time: new Date(), status: Status.Complete};
		expect(task.events).to.eql([originalSession, session2, session3]);
        // can't set to same status
        await task.setStatus(Status.Complete)
		expect(task.events).to.eql([originalSession, session2, session3]);
    })

    t.test("toView", async () => {
        // arrange
        const stask = getSTask();
        const task = new Task(stask);
        const session1Time = new Date(0);
        const session1 = {time: session1Time, status: Status.Active};
        const session2Time = new Date(10000);
        const session2 = {time: session2Time, status: Status.Inactive};
        const session3Time = new Date(50000);
        const session3 = {time: session3Time, status: Status.Active};
        const session4Time = new Date(100000);
        const session4 = {time: session4Time, status: Status.Complete};
        task.setSessions([session1, session2, session3, session4]);
        // act
        const actual = task.toView();
        // assert
        expect(actual).to.eql({
            id: undefined,  // defined outside task constructor
			status: stask.status,
			text: "Create illustrative rates tickets",
			start: session1.time,
			lastActive: session3.time,
			timeSpent: (10000 + 50000) / 1000,
			timeToClose: (100000) / 1000,
			numSwitches: 2,
			fileName: stask.path,
			tags: stask.tags,
			line: stask.line
        })

    })

}

const getSTask = (text?: string): STask => ({
    "symbol": "-",
    "link": { "path": "Dailies/22-07-13.md", "type": "file", "embed": false },
    "section": { "path": "Dailies/22-07-13.md", "type": "file", "embed": false },
    "text": !!text ? text : "Create illustrative rates tickets #jira #quotebook #illustrativeRates id:2" ,
    "tags": ["#jira", "#quotebook", "#illustrativeRates"],
    "line": 3,
    "lineCount": 1,
    "list": 3,
    "outlinks": [],
    "path": "Dailies/22-07-13.md",
    "children": [],
    "task": true,
    "annotated": false,
    "position": { "start": { "line": 3, "col": 0, "offset": 21 }, "end": { "line": 3, "col": 80, "offset": 101 } },
    "subtasks": [],
    "real": true,
    "header": { "path": "Dailies/22-07-13.md", "type": "file", "embed": false },
    "status": Status.Inactive,
    "checked": true,
    "completed": false,
    "fullyCompleted": false
} as unknown as STask)
