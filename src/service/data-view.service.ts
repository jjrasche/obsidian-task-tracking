import { DataviewApi, getAPI } from "obsidian-dataview";
import * as app from 'state/app.state';

let _api: DataviewApi;

export const api = (): DataviewApi => {
    if (!_api) {
        _api = getAPI(app.get()) as DataviewApi;
    }
    return _api;
}