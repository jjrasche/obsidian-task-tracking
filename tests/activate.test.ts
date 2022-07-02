import TestTodoTrackingPlugin from "./main.test";
import { DATA_FILE_NAME, delay, TARGET_FILE_NAME } from "./Util.test";
import { expect } from "chai";
import { activateTodo } from "logic";
import { SessionStatus } from "model";
import { MarkdownView } from "obsidian";

export function ActivateToDoTests(t: TestTodoTrackingPlugin) {
    // t.test("data validation: if current line is not a task, should not change task or data", async () => {
    //     // arrange
    //     const fileContent = "not a task, just a line"
    //     t.modifyFile(TARGET_FILE_NAME, fileContent);
    //     t.modifyFile(DATA_FILE_NAME, "[]");
    //     const editor = t.setCursorAndGetEditor(0, 5);
    //     // act
    //     await activateTodo(editor);
    //     // assert
    //     const data = await t.getData();
    //     await expect(data).to.eql([]);  // data file unchanged
    //     expect(await t.readFile(t.target_file)).to.eql(fileContent); // target file unchanged
    // });

    t.test("if current line is a task without a taskID and no other task is active, create one and add it to task and to data", async () => {
        // arrange
        const fileContent = "- [ ] I am a task without an ID";
        t.modifyFile(TARGET_FILE_NAME, fileContent);
        t.modifyFile(DATA_FILE_NAME, "{}");
        await delay(300);
        t.editor.setCursor(0, 5);
        // act
        const taskID = await activateTodo(t.editor, t.app) as number;
        await t.view.requestSave();
        await delay(2000);
        // assert
        const data = await t.getData();
        const targetFile = await t.readFile(t.target_file);
        expect(Object.keys(data)).to.have.lengthOf(1);                              // 1 task
        expect(data[taskID]).to.not.be.null;                                        // taskID exists 
        expect(data[taskID]).to.have.lengthOf(1);                                   // task has 1 session
        expect(data[taskID][0].status).to.eql(SessionStatus.active);                // session has active status
        expect(data[taskID][0].time)
            .lessThan(new Date())
            .greaterThan(new Date((new Date()).setSeconds(-10)));                   // session has active status
        expect(targetFile).to.eql(`- [ ] ${taskID} I am a task without an ID`);     // taskID added to selected task
    });
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