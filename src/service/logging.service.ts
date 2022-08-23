import * as settings from 'state/settings.state';
import * as file from 'service/file.service';
import * as date from 'service/date.service';

export const toConsoleAndFile = async (message: string) => {
	console.log(message);
	await file.append(settings.get().logFileName, `${date.nowIso()}\ti\t${message}\n`);
}

export const errorToConsoleAndFile = async (message: string, shouldThrow = false) => {
	console.error(message);
	await file.append(settings.get().logFileName, `${date.nowIso()}\te\t${message}\n`);
	if (shouldThrow) {
		throw new Error(message);
	}
}