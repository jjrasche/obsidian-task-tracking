import TestTodoTrackingPlugin from "./main.test";
import { DATA_FILE_NAME, TARGET_FILE_NAME } from "./Util.test";
import { expect } from "chai";
import { activateTodo } from "logic";

export function ActivateToDoTests(t: TestTodoTrackingPlugin) {
    t.test("data validation: if current line is not a task, should not change task or data", async () => {
        // arrange
        const fileContent = "not a task, just a line"
        t.modifyFile(TARGET_FILE_NAME, fileContent);
        t.modifyFile(DATA_FILE_NAME, "[]");
        // const editor = t.setCursorAndGetEditor(0, 5);
        // act
        await activateTodo(t.editor);
        // assert
        const data = await t.getData();
        await expect(data).to.eql([]);  // data file unchanged
        expect(await t.readFile(t.target_file)).to.eql(fileContent); // target file unchanged
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