import TestTaskTrackingPlugin from "./main.test";
import { expect } from "chai";
import { Status } from "model/status";
import { ModifyTaskService } from "modify-task.service";

export function InactivateTaskTests(t: TestTaskTrackingPlugin) {
    t.test("if current line is not a task, should not change task or data", async () => {
        // arrange
        const fileContent = "not a task, just a line";
        const initialData = {};
        await t.setupTest(fileContent, initialData);
        // act
        await (new ModifyTaskService(t.app, t.editor, t.settings)).changeCurrentTask(Status.Inactive);
        // assert
        await t.expectNoChanges(fileContent, initialData);
    });

     t.test("if current task doesn't have a taskID, do nothing", async() => {
        // arrange
        const fileContent = `- [ ] I am a task without an ID`;
        const initialData = {};
        await t.setupTest(fileContent, initialData);
        // act
        await (new ModifyTaskService(t.app, t.editor, t.settings)).changeCurrentTask(Status.Inactive);
        // assert
        await t.expectNoChanges(fileContent, initialData);
     });

     t.test("if current task is inactive, do nothing", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [ ] I am a task without an ID id:${taskID}`;
        const initialData = {[taskID]: [{time: new Date(), status: Status.Inactive}]};
        await t.setupTest(fileContent, initialData);
        // act
        await (new ModifyTaskService(t.app, t.editor, t.settings)).changeCurrentTask(Status.Inactive);
        // assert
        await t.expectNoChanges(fileContent, initialData);
     });

     t.test("if current task is active, new inactive session is added", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [ ] I am a task without an ID id:${taskID}`;
        const initialData = {[taskID]: [{time: new Date(), status: Status.Complete}]};
        await t.setupTest(fileContent, initialData);
        // act
        await (new ModifyTaskService(t.app, t.editor, t.settings)).changeCurrentTask(Status.Inactive);
        // assert
        const newData = { [taskID]: [{time: new Date(), status: Status.Inactive}]};
        const expectedData = t.combineData(initialData, newData);
        await t.expectTaskInData(expectedData);
        await t.expectTargetFile(`- [I] I am a task without an ID id:${taskID}`);
     });

     t.test("if current task is complete, new inactive session is added", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [ ] I am a task without an ID id:${taskID}`;
        const initialData = {[taskID]: [{time: new Date(), status: Status.Complete}]};
        await t.setupTest(fileContent, initialData);
        // act
        await (new ModifyTaskService(t.app, t.editor, t.settings)).changeCurrentTask(Status.Inactive);
        // assert
        const newData = { [taskID]: [{time: new Date(), status: Status.Inactive}]};
        const expectedData = t.combineData(initialData, newData);
        await t.expectTaskInData(expectedData);
        await t.expectTargetFile(`- [I] I am a task without an ID id:${taskID}`);
     });
}