import TestTaskTrackingPlugin from "./main.test";
import { DATA_FILE_NAME, delay, TARGET_FILE_NAME } from "./Util.test";
import { expect } from "chai";
import { activateTask } from "logic";
import { TaskData, Session, SessionStatus } from "model";
import { MarkdownView } from "obsidian";

export function ActivateTaskTests(t: TestTaskTrackingPlugin) {
    t.test("data validation: if current line is not a task, should not change task or data", async () => {
        // arrange
        const fileContent = "not a task, just a line";
        await setup(fileContent);
        // act
        const taskID = await activateTask(t.editor, t.app) as number;
        // assert
        const data = await t.getData();
        await expect(data).to.eql({});  // data file unchanged
        expect(await t.readFile(t.target_file)).to.eql(fileContent); // target file unchanged
    });

    t.test("if current line is a task without a taskID and no other task is active, create one and add it to task and to data", async () => {
        // arrange
        await setup("- [ ] I am a task without an ID");
        // act
        const taskID = await activateTask(t.editor, t.app) as number;
        // assert
        await expectTaskInData(taskID);
        await expectTargetFile(`- [ ] ${taskID} I am a task without an ID`);
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
}


/*
data validation: if current line is not a task, should not change task or data"
if current line is a task without a taskID and no other task is active, create one and add it to task and to data"
if current line is a task with taskID and no other task is active, and task is active, no task should be changed"
if current line is a task with taskID and no other task is active, and task is inactive, task should be marked active"
if current line is a task with taskID and no other task is active, and task is complete, task should be marked active"
if another task is active and onlyOneActie is true then then previously active task should be marked active"
if another task is active and onlyOneActie is false then only the current task should be changed to active"
*/