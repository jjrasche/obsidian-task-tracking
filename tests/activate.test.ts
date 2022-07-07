import TestTaskTrackingPlugin from "./main.test";
import { expect } from "chai";
import { Status } from "model/status";
import { ModifyTaskService } from "modify-task.service";

export function ActivateTaskTests(t: TestTaskTrackingPlugin) {
    t.test("if current line is not a task, should not change task or data", async () => {
        // arrange
        const fileContent = "not a task, just a line";
        const initialData = {};
        await t.setupTest(fileContent, initialData);
        // act
        await (await (new ModifyTaskService(t.app, t.editor, t.settings)).setup()).changeCurrentTask(Status.active) as number;
        // assert
        await t.expectNoChanges(fileContent, initialData);
    });

    t.test("if current task is active, no session is added ", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [ ] I am a task without an ID id:${taskID}`;
        const initialData = {[taskID]: [{time: new Date(), status: Status.active}]};
        await t.setupTest(fileContent, initialData);
        // act
        await (await (new ModifyTaskService(t.app, t.editor, t.settings)).setup()).changeCurrentTask(Status.active) as number;
        // assert
        await t.expectNoChanges(fileContent, initialData);
    });

    t.test("fffif current task doesn't have a taskID, create taskID and add it to task and data", async () => {
        // arrange
        const fileContent = "- [ ] I am a task without an ID";
        const initialData = {};
        await t.setupTest(fileContent, initialData);
        // act
        await (await (new ModifyTaskService(t.app, t.editor, t.settings)).setup()).changeCurrentTask(Status.active) as number;
        // assert
        await t.expectTaskInData(initialData, 1);
        await t.expectTargetFile(`- [ ] I am a task without an ID id:${1}`);
    });
    
    t.test("if current task is inactive, new active session is added", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [ ] I am a task without an ID id:${taskID}`;
        const initialData = {[taskID]: [{time: new Date(), status: Status.inactive}]};
        await t.setupTest(fileContent, initialData);
        // act
        await (await (new ModifyTaskService(t.app, t.editor, t.settings)).setup()).changeCurrentTask(Status.active) as number;
        // assert
        await t.expectTaskInData(initialData, taskID, 1, 2, Status.active);
        await t.expectTargetFile(fileContent);
    });
    
    t.test("if current task is complete, new active session is added", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [ ] I am a task without an ID id:${taskID}`;
        const initialData = {[taskID]: [{time: new Date(), status: Status.complete}]};
        await t.setupTest(fileContent, initialData);
        // act
        await (await (new ModifyTaskService(t.app, t.editor, t.settings)).setup()).changeCurrentTask(Status.active) as number;
        // assert
        await t.expectTaskInData(initialData, taskID, 1, 2, Status.active);
        await t.expectTargetFile(fileContent);
    });
    
    t.test("if onlyOneActive is true and another task is currently active, previously active task should have an inactive session added", async() => {
        // arrange
        const task1ID = 12345;
        const task2ID = 23456;
        const fileContent = `- [ ] I am a task with an id id:${task1ID}\n- [ ] I am also a task with an id id:${task2ID}`;
        const initialData = {
            [task1ID]: [{time: new Date(), status: Status.active}],
            [task2ID]: [{time: new Date(), status: Status.inactive}],            
        };
        await t.setupTest(fileContent, initialData, 1);
        // act
        await (await (new ModifyTaskService(t.app, t.editor, t.settings)).setup()).changeCurrentTask(Status.active) as number;
        // assert
        await t.expectTaskInData(initialData, task2ID, 2, 2, Status.active);
        await t.expectTargetFile(fileContent);
    });

    // t.test("if onlyOneActive is false and another task is currently active, previously active task should still be active have no new session added", async() => {
    //     // arrange
    //     await t.setupTest("- [ ] I am a task without an ID");
    //     // act
        // await (await (new ModifyTaskService(t.app, t.editor, t.settings)).setup()).changeCurrentTask(Status.active) as number;
    //     // assert
    //     await t.expectTaskInData(taskID);
    //     await t.expectTargetFile(`- [ ] I am a task without an ID id:${taskID}`);
    // });   
}