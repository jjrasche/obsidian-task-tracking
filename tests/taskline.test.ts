import TestTaskTrackingPlugin from "./main.test";
import { expect } from "chai";

/*
    indented tasks are considered tasks
*/
export function TaskLineTests(t: TestTaskTrackingPlugin) {
    // t.test("if happy path task", async () => {
    //     // arrange
    //     const fileContent = "- [ ] not a task, just a line";
    //     await t.setupTest(fileContent)
    //     // act
    //     const line = new TaskLine(t.editor);
    //     // assert
    //     expect(line.isTask).to.be.true; 
    //     expect(line.prefix).to.eql("- [ ]");
    //     expect(line.taskID).to.be.NaN;
    //     expect(line.text).to.eql("not a task, just a line");
    //     expect(line.toString()).to.eql(fileContent);
    // });

    // t.test("indented task", async () => {
    //     // arrange
    //     const fileContent = "\t- [ ] not a task, just a line";
    //     await t.setupTest(fileContent)
    //     // act
    //     const line = new TaskLine(t.editor);
    //     // assert
    //     expect(line.isTask).to.be.true; 
    //     expect(line.prefix).to.eql("\t- [ ]");
    //     expect(line.taskID).to.be.NaN;
    //     expect(line.text).to.eql("not a task, just a line");
    //     expect(line.toString()).to.eql(fileContent);
    // });
    // t.test("task with taskID", async () => {
    //     // arrange
    //     const fileContent = "\t- [ ] not a task, just a line id:3847";
    //     await t.setupTest(fileContent)
    //     // act
    //     const line = new TaskLine(t.editor);
    //     // assert
    //     expect(line.isTask).to.be.true; 
    //     expect(line.prefix).to.eql("\t- [ ]");
    //     expect(line.taskID).to.eql(3847);
    //     expect(line.text).to.eql("not a task, just a line");
    //     expect(line.toString()).to.eql(fileContent);
    // });
}