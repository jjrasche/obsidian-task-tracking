import TestTaskTrackingPlugin from "./main.test";
import { expect } from "chai";
import { ModifyTaskService } from "modify-task.service";
import { Status } from "model/status";

export function CompleteTaskTests(t: TestTaskTrackingPlugin) {
    t.test("if current line is not a task, should not change task or data", async () => {
        // arrange
        const fileContent = "not a task, just a line";
        const initialData = {};
        await t.setupTest(fileContent, initialData);
        // act
        const actualTaskID = await (new ModifyTaskService(t.app, t.editor, t.settings)).changeCurrentTask(Status.active) as number;
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
        const actualTaskID = await (new ModifyTaskService(t.app, t.editor, t.settings)).changeCurrentTask(Status.active) as number;
        // assert
        expect(actualTaskID).to.be.undefined;
        await t.expectNoChanges(fileContent, initialData);
     });

     t.test("if current task is complete, do nothing", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [C] I am a task without an ID id:${taskID}`;
        const initialData = {[taskID]: [{time: new Date(), status: Status.complete}]};
        await t.setupTest(fileContent, initialData);
        // act
        const actualTaskID = await (new ModifyTaskService(t.app, t.editor, t.settings)).changeCurrentTask(Status.active) as number;
        // assert
        expect(actualTaskID).to.eql(taskID);
        await t.expectNoChanges(fileContent, initialData);
     });

     t.test("if current task is active, new complete session is added", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [ ] I am a task without an ID id:${taskID}`;
        const initialData = {[taskID]: [{time: new Date(), status: Status.active}]};
        await t.setupTest(fileContent, initialData);
        // act
        const actualTaskID = await (new ModifyTaskService(t.app, t.editor, t.settings)).changeCurrentTask(Status.active) as number;
        // assert
        expect(actualTaskID).to.eql(taskID);
        await t.expectTaskInData(initialData, taskID, 1, 2, Status.complete);
        await t.expectTargetFile(`- [C] I am a task without an ID id:${taskID}`);
     });

     t.test("if current task is inactive, new complete session is added", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [ ] I am a task without an ID id:${taskID}`;
        const initialData = {[taskID]: [{time: new Date(), status: Status.inactive}]};
        await t.setupTest(fileContent, initialData);
        // act
        const actualTaskID = await (new ModifyTaskService(t.app, t.editor, t.settings)).changeCurrentTask(Status.active) as number;
        // assert
        expect(actualTaskID).to.eql(taskID);
        await t.expectTaskInData(initialData, taskID, 1, 2, Status.complete);
        await t.expectTargetFile(`- [C] I am a task without an ID id:${taskID}`);
     });
}