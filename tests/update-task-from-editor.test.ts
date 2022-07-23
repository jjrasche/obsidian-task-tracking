import TestTaskTrackingPlugin from "./main.test";
import { Status } from "model/status";
import { expect } from "chai";
import { updateTaskFromEditor } from "service/modify-task.service";
import * as tasks from 'state/tasks.state';

/*
    updateTaskFromEditor: editor is not defined
    updateTaskFromEditor: cursor is not defined
    updateTaskFromEditor: line is not a task
    updateTaskFromEditor: source task with no id will create new task in Tasks
    updateTaskFromEditor: source task with id will add session to Tasks
*/
export function UpdateTaskFromEditorTests(t: TestTaskTrackingPlugin) {
    t.test("editor is not defined", async () => {

    })
    t.test("cursor is not defined", async () => {

    })
    t.test("line is not a task", async () => {
        const fileContent = "not a task, just a line";
        const initialData = {};
        await t.setupEditorTest(fileContent, initialData);
        // act
        updateTaskFromEditor(t.editor, Status.Active);
        // assert
        expect(tasks.get()).to.eql([]);
    })
    t.test("if current task is same status, do nothing", async() => {
        // arrange
        const taskID = 12345;
        const fileContent = `- [C] I am a task without an ID id:${taskID}`;
        const initialData = {[taskID]: [{time: new Date(), status: Status.Complete}]};
        await t.setupEditorTest(fileContent, initialData); 
        // act
        await updateTaskFromEditor(t.editor, Status.Complete);
        // assert
        await t.expectNoChanges(fileContent, initialData);
     });

    t.test("source task with no id will create new task in Tasks", async () => {

    })
    t.test("source task with id will add session to Tasks", async () => {

    })
    // t.test("if current line is not a task, should not change task or data", async () => {
    //     // arrange
    //     const fileContent = "not a task, just a line";
    //     const initialData = {};
    //     await t.setupEditorTest(fileContent, initialData);
    //     // act
    //     await t.mts.changeCurrentTask(Status.Active);
    //     // assert
    //     await t.expectNoChanges(fileContent, initialData);
    // });
}