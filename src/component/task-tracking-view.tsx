import { App } from "obsidian";
import { Session } from "model/session";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import styled from 'styled-components'
import { TaskDataService, TaskDataType } from "task-data.service";
import { Settings } from "settings";
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
  } from '@tanstack/react-table'
import { DataViewService } from "data-view.service";
import { Status, StatusIndicator, StatusWord } from "model/status";
import { ManagedTask } from "model/managed-task";


const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
`


export class RowData {
	id: string;
	status: Status;
	text?: string;
	start: Date;
	end?: Date;
	timeSpent?: number;	// in seconds
	timeToClose?: number;	// in seconds
	numSwitches: number;
	fileName?: string;
	tags: string[];
};

function convertToList(data: TaskDataType, tasks: ManagedTask[]): RowData[] {
	const ids = Object.keys(data);
	"#hello laskdjf #five".matchAll(/\#.+\s/g)
	return ids.map(id => {
		const sessions = data[id];
		const timeSpent = sessions.reduce((acc, cur, idx) => {
			if (cur.status === Status.Active) {
				const next = sessions[idx+1] ?? {time: new Date()};
				const currentSessionLength = (next.time.getTime() - cur.time.getTime())/1000;
				return acc + currentSessionLength;
			}
			return acc;
		}, 0);
		const matchingTask = tasks.find(task => (!!task.taskID ? task.taskID.toString() === id : undefined));
		let textWords = matchingTask?.text.split(/\s/);
		while(textWords?.last()?.contains("#")) {
			textWords.pop();
		}
		textWords = textWords?.map(w => w.replace("#", ""));
		const text = textWords?.join(" ");
		const first = sessions[0];
		const last = sessions[sessions.length - 1];
		return {
			id,
			status: last.status,
			text,
			start: sessions[0].time,
			end: !!sessions.last() ? (sessions.last() as Session).time : undefined,
			timeSpent,
			timeToClose: (!!last && last.status === Status.Complete) ? ((last.time.getTime() - first.time.getTime()) / 1000) : undefined,
			numSwitches: sessions.filter(session => session.status === Status.Active).length,
			fileName: matchingTask?.path,
			tags: !!matchingTask?.text ? [...matchingTask?.text.matchAll(/#[^\s]*/g)].map(f => f[0].replace("#", "")) : []
		};
	});
}

const BlankCellValue = <span>-</span>;
const InvalidCellValue = <b>error</b>;

export const DateFormatter = (cell: any): JSX.Element => {
	const date = cell.getValue();
	if (!date) {
		return BlankCellValue;
	}
	return <span>{date.toLocaleDateString("en-US", {month: 'short', day: '2-digit', hour: 'numeric', minute: 'numeric'})}</span>;
}

export const StringFormatter = (cell: any): JSX.Element => {
	const value = cell.getValue();
	if (!value) {
		return BlankCellValue;
	}
	return <span>{value}</span>;
}

export const NumberFormatter = (precision: number = 2) => (cell: any): JSX.Element => {
	const value = cell.getValue();
	if (!value) {
		return BlankCellValue;
	}
	if (typeof(value) != "number") {
		return InvalidCellValue;
	}
	return <span>{value.toFixed(precision)}</span>;
}

export const ArrayFormatter = (cell: any): JSX.Element => {
	const value = cell.getValue();
	if (!value) {
		return BlankCellValue;
	}
	if (!Array.isArray(value)) {
		return InvalidCellValue;
	}
	return <span>{value.join(", ")}</span>;
}

// dd:HH:mm:SS
export const TimeFormatter = (cell: any): JSX.Element => {
	let seconds = cell.getValue();
	if (!seconds) {
		return BlankCellValue;
	}
	if (typeof(seconds) != "number") {
		return InvalidCellValue;
	}
	seconds = Math.trunc(seconds);
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor(seconds / 3600) % 24;
	const minutes = Math.floor(seconds / 60) % 60;
	const sec = seconds % 60;
	
	return <span>{!!days ? `${days}:` : ''}{!!hours ? `${hours}:` : ''}{!!minutes ? `${minutes}:` : ''}{sec}</span>;
}

// id, text, start, end, time spent, ttc
const columns: ColumnDef<RowData>[] = [
	// { header: 'ID', accessorKey: 'id' },
	{ header: 'Status', accessorKey: 'status', cell: (cell: any) => <span>{StatusWord[cell.getValue() as Status]}</span>},
	{ header: 'Text', accessorKey: 'text', cell: (cell: any) => {
		console.log(cell);
		return <a href={`obsidian://open?vault=everything&file=${cell.row.original.fileName}`}>{cell.getValue()}</a>}
	},
	{ header: 'Began', accessorKey: 'start', cell: DateFormatter },
	{ header: 'Completed', accessorKey: 'end' , cell: DateFormatter },
	{ header: 'Time Spent', accessorKey: 'timeSpent', cell: TimeFormatter },
	{ header: 'Time To Close', accessorKey: 'timeToClose', cell: TimeFormatter },
	{ header: '# Switches', accessorKey: 'numSwitches' },
	{ header: 'Tags', accessorKey: 'tags', cell: ArrayFormatter},
];


export function TaskTrackingReactView({ app, settings }: { app: App, settings: Settings }): JSX.Element {
	const [loading, setLoading] = useState<boolean>(true);
	const [data, setData] = useState<RowData[]>([]);
	const tasks = useMemo(() => new DataViewService(app).getManagedTasks(), []);

	useEffect(() => {
		setLoading(true);
		new TaskDataService(app, settings).setup().then((tds) => {
			setLoading(false);
			setData(convertToList(tds.data, tasks));
		}).catch((e) => {
			console.error(`catch\n${e}`);
		})
	}, [convertToList]);

	const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

	if (loading) {
		return <h2>loading</h2>
	} else {
		return (
			<Styles>
				<table>
					<thead>{table.getHeaderGroups().map(headerGroup => (
						<tr key={headerGroup.id}>{headerGroup.headers.map(header => (
							<th key={header.id}> {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</th>
						))}
						</tr>
					))}
					</thead>
					<tbody>{table.getRowModel().rows.map(row => (
						<tr key={row.id}>{row.getVisibleCells().map(cell => (
							<td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
						))}
						</tr>
					))}
					</tbody>
				</table>
			</Styles>
		)
	}
}


