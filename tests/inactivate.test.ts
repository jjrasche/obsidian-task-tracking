import TestTaskTrackingPlugin from "./main.test";
import { DATA_FILE_NAME, delay, TARGET_FILE_NAME } from "./Util.test";
import { expect } from "chai";
import { activateTask } from "logic";
import { TaskData, Session, SessionStatus } from "model";
import { MarkdownView } from "obsidian";

export function InactivateTaskTests(t: TestTaskTrackingPlugin) {
    t.test("if current line is not a task, should not change task or data", async () => {
        // arrange
        const fileContent = "not a task, just a line";
        const initialData = "{}";
        await setup(fileContent);
        // act
        const taskID = await activateTask(t.editor, t.app) as number;
        // assert
        expectNoChanges(taskID, fileContent, initialData);
    });

     t.test("if current task doesn't have a taskID, do nothing", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [ ] ${taskID} I am a task without an ID`;
        const initialData = JSON.stringify({[taskID]: [{time: new Date(), status: SessionStatus.complete}]});
        await setup(fileContent, initialData);
        // act
        const actualTaskID = await activateTask(t.editor, t.app) as number;
        // assert
        expect(actualTaskID).to.eql(taskID);
        await expectTaskInData(taskID, 1, 2);
        await expectTargetFile(fileContent);
     });
     t.test("if current task is inactive, do nothing", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [ ] ${taskID} I am a task without an ID`;
        const initialData = JSON.stringify({[taskID]: [{time: new Date(), status: SessionStatus.complete}]});
        await setup(fileContent, initialData);
        // act
        const actualTaskID = await activateTask(t.editor, t.app) as number;
        // assert
        expect(actualTaskID).to.eql(taskID);
        await expectTaskInData(taskID, 1, 2);
        await expectTargetFile(fileContent);
     });
     t.test("if current task is active, new inactive session is added", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [ ] ${taskID} I am a task without an ID`;
        const initialData = JSON.stringify({[taskID]: [{time: new Date(), status: SessionStatus.complete}]});
        await setup(fileContent, initialData);
        // act
        const actualTaskID = await activateTask(t.editor, t.app) as number;
        // assert
        expect(actualTaskID).to.eql(taskID);
        await expectTaskInData(taskID, 1, 2);
        await expectTargetFile(fileContent);
     });
     t.test("if current task is complete, new inactive session is added", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [ ] ${taskID} I am a task without an ID`;
        const initialData = JSON.stringify({[taskID]: [{time: new Date(), status: SessionStatus.complete}]});
        await setup(fileContent, initialData);
        // act
        const actualTaskID = await activateTask(t.editor, t.app) as number;
        // assert
        expect(actualTaskID).to.eql(taskID);
        await expectTaskInData(taskID, 1, 2);
        await expectTargetFile(fileContent);
     });
    
    t.test("if current task is complete, new active session is added", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [ ] ${taskID} I am a task without an ID`;
        const initialData = JSON.stringify({[taskID]: [{time: new Date(), status: SessionStatus.complete}]});
        await setup(fileContent, initialData);
        // act
        const actualTaskID = await activateTask(t.editor, t.app) as number;
        // assert
        expect(actualTaskID).to.eql(taskID);
        await expectTaskInData(taskID, 1, 2);
        await expectTargetFile(fileContent);
    });

    async function setup(fileContent: string, intialData = "{}", line = 0) {
        await t.modifyFile(TARGET_FILE_NAME, fileContent);
        await t.modifyFile(DATA_FILE_NAME, intialData);
        t.editor.setCursor(line);
    }

    async function expectTaskInData(taskID: number, expectedNumTasks = 1, expecteNumSessions = 1, expectedMostRecentSessionStatus = SessionStatus.active) {
        const data = await t.getData();
        const mostRecentSession = (data[taskID].last() ?? {}) as Session;
        expect(Object.keys(data)).to.have.lengthOf(expectedNumTasks);               // 1 task
        expect(data[taskID]).to.not.be.null;                                        // taskID exists in data
        expect(data[taskID]).to.have.lengthOf(expecteNumSessions);                  // task has 1 session
        expect(mostRecentSession.status).to.eql(expectedMostRecentSessionStatus);   // session has active status
        expect(mostRecentSession.time)
            .lessThan(new Date())
            .greaterThan(new Date((new Date()).setSeconds(-10)));                   // session has active status
    }

    async function expectTargetFile(expectedFileContent: string) {
        const targetFile = await t.readFile(t.target_file);
        expect(targetFile).to.eql(expectedFileContent);     // taskID added to selected task
    }

    async function expectNoChanges(taskID: number, fileContent: string, initialData: {}) {
        const data = await t.getData();
        expect(taskID).to.be.null;
        await expect(data).to.eql(initialData);  // data file unchanged
        expect(await t.readFile(t.target_file)).to.eql(fileContent); // target file unchanged
    }
}


/*
"if current task doesn't have a taskID, do nothing"
"if current task is inactive, do nothing"
"if current task is active, new inactive session is added"
"if current task is complete, new inactive session is added"
*/