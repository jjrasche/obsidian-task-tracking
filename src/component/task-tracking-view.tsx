import { App, MarkdownView, Platform, Setting, TFile, View, EventRef } from "obsidian";
import * as React from "react";
import { useEffect, useState } from "react";
import styled from 'styled-components'
import {
	ColumnDef,
	ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	SortingState,
	useReactTable,
	FilterFn,
	Row,
  } from '@tanstack/react-table'
import { Status, StatusIndicator, StatusWord } from "model/status";
import { ViewData } from "model/view-data.model";
import { updateTaskFromClick } from "service/modify-task.service";
import * as taskState from 'state/tasks.state';
import * as appState from 'state/app.state';
import * as settings from 'state/settings.state';
import { Session } from "model/session";
import { Task } from "model/task.model";
import * as dateService from 'service/date.service';



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

const BlankCellValue = <span>-</span>;
const InvalidCellValue = <b>error</b>;

export const DateFormatter = (cell: any): JSX.Element => {
	const date = cell.getValue();
	if (!date) {
		return BlankCellValue;
	}
	if (date === dateService.min) {
		return "-" as any;
	}
	return date.toLocaleDateString("en-US", {month: 'short', day: '2-digit', hour: 'numeric', minute: 'numeric', hour12: false});
}

export const DateSimpleTimeFormatter = (cell: any): JSX.Element => {
	const date = cell.getValue();
	if (!date) {
		return BlankCellValue;
	}
	return date.toLocaleDateString("en-US", {hour: 'numeric', minute: 'numeric', hour12: false});
}


export const StringFormatter = (maxLength?: number): (cell: any)=> JSX.Element => (cell: any) => {
	let value = cell.getValue();
	if (!value) {
		return BlankCellValue;
	}
	if (!!maxLength) {
		value = (value as string).substring(0, maxLength);
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
	return value.toFixed(precision) as any;
}

export const ArrayFormatter = (cell: any): JSX.Element => {
	const value = cell.getValue();
	if (!value) {
		return BlankCellValue;
	}
	if (!Array.isArray(value)) {
		return InvalidCellValue;
	}
	return value.join(", ") as any;
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
	return SecondsToTime(seconds) as any;
}

const SecondsToTime = (seconds: number): string => {
	seconds = Math.trunc(seconds);
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor(seconds / 3600) % 24;
	const minutes = Math.floor(seconds / 60) % 60;
	const sec = seconds % 60;
	
	return `${!!days ? days.toString() + ':' : ''}${!!hours ? hours.toString() + ':' : ''}${!!minutes ? minutes.toString() + ':' : ''}${sec}`;
} 

const navigate = (app: App, cell: any) => {
	const row = cell.row.original as ViewData;
	if (!!row) {
		const app = appState.get();
		app.workspace.openLinkText("", row.fileName ?? "").then(() => {
			const view = app.workspace.getActiveViewOfType(MarkdownView);
			const editor = view?.editor;
			if (!!editor) {
				editor.scrollIntoView({ from: {line: row.line ?? 0, ch: 0}, to: {line: row.line ?? 0, ch: 0}}, true);
			}
		}); 
	}
}

const filterFn: FilterFn<any> = (row: Row<ViewData>, columnId, value, addMeta) => {
	let val: any = row.getValue(columnId);
	const columnDef = getColumns().find((col: any) => col.accessorKey === columnId);
	const cell = row.getAllCells().find(cell => cell.column.id === columnId)
	if (!!columnDef && !!columnDef.cell) {
		val = (columnDef as any).cell(cell);
	}
	// always include certain tags
	try {
		const tags = row.getValue("tags") as string[];
		let calculatedTags = tags.map(tag => tag.replace('#', '').split("/")[0]); // base tags
		calculatedTags = calculatedTags.concat(tags.map(tag => tag.replace('#', ''))); // full tags
		const includeTags = settings.get().alwaysIncludeTagsInView;
		if (calculatedTags.some(tag => includeTags.includes(tag))) {
			return true;
		}
	} catch(e) {
		console.log(e);
	}
	return val.toString().toLowerCase().contains(value.toLowerCase());
}	

const desktopColumns: ColumnDef<ViewData>[] = [
	{ header: 'Status', accessorKey: 'status', cell: (cell: any) => StatusWord[cell.getValue() as Status], filterFn  },
	{ header: 'Text', accessorKey: 'text' },
	{ header: 'Recent', accessorKey: 'lastActive' , cell: DateFormatter, filterFn },
	{ header: 'Tags', accessorKey: 'tags', cell: ArrayFormatter, filterFn },
	{ header: 'Time Spent', accessorKey: 'timeSpent', cell: TimeFormatter, filterFn },
	{ header: 'Time To Close', accessorKey: 'timeToClose', cell: TimeFormatter, filterFn },
	{ header: '# Switches', accessorKey: 'numSwitches', filterFn },
	{ header: 'File', accessorKey: 'fileName', cell: (cell: any) => <a onClick={() => navigate(app, cell)}>{cell.getValue()}</a>, filterFn },
	{ header: 'ID', accessorKey: 'id' },
];
 
const mobileColumns: ColumnDef<ViewData>[] = [
	{ header: '', accessorKey: 'status', cell: (cell: any) => StatusIndicator[cell.getValue() as Status], filterFn  },
	{ header: 'text', accessorKey: 'text', cell: StringFormatter(20) },
	{ header: 'Recent', accessorKey: 'lastActive' , cell: DateFormatter, filterFn },
	// { header: 'recent', accessorKey: 'lastActive' , cell: DateSimpleTimeFormatter, filterFn },
	{ header: 'Tags', accessorKey: 'tags', cell: ArrayFormatter, filterFn },
	{ header: 'spent', accessorKey: 'timeSpent', cell: TimeFormatter, filterFn },
	// { header: 'File', accessorKey: 'fileName', cell: (cell: any) => <a onClick={() => navigate(app, cell)}>{cell.getValue()}</a>, filterFn },
];

const getColumns = (): ColumnDef<ViewData>[] => Platform.isMobile ? mobileColumns : desktopColumns;
// const getColumns = (): ColumnDef<ViewData>[] => mobileColumns;

class SessionRange {
	task: number;
	tags: string[];
	start: Date;
	end: Date;

	constructor(task: Task, active: Session, next?: Session) {
		this.task = task.id;
		this.tags = task.tags;
		this.start = active.time,
		this.end = !!next ? next.time : new Date()
	}

	// assumption can use new date variable as this will be called quickly after other related functionality
	trimDates(): this {
		const now = new Date()
		if (this.start.toDateString() !== now.toDateString()) {
			this.start = new Date(now.setTime(0));
		}
		return this;
	}

	get duration(): number {
		return this.end.getTime() - this.start.getTime();
	}
}

const getTodaysSessionRanges = async(): Promise<SessionRange[]> => {
	const tasks = await taskState.get();
	const now = (new Date);
	const todayDate = now.toDateString(); 
	const sessionRanges: SessionRange[] = []
	tasks.forEach(task => {
		if (!!task.sessions) {
			task.sessions.forEach((active, idx) => {
				if (active.status === Status.Active) {
					sessionRanges.push(new SessionRange(task, active, task.sessions[idx + 1]));
				}
			});
		}
	})

	const todaysessionRanges = sessionRanges.filter(range => range?.end.toDateString() === todayDate || range?.start.toDateString() === todayDate)
	const trimmedSessionRanges = todaysessionRanges.map(range => range.trimDates());
	return trimmedSessionRanges;
}


export function TaskTrackingReactView({ view }: { view: View }): JSX.Element {
	const [loading, setLoading] = useState(true);
	const [columns] = useState(getColumns());
	const [timeTracked, setTimeTracked] = useState("");
	const [percentTimeTracked, setPercentTimeTracked] = useState("");
	const [tasks, setTasks] = useState<ViewData[]>([]);
	const [sorting, setSorting] = React.useState<SortingState>([{id: "lastActive", desc: true}]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([{ id: "lastActive", value: (new Date()).toLocaleDateString("en-US", {month: 'short', day: '2-digit' }) }]);
	
	const table = useReactTable({ data: tasks, columns, state: { sorting, columnFilters }, onSortingChange: setSorting, onColumnFiltersChange: setColumnFilters, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel() });

	useEffect(() => { 
		refresh()
		setSorting([{id: "lastActive", desc: true}]);
		taskState.getChangeListener().subscribe(tasks => refresh());
		const interval = view.registerInterval(window.setInterval(async() => updateMetrics(), 1000));
		return () => clearInterval(interval)
	}, []);

	
	const refresh = () => {
		setLoading(true);
		taskState.getViewData().then((ts) => {
			setLoading(false);
			setTasks(ts);
			console.log(`task is active\tid:${ts.find(t => t.status === Status.Active)?.id}\ttags:${ts.find(t => t.status === Status.Active)?.tags}`);
		});
	}

	const updateMetrics = async() => {
		const ranges = await getTodaysSessionRanges();
		const trackedSeconds = ranges.reduce((acc, cur) =>  acc + cur.duration, 0) / 1000;
		const time = SecondsToTime(trackedSeconds);
		setTimeTracked(time);
		// don't include sleeping so 7- 10:30 = 15.5 hours
		const timeSinceDayStart = new Date().getTime() - (new Date((new Date()).setHours(7))).getTime();
		const percentTimeTracked = ((trackedSeconds / (timeSinceDayStart/1000)) * 100).toFixed(2) + '%';
		
		setPercentTimeTracked(percentTimeTracked);
	}

	const rowClickHandler = async (row: ViewData, column: ColumnDef<ViewData, unknown>) => {
		if (column.id !== "fileName") {
			await updateTaskFromClick(row.id).then(() => refresh());
		}
	}
	  
	if (loading) {
		return <h2>loading</h2>
	} else {
		return (
			<Styles>
				<div>{timeTracked}</div>
				<div>{percentTimeTracked}</div>
				<table>
					<thead>{table.getHeaderGroups().map(headerGroup => (
						<tr key={headerGroup.id}>{headerGroup.headers.map(header => (
							<th key={header.id} colSpan={header.colSpan}> 
							{ header.isPlaceholder ? null : (
								<>
									<div {...{ className: header.column.getCanSort() ? 'cursor-pointer select-none' : '', onClick: header.column.getToggleSortingHandler() }}>
										{ flexRender(header.column.columnDef.header, header.getContext()) }
										{{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
									</div>
									{/* {header.column.getCanFilter() ? (
										<div>
											<input onChange={ e => header.column.setFilterValue(e.target.value) }/>
										</div>
									) : null} */}
							  </>
							)}


						  </th>
						))}
						</tr>
					))}
					</thead>
					<tbody>{table.getRowModel().rows.map(row => (
						<tr key={row.id}>{row.getVisibleCells().map(cell => (
							<td key={cell.id} onClick={async () => await rowClickHandler(row.original, cell.column)}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
						))}
						</tr>
					))}
					</tbody>
				</table>
			</Styles>
		)
	}
}