import TestTaskTrackingPlugin from "./main.test";
import { Status } from "model/status";
import { expect } from "chai";
import { STask } from "obsidian-dataview";
import { updateTaskFromEditor } from "service/modify-task.service";
import * as tasks from 'state/tasks.state';


export function tasksStateTests(t: TestTaskTrackingPlugin) {
    t.test("fffadding a task will add that task to working memory to be able to access in the future", async () => {
        // arrange
        const fileContent = `- [ ] I am a task without an ID`;
        const initialData = {};
        await t.setupEditorTest(fileContent, initialData);
        tasks.get(); // initialize data
        // act
        await updateTaskFromEditor(t.editor, Status.Active);
        // assert
        const expectedSessions = [{time: new Date(), status: Status.Active}];
        const actual = await tasks.find(1);
        expect(actual.id).to.eq(1);  
        t.expectSessionsEqual(expectedSessions, actual.events);
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
