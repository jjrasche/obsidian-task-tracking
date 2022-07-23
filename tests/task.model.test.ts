import TestTaskTrackingPlugin from "./main.test";
import { Status } from "model/status";
import { expect } from "chai";
import { updateTaskFromEditor } from "service/modify-task.service";
import * as tasks from 'state/tasks.state';
import { STask } from "obsidian-dataview";
import { getTaskText, getTaskTextID, Task } from "model/task.model";
// import proxyquire from 'proxyquire';
import rewiremock from 'rewiremock';

import * as date from 'service/date.service';
/*
    getTaskText
    getTaskTextID
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
		task.status = Status.Active
        expect(task.toString()).to.eql("- [A] Create illustrative rates tickets #jira #quotebook #illustrativeRates id:2")
    })

    t.test("fffsetStatus", async () => {
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
        rewiremock('date.service')
        .with({
            now: () => console.log("slfjlsdkjf")
        });
        console.log(date.now());
        // const task = new Task(getSTask());
		// const originalSession = {time: new Date(), status: Status.Inactive};
		// task.sessions = [originalSession];

		// // happy path
        // task.setStatus(Status.Active)
		// const session2 = {time: new Date(0), status: Status.Active};
		// expect(task.sessions).to.eql([originalSession, session2]);
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
