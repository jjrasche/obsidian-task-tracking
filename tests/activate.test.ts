import TestTaskTrackingPlugin from "./main.test";
import { Status } from "model/status";
import { ModifyTaskService } from "modify-task.service";

export function ActivateTaskTests(t: TestTaskTrackingPlugin) {
    t.test("if current line is not a task, should not change task or data", async () => {
        // arrange
        const fileContent = "not a task, just a line";
        const initialData = {};
        await t.setupTest(fileContent, initialData);
        // act
        await t.mts.changeCurrentTask(Status.Active);
        // assert
        await t.expectNoChanges(fileContent, initialData);
    });

    t.test("if current task is active, no session is added ", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [ ] I am a task id:${taskID}`;
        const initialData = {[taskID]: [{time: new Date(), status: Status.Active}]};
        await t.setupTest(fileContent, initialData);
        // act
        await t.mts.changeCurrentTask(Status.Active);
        // assert
        await t.expectNoChanges(fileContent, initialData);
    });

    t.test("if current task doesn't have a taskID, create taskID and add it to task and data", async () => {
        // arrange
        const fileContent = "- [ ] I am a task";
        const initialData = {};
        await t.setupTest(fileContent, initialData);
        // act
        await t.mts.changeCurrentTask(Status.Active);
        // assert
        const expectedData = { [1]: [{time: new Date(), status: Status.Active}]};
        await t.expectTaskInData(expectedData);
        await t.expectTargetFile(`- [A] I am a task id:1`);
    });

    t.test("if current task is inactive, new active session is added", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [ ] I am a task id:${taskID}`;
        const initialData = {[taskID]: [{time: new Date(), status: Status.Inactive}]};
        await t.setupTest(fileContent, initialData);
        // act
        await t.mts.changeCurrentTask(Status.Active);
        // assert
        const newData = { [taskID]: [{time: new Date(), status: Status.Active}]};
        const expectedData = t.combineData(initialData, newData);
        await t.expectTaskInData(expectedData);
        await t.expectTargetFile(`- [A] I am a task id:${taskID}`);
    });
    
    t.test("if current task is complete, new active session is added", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [ ] I am a task id:${taskID}`;
        const initialData = {[taskID]: [{time: new Date(), status: Status.Complete}]};
        await t.setupTest(fileContent, initialData);
        // act
        await t.mts.changeCurrentTask(Status.Active);
        // assert
        const newData = { [taskID]: [{time: new Date(), status: Status.Active}]};
        const expectedData = t.combineData(initialData, newData);
        await t.expectTaskInData(expectedData);
        await t.expectTargetFile(`- [A] I am a task id:${taskID}`);
    });

    t.test("next sequential taskID is selected", async() => {
        // arrange
        const fileContent = `- [ ] I am a task`;
        const initialData = {[1]: [{time: new Date(), status: Status.Complete}]};
        await t.setupTest(fileContent, initialData);
        // act
        await t.mts.changeCurrentTask(Status.Active);
        // assert 
        const newData = { [2]: [{time: new Date(), status: Status.Active}]};
        const expectedData = t.combineData(initialData, newData);
        await t.expectTaskInData(expectedData);
        await t.expectTargetFile(`- [A] I am a task id:${2}`);
    });
    
    t.test("next sequential taskID is selected even if there is a gap in ids", async() => {
        // arrange
        const fileContent = `- [ ] I am a task`;
        const initialData = {[1]: [{time: new Date(), status: Status.Complete}], [3]: [{time: new Date(), status: Status.Complete}]};
        await t.setupTest(fileContent, initialData);
        // act
        await t.mts.changeCurrentTask(Status.Active);
        // assert
        const newData = { [2]: [{time: new Date(), status: Status.Active}]};
        const expectedData = t.combineData(initialData, newData);
        await t.expectTaskInData(expectedData);
        await t.expectTargetFile(`- [A] I am a task id:${2}`);
    });
    
    t.test("if onlyOneActive is true and another task is currently active, previously active task should have an inactive session added", async() => {
        // arrange
        const task1ID = 12345;
        const task2ID = 23456;
        const fileContent = `- [A] I am a task with an id id:${task1ID}\n- [I] I am also a task with an id id:${task2ID}`;
        const initialData = {
            [task1ID]: [{time: new Date(), status: Status.Active}],
            [task2ID]: [{time: new Date(), status: Status.Inactive}],            
        };
        await t.setupTest(fileContent, initialData, 1);
        // act
        await t.mts.changeCurrentTask(Status.Active);
        // assert
        const newData = {
            [task1ID]: [{time: new Date(), status: Status.Inactive}],
            [task2ID]: [{time: new Date(), status: Status.Active}],            
        };
        const expectedData = t.combineData(initialData, newData);
        await t.expectTaskInData(expectedData);
        await t.expectTargetFile(`- [I] I am a task with an id id:${task1ID}\n- [A] I am also a task with an id id:${task2ID}`);
    });

    t.test("if onlyOneActive is false and another task is currently active, previously active task should still be active and have no new session added", async() => {
        // arrange
        const task1ID = 1;
        const task2ID = 2;
        const task3ID = 3;
        const fileContent = `- [A] I am a task with an id id:${task1ID}\n- [C] I am a task with an id id:${task2ID}\n- [I] I am also a task with an id id:${task3ID}`;
        const initialData = {
            [task1ID]: [{time: new Date(), status: Status.Active}],
            [task2ID]: [{time: new Date(), status: Status.Complete}],
            [task3ID]: [{time: new Date(), status: Status.Inactive}],            
        };
        t.settings.onlyOneTaskActive = false; 
        await t.setupTest(fileContent, initialData, 2);
        // act
        await t.mts.changeCurrentTask(Status.Active);
        // assert
        const newData = {
            [task3ID]: [{time: new Date(), status: Status.Active}],
        };
        const expectedData = t.combineData(initialData, newData);
        await t.expectTaskInData(expectedData);
        await t.expectTargetFile(`- [A] I am a task with an id id:${task1ID}\n- [C] I am a task with an id id:${task2ID}\n- [A] I am also a task with an id id:${task3ID}`);
    });   
}