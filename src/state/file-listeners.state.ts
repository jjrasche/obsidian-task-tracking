// import { TFile } from "obsidian";
// import { Task } from 'model/task.model';
// import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
// import * as app from 'state/app.state';

// let _fileListeners: { [fileName: string]: Observable<void> } = {};
// const fileChanged = BehaviorSubject

// export const add = async (fileName: string) => {
//     app.get().metadataCache.on("changed", (file: TFile) => doStuff(file))
// }

// export const remove = async (task: Task) => {

// }

// export const stop = async (task: Task) => {

// }

// export const getAllFilesListener = (): Observable<any> => {
//     return combineLatest(Object.keys(_fileListeners).map(fileName => _fileListeners[fileName]));
// }