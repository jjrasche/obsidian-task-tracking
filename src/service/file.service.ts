import { TFile } from "obsidian";
import * as app from 'state/app.state';


/*
 war story: non deterministically, the vault.getFiles() method would not find my test files. 
 I dug into the code and got to about this point `return [2, this.fsPromises.readFile(t, "utf8")]` trying to understand
	why the root.children did not contain the test files. 
	Chose to switch to adapter, but still need to get the TFile somehow
*/
export const find = (fileName: string, attempt = false): TFile => {
	const f = app.get().vault.getFiles().find((f: TFile) => f.path.contains(fileName));
	if (!attempt && !f) {
		throw Error(`file ${fileName} not found.`);  
	}
	return f as TFile;
}

export const remove = async(path: string): Promise<boolean> => {
	try {
		await app.adapter().remove(path);
		return true;
	} catch (e) {
		return false;
	}
}

// export const create = async(fileName: string): Promise<TFile> => {
	
// 	// await new Promise(r => setTimeout(r, 200));
// 	// try { return await app.get().vault.create(fileName, "") } catch(e) { }
// 	// await new Promise(r => setTimeout(r, 200));
// 	// try { return await app.get().vault.create(fileName, "") } catch(e) { }
// 	// await new Promise(r => setTimeout(r, 200));
// 	try {
// 		app.adapter().write("");
// 	} catch(e) {
// 		return await find(fileName)      
// 	}
// }

export const read = async(path: string): Promise<string> => {
	return await app.adapter().read(path);
}

export const write = async(path: string, content: string = "") => {
	await app.adapter().write(path, content); 
}

// // import { readFileSync, writeFileSync } from "node:fs";
// import fs from 'fs'
// import * as app from 'state/app.state';

// // todo: consider going async
// export const read = (fileName: string): string => {
// 	// const path = fs.realpathSync();
// 	console.log(__dirname); 
// 	console.log(__filename); 
// 	console.log(app.get().vault.getRoot())
// 	return fs.readFileSync(`./${fileName}`, 'utf-8');
// }

// export const save = (fileName: string, fileContent: string) => {
// 	fs.writeFileSync(fileName, fileContent);
// }

// export const remove = (fileName: string) => {
// 	fs.rmSync(fileName);
// }


// // export const await find = (fileName: string, fileContent: string) => {
// // 	fs.find(fileName, fileContent);
// // }