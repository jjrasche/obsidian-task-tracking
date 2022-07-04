import TestTaskTrackingPlugin from "./main.test";
import { expect } from "chai";
import { changeTask } from "logic";
import { SessionStatus } from "model/session-status";

export function CompleteTaskTests(t: TestTaskTrackingPlugin) {
    t.test("if current line is not a task, should not change task or data", async () => {
        // arrange
        const fileContent = "not a task, just a line";
        const initialData = {};
        await t.setupTest(fileContent, initialData);
        // act
        const actualTaskID = await changeTask(t.app, t.editor, t.settings, SessionStatus.complete) as number;
        // assert
        expect(actualTaskID).to.be.undefined;
        await t.expectNoChanges(fileContent, initialData);
    });

     t.test("if current task doesn't have a taskID, do nothing", async() => {
        // arrange
        const fileContent = `- [ ] I am a task without an ID`;
        const initialData = {};
        await t.setupTest(fileContent, initialData);
        // act
        const actualTaskID = await changeTask(t.app, t.editor, t.settings, SessionStatus.complete) as number;
        // assert
        expect(actualTaskID).to.be.undefined;
        await t.expectNoChanges(fileContent, initialData);
     });

     t.test("if current task is complete, do nothing", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [C] ${taskID} I am a task without an ID`;
        const initialData = {[taskID]: [{time: new Date(), status: SessionStatus.complete}]};
        await t.setupTest(fileContent, initialData);
        // act
        const actualTaskID = await changeTask(t.app, t.editor, t.settings, SessionStatus.complete) as number;
        // assert
        expect(actualTaskID).to.eql(taskID);
        await t.expectNoChanges(fileContent, initialData);
     });

     t.test("if current task is active, new complete session is added", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [ ] ${taskID} I am a task without an ID`;
        const initialData = {[taskID]: [{time: new Date(), status: SessionStatus.active}]};
        await t.setupTest(fileContent, initialData);
        // act
        const actualTaskID = await changeTask(t.app, t.editor, t.settings, SessionStatus.complete) as number;
        // assert
        expect(actualTaskID).to.eql(taskID);
        await t.expectTaskInData(initialData, taskID, 1, 2, SessionStatus.complete);
        await t.expectTargetFile(`- [C] ${taskID} I am a task without an ID`);
     });

     t.test("if current task is inactive, new complete session is added", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [ ] ${taskID} I am a task without an ID`;
        const initialData = {[taskID]: [{time: new Date(), status: SessionStatus.inactive}]};
        await t.setupTest(fileContent, initialData);
        // act
        const actualTaskID = await changeTask(t.app, t.editor, t.settings, SessionStatus.complete) as number;
        // assert
        expect(actualTaskID).to.eql(taskID);
        await t.expectTaskInData(initialData, taskID, 1, 2, SessionStatus.complete);
        await t.expectTargetFile(`- [C] ${taskID} I am a task without an ID`);
     });
}