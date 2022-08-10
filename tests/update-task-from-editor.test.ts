import TestTaskTrackingPlugin, { TARGET_FILE_NAME } from "./main.test";
import { Status } from "model/status";
import { expect } from "chai";
import { updateTaskFromEditor } from "service/modify-task.service";
import * as tasks from 'state/tasks.state';
import { write } from "service/file.service";
import { TaskDataType } from "service/task-data.service";

export function UpdateTaskFromEditorTests(t: TestTaskTrackingPlugin) {
    t.test("line is not a task", async () => {
        const fileContent = "not a task, just a line";
        const initialData = {};
        await t.setupEditorTest(fileContent, initialData);
        // act
        await updateTaskFromEditor(t.editor, Status.Active);
        // assert
        expect(await tasks.get()).to.eql([]);
    })
    t.test("if current task is same status, do nothing", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [C] I am a task with an ID id:${taskID}`;
        const initialData = {[taskID]: [{time: new Date(), status: Status.Complete}]};
        await t.setupEditorTest(fileContent, initialData);
        // act
        await updateTaskFromEditor(t.editor, Status.Complete); 
        // assert
        await t.expectNoChanges(fileContent, initialData);
     });

    t.test("source task with no id will create new task in Tasks", async () => {
        // arrange
        const fileContent = `- [ ] I am a task without an ID`;
        const initialData = {};
        await t.setupEditorTest(fileContent, initialData);
        // act
        await updateTaskFromEditor(t.editor, Status.Active);
        // assert
        // await t.expectNoChanges(fileContent, initialData); 
        const newData = { 1: [{time: new Date(), status: Status.Active}]};
        const expectedData = t.combineData(initialData, newData);
        await t.expectTaskInData(expectedData);
        await t.expectTargetFile(`- [A] I am a task without an ID id:1`);
    })
    t.test("source task with id will add session to Tasks", async () => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [A] I am a task with an ID id:${taskID}`;
        const initialData =  { [taskID]: [{time: new Date(), status: Status.Active}]};
        await t.setupEditorTest(fileContent, initialData);
        // act
        await updateTaskFromEditor(t.editor, Status.Complete);
        // assert
        // await t.expectNoChanges(fileContent, initialData); 
        const newData = { [taskID]: [{time: new Date(), status: Status.Complete}]};
        const expectedData = t.combineData(initialData, newData);
        await t.expectTaskInData(expectedData);
        await t.expectTargetFile(`- [C] I am a task with an ID id:${taskID}`);
    })

    t.test("moving source task to different line then saving, modifies the correct line", async () => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [A] I am a task with an ID id:${taskID}`;
        const initialData =  { [taskID]: [{time: new Date(), status: Status.Active}]};
        await t.setupEditorTest(fileContent, initialData);
        // act
        await tasks.get(); // initialize tasks
        await write(TARGET_FILE_NAME, `- [I] I am a task that replaced where the other task was\n${fileContent}`); // move 
        await new Promise(r => setTimeout(r, 200)); // need to wait for obsidian to pickup file change.
        t.editor.setCursor(1);
        await updateTaskFromEditor(t.editor, Status.Complete);
        // assert
        // await t.expectNoChanges(fileContent, initialData); 
        const newData = { [taskID]: [{time: new Date(), status: Status.Complete}]};
        const expectedData = t.combineData(initialData, newData);
        await t.expectTaskInData(expectedData);
        await t.expectTargetFile( `- [I] I am a task that replaced where the other task was\n- [C] I am a task with an ID id:${taskID}`);
    })

    t.test("fffstart tracking 2 tasks, ids should be different", async () => {
        // arrange
        const fileContent = `- [ ] I am a task without ID\n- [ ] I am a task without ID also`;
        await t.setupEditorTest(fileContent);
        
        // act: inactivate 1st task
        await updateTaskFromEditor(t.editor, Status.Inactive);
        // assert: should have 1 as id of first task, second is untouched
        let expectedData = { 1: [{time: new Date(), status: Status.Inactive}] } as TaskDataType;
        await t.expectTaskInData(expectedData);
        await t.expectTargetFile(`- [I] I am a task without ID id:1\n- [ ] I am a task without ID also`);
        
        // act: inactivate 1st task
        t.editor.setCursor(1);
        await updateTaskFromEditor(t.editor, Status.Inactive);
        // assert: should have 1 as id of first task, second is untouched
        expectedData = t.combineData(expectedData, { 2: [{time: new Date(), status: Status.Inactive}] });
        await t.expectTaskInData(expectedData);
        await t.expectTargetFile(`- [I] I am a task without ID id:1\n- [I] I am a task without ID also id:2`);
    })
}