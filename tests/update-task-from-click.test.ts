import TestTaskTrackingPlugin from "./main.test";
import { Status } from "model/status";
import { expect } from "chai";
import { updateTaskFromClick, updateTaskFromEditor } from "service/modify-task.service";
import * as tasks from 'state/tasks.state';
/*
    active status click changes to inactive
    inactive status clicked changes to active
    complete status clicked changes to active
*/
export function UpdateTaskFromClickTests(t: TestTaskTrackingPlugin) {

    t.test("active status click changes to inactive", async () => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [A] I am a task with an ID id:${taskID}`;
        const initialData = {[taskID]: [{time: new Date(), status: Status.Active}]};
        await t.setupEditorTest(fileContent, initialData);
        // act
        await updateTaskFromClick(taskID); 
        // assert
        const newData = { [taskID]: [{time: new Date(), status: Status.Inactive}]};
        const expectedData = t.combineData(initialData, newData);
        await t.expectTaskInData(expectedData);
        await t.expectTargetFile(`- [I] I am a task with an ID id:${taskID}`);
    });
    t.test("inactive status clicked changes to active", async () => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [I] I am a task with an ID id:${taskID}`;
        const initialData = {[taskID]: [{time: new Date(), status: Status.Inactive}]};
        await t.setupEditorTest(fileContent, initialData);
        // act
        await updateTaskFromClick(taskID); 
        // assert
        const newData = { [taskID]: [{time: new Date(), status: Status.Active}]};
        const expectedData = t.combineData(initialData, newData);
        await t.expectTaskInData(expectedData);
        await t.expectTargetFile(`- [A] I am a task with an ID id:${taskID}`);
    });
    t.test("complete status clicked changes to active", async () => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [C] I am a task with an ID id:${taskID}`;
        const initialData = {[taskID]: [{time: new Date(), status: Status.Complete}]};
        await t.setupEditorTest(fileContent, initialData);
        // act
        await updateTaskFromClick(taskID); 
        // assert
        const newData = { [taskID]: [{time: new Date(), status: Status.Active}]};
        const expectedData = t.combineData(initialData, newData);
        await t.expectTaskInData(expectedData);
        await t.expectTargetFile(`- [A] I am a task with an ID id:${taskID}`);

    });
}