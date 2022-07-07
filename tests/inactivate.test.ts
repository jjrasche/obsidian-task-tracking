import TestTaskTrackingPlugin from "./main.test";
import { expect } from "chai";
import { changeTask } from "modify-task.service";
import { SessionStatus } from "model/status";

export function InactivateTaskTests(t: TestTaskTrackingPlugin) {
    t.test("if current line is not a task, should not change task or data", async () => {
        // arrange
        const fileContent = "not a task, just a line";
        const initialData = {};
        await t.setupTest(fileContent, initialData);
        // act
        const actualTaskID = await changeTask(t.app, t.editor, t.settings, SessionStatus.inactive) as number;
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
        const actualTaskID = await changeTask(t.app, t.editor, t.settings, SessionStatus.inactive) as number;
        // assert
        expect(actualTaskID).to.be.undefined;
        await t.expectNoChanges(fileContent, initialData);
     });

     t.test("if current task is inactive, do nothing", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [ ] I am a task without an ID id:${taskID}`;
        const initialData = {[taskID]: [{time: new Date(), status: SessionStatus.inactive}]};
        await t.setupTest(fileContent, initialData);
        // act
        const actualTaskID = await changeTask(t.app, t.editor, t.settings, SessionStatus.inactive) as number;
        // assert
        expect(actualTaskID).to.be.eql(taskID);
        await t.expectNoChanges(fileContent, initialData);
     });

     t.test("if current task is active, new inactive session is added", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [ ] I am a task without an ID id:${taskID}`;
        const initialData = {[taskID]: [{time: new Date(), status: SessionStatus.complete}]};
        await t.setupTest(fileContent, initialData);
        // act
        const actualTaskID = await changeTask(t.app, t.editor, t.settings, SessionStatus.inactive) as number;
        // assert
        expect(actualTaskID).to.eql(taskID);
        await t.expectTaskInData(initialData, taskID, 1, 2, SessionStatus.inactive);
        await t.expectTargetFile(fileContent);
     });

     t.test("if current task is complete, new inactive session is added", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [ ] I am a task without an ID id:${taskID}`;
        const initialData = {[taskID]: [{time: new Date(), status: SessionStatus.complete}]};
        await t.setupTest(fileContent, initialData);
        // act
        const actualTaskID = await changeTask(t.app, t.editor, t.settings, SessionStatus.inactive) as number;
        // assert
        expect(actualTaskID).to.eql(taskID);
        await t.expectTaskInData(initialData, taskID, 1, 2, SessionStatus.inactive);
        await t.expectTargetFile(fileContent);
     });
}