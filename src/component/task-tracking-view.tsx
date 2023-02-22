import { App, MarkdownView, Platform, Setting, TFile, View, EventRef } from "obsidian";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
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
	Table,
	aggregationFns,
} from '@tanstack/react-table'
import { Status, StatusIndicator, StatusWord } from "model/status";
import { ViewData } from "model/view-data.model";
import { updateTaskFromClick } from "service/modify-task.service";
import * as taskState from 'state/tasks.state';
import * as appState from 'state/app.state';
import * as settings from 'state/settings.state';
import { Task } from "model/task.model";
import * as dateService from 'service/date.service';
import { Pie, PieChart, ResponsiveContainer } from "recharts";
import { errorToConsoleAndFile } from "service/logging.service";
// import * as Autocomplete from "react-autocomplete";
import { AutoComplete, AutoCompleteItem } from "./autocomplete";
import { EventComponent } from "./event";
import { EventListComponent } from "./event-list";
import { Event } from "model/event";

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
	return date.toLocaleDateString("en-US", { month: 'short', day: '2-digit', year: '2-digit', hour: 'numeric', minute: 'numeric', hour12: false });
}

export const DateSimpleTimeFormatter = (cell: any): JSX.Element => {
	const date = cell.getValue();
	if (!date) {
		return BlankCellValue;
	}
	return date.toLocaleDateString("en-US", { hour: 'numeric', minute: 'numeric', hour12: false });
}


export const StringFormatter = (maxLength?: number): (cell: any) => JSX.Element => (cell: any) => {
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
	if (typeof (value) != "number") {
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
	if (typeof (seconds) != "number") {
		return InvalidCellValue;
	}
	return SecondsToTime(seconds) as any;
}

export const SecondsToTime = (seconds: number): string => {
	seconds = Math.trunc(seconds);
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor(seconds / 3600) % 24;
	const minutes = Math.floor(seconds / 60) % 60;
	const sec = seconds % 60;

	return `${days != 0 ? days.toString() + ':' : ''}${(days != 0 || hours != 0) ? hours.toString() + ':' : ''}${(days != 0 || hours != 0 || minutes != 0) ? minutes.toString() + ':' : ''}${sec}`;
}

const navigate = (app: App, cell: any) => {
	const row = cell.row.original as ViewData;
	if (!!row) {
		const app = appState.get();
		app.workspace.openLinkText("", row.fileName ?? "").then(() => {
			const view = app.workspace.getActiveViewOfType(MarkdownView);
			if (!!editor) {
				editor.scrollIntoView({ from: { line: row.line ?? 0, ch: 0 }, to: { line: row.line ?? 0, ch: 0 } }, true);
			}
		});
	}
}

const filterFn: FilterFn<any> = (row: Row<ViewData>, columnId, value) => {
	let val: any = (row.original as any)[columnId];
	// let val: any = row.getValue(columnId);
	const columnDef = getColumns().find((col: any) => col.accessorKey === columnId);
	// const cell = row.getAllCells().find(cell => cell.column.id === columnId)
	// if (!!columnDef && !!columnDef.cell) {
	// 	val = (columnDef as any).cell(cell);
	// }
	// always include certain tags
	// try {
	// 	const tags = row.getValue("tags") as string[];
	// 	let calculatedTags = tags.map(tag => tag.replace('#', '').split("/")[0]); // base tags
	// 	calculatedTags = calculatedTags.concat(tags.map(tag => tag.replace('#', ''))); // full tags
	// 	const includeTags = settings.get().alwaysIncludeTagsInView;
	// 	if (calculatedTags.some(tag => includeTags.includes(tag))) {
	// 		return true;
	// 	}
	// } catch (e) {
	// }
	if (columnDef?.cell === DateFormatter) {
		var dateFilterValue, dateCellVal;
		try {
			dateFilterValue = new Date(value);
			dateCellVal = new Date(val);
		} catch (e) {}
		return  !!dateFilterValue && !!dateCellVal && dateFilterValue <= dateCellVal;
	}
	return val.toString().toLowerCase().contains(value.toLowerCase());
}

type Agg = {agg: (table: any) =>  any}
const desktopColumns: ColumnDef<ViewData & Agg>[] = [
	{ id: 'status', header: 'Status', accessorKey: 'status', cell: (cell: any) => StatusWord[cell.getValue() as Status], filterFn },
	{ id: 'text', header: 'Text', accessorKey: 'text' },
	{ id: 'lastActive', header: 'Recent', accessorKey: 'lastActive', cell: DateFormatter, filterFn },
	{ id: 'tags', header: 'Tags', accessorKey: 'tags', cell: ArrayFormatter, filterFn },
	{ id: 'timeSpentToday', header: 'Time Spent Today', accessorKey: 'timeSpentToday', cell: TimeFormatter, filterFn },
	{ id: 'timeSpent', header: 'Time Spent', accessorKey: 'timeSpent', cell: TimeFormatter, filterFn },
	{ id: 'timeSpentThisSprint', header: 'Time Spent in Sprint', accessorKey: 'timeSpentThisSprint', cell: TimeFormatter, filterFn },
	{ id: 'timeToClose', header: 'Time To Close', accessorKey: 'timeToClose', cell: TimeFormatter, filterFn },
	{ id: 'numSwitches', header: '# Switches', accessorKey: 'numSwitches', filterFn },
	{ id: 'fileName', header: 'File', accessorKey: 'fileName', cell: (cell: any) => <a onClick={() => navigate(app, cell)}>{cell.getValue()}</a>, filterFn },
	{ id: 'id', header: 'ID', accessorKey: 'id' },
];

const mobileColumns: ColumnDef<ViewData & Agg>[] = [
	{ id: 'status', header: '', accessorKey: 'status', cell: (cell: any) => StatusIndicator[cell.getValue() as Status], filterFn },
	{ id: 'tags', header: 'tags', accessorKey: 'tags', cell: ArrayFormatter, filterFn },
	// { id: 'text', { header: 'text', accessorKey: 'text', cell: StringFormatter(20) },
	{ id: 'lastActive', header: 'recent', accessorKey: 'lastActive', cell: DateFormatter, filterFn },
	{ id: 'timeSpentToday', header: 'spent', accessorKey: 'timeSpentToday', cell: TimeFormatter, filterFn },
	{ id: 'fileName', header: 'file', accessorKey: 'fileName', cell: (cell: any) => <a onClick={() => navigate(app, cell)}>{cell.getValue()}</a>, filterFn },
];

const getColumns = (tableState: TableState = TableState.daily): ColumnDef<ViewData & Agg>[] => {
	const timeSpentKey = tableState === TableState.daily ? 'timeSpentToday' : 'timeSpent';
	let columns = Platform.isMobile ? mobileColumns : desktopColumns;
	// const columnNum = columns.findIndex(col => ["spent", "Time Spent", "daily", "all"].contains(col.header as string));
	// try {
	// 	(columns[columnNum]as any).accessorKey = timeSpentKey;
	// 	columns[columnNum].header = TableStateDisplay[tableState];
	// } catch (e) {
	// 	debugger;
	// }
	return columns;
}

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

const getTodaysSessionRanges = async (): Promise<SessionRange[]> => {
	const tasks = await taskState.get();
	const now = (new Date);
	const todayDate = now.toDateString();
	const sessionRanges: SessionRange[] = []
	tasks.forEach(task => {
		if (!!task.events) {
			task.events.forEach((active, idx) => {
				if (active.status === Status.Active) {
					sessionRanges.push(new SessionRange(task, active, task.events[idx + 1]));
				}
			});
		}
	})

	const todaysessionRanges = sessionRanges.filter(range => range?.end.toDateString() === todayDate || range?.start.toDateString() === todayDate)
	const trimmedSessionRanges = todaysessionRanges.map(range => range.trimDates());
	return trimmedSessionRanges;
}

enum TableState {
	daily,
	all
}

const TableStateDisplay: {[key in TableState]: string } = {
	[TableState.daily]: "daily",
	[TableState.all]: "all"
};

const dailyFilter = { id: "lastActive", value: (new Date()).toLocaleDateString("en-US", { month: 'short', day: '2-digit' }) };
const testFilter = { id: "id", value: "191" };


export function TaskTableView({ view }: { view: View }): JSX.Element {
	try {
	const [loading, setLoading] = useState(true);
	const [timeTracked, setTimeTracked] = useState("");
	const [percentTimeTracked, setPercentTimeTracked] = useState("");
	const [tasks, setTasks] = useState<ViewData[]>([]);
	const [tableState, setTableState] = useState<TableState>(TableState.daily);
	// const [table, setTable] = useState<Table<ViewData>>();
	const [columns, setColumns] = useState<ColumnDef<ViewData & Agg>[]>(getColumns());
	const [chartData, setChartData] = useState<{ name: string, value: number }[]>([]);
	const [sorting, setSorting] = React.useState<SortingState>([{ id: "lastActive", desc: true }]);
	// const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([dailyFilter]);
	const yesterday = new Date();
	// yesterday.setDate(yesterday.getDate() - 1);
	const date = yesterday;
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([{ id: "lastActive", value: date.toLocaleDateString("en-US", { month: 'short', day: '2-digit', year: '2-digit' }) }]);
	// const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	// const refreshTable = () => setTable(useReactTable({ data: tasks, columns, state: { sorting, columnFilters }, onSortingChange: setSorting, onColumnFiltersChange: setColumnFilters, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel() }));
	// refreshTable();
	const table = useReactTable({ data: tasks, columns: (columns as ColumnDef<ViewData, unknown>[]), state: { sorting, columnFilters }, onSortingChange: setSorting, onColumnFiltersChange: setColumnFilters, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel() });

	const totals = useMemo(() => {
		return columns.map(col => {
			if (!!col.id && (col.id).contains("timeSpent")) {
				const t = table.getFilteredRowModel().rows.map(r => r.original);
				return SecondsToTime(table.getFilteredRowModel().rows.map(r => r.original)
					.reduce((total, task) => total + ((task as any)[col.id as string] as number), 0));
			}
			return "-";
		})
	}, [columns, columnFilters, tasks]);

	useEffect(() => {
		refresh();
		setSorting([{ id: "lastActive", desc: true }]);
		taskState.getChangeListener().subscribe(tasks => refresh());
		// const interval = view.registerInterval(window.setInterval(async () => updateMetrics(), 1000));
		// return () => clearInterval(interval)
	}, []);


	// useEffect(() => {
	// 	console.log(`tableState: ${tableState}`);
	// 	const columns = getColumns(tableState);
	// 	console.log(`1\n${JSON.stringify(columns)}`);
	// 	setColumns(columns);
	// 	console.log(`in here\n${JSON.stringify(columns[columns.findIndex(col => ["spent", "Time Spent", "daily", "all"].contains(col.header as string))])}`)
	// 	// setColumnFilters([testFilter]);
	// }, [tableState]);


	const refresh = () => {
		setLoading(true);
		taskState.getViewData(date).then((ts) => {
			setLoading(false);
			setTasks(ts);
		});
	}

	const updateMetrics = async () => {
		const ranges = await getTodaysSessionRanges();
		const trackedSeconds = ranges.reduce((acc, cur) => acc + cur.duration, 0) / 1000;
		const time = SecondsToTime(trackedSeconds);
		setTimeTracked(time);
		// don't include sleeping so 7- 10:30 = 15.5 hours
		const timeSinceDayStart = new Date().getTime() - (new Date((new Date()).setHours(7))).getTime();
		const percentTimeTracked = ((trackedSeconds / (timeSinceDayStart / 1000)) * 100).toFixed(2) + '%';

		setPercentTimeTracked(percentTimeTracked);
	}

	const rowClickHandler = async (row: ViewData, column: ColumnDef<ViewData, unknown>) => {
		if (column.id !== "fileName") {
			handleTaskChange(row.id)
		}
	}
	const handleTaskChange = async (id: any) => {
		await updateTaskFromClick(id).then(() => refresh()); 
	}

	const data01 = [ { "name": "Group A", "value": 400 }, { "name": "Group B", "value": 300 }, { "name": "Group C", "value": 300 }, { "name": "Group D", "value": 200 }, { "name": "Group E", "value": 278 }, { "name": "Group F", "value": 189 }];
	const data02 = [ { "name": "Group A", "value": 2400 }, { "name": "Group B", "value": 4567 }, { "name": "Group C", "value": 1398 }, { "name": "Group D", "value": 9800 }, { "name": "Group E", "value": 3908 }, { "name": "Group F", "value": 4800 }];
	const testEventData = [
		{status: Status.Complete, time: new Date("01/25/2022")},
		{status: Status.Inactive, time: new Date("01/24/2022")},
		{status: Status.Active, time: new Date("01/23/2022")}
	];

	if (loading) {
		return <h2>loading</h2>
	} else {
		return (
			<Styles>
				{/* <EventComponent event={ {status: Status.Active, time: new Date()} }></EventComponent> */}
				{/* <EventListComponent events={testEventData}></EventListComponent> */}
				{/* <div>{timeTracked}</div>
				<div>{percentTimeTracked}</div>
				<ResponsiveContainer width={'99%'} height={300}>
					<PieChart width={730} height={250}>
						<Pie data={chartData} label={renderCustomizedLabel} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" />
					</PieChart>
				</ResponsiveContainer> */}
				<AutoComplete items={tasks
					.map(t => ({ display: t.text, key: t.id, lastUpdated: t.lastActive } as AutoCompleteItem))
					.sort((a,b) => b.lastUpdated.getTime() -  a.lastUpdated.getTime())
				} onSelectCallback={handleTaskChange}/>
				{/* <button onClick={() => setTableState((tableState + 1) % Object.keys(TableStateDisplay).length)}>{TableStateDisplay[tableState]}</button> */}
				<table>
					<thead>{table.getHeaderGroups().map(headerGroup => (
						<tr key={headerGroup.id}>{headerGroup.headers.map(header => (
							<th key={header.id} colSpan={header.colSpan}>
								{header.isPlaceholder ? null : (
									<>
										<div {...{ className: header.column.getCanSort() ? 'cursor-pointer select-none' : '', onClick: header.column.getToggleSortingHandler() }}>
											{flexRender(header.column.columnDef.header, header.getContext())}
											{{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
										</div>
										{header.column.getCanFilter() ? (
										<div>
											<input onChange={ e => header.column.setFilterValue(e.target.value) }/>
										</div>
									) : null}
									</>
								)}


							</th>
						))}
						</tr>
					))}
					</thead>
					<tbody>
						{table.getRowModel().rows.map(row => (
							<tr key={row.id}>{row.getVisibleCells().map(cell => (
								<td key={cell.id} onClick={async () => await rowClickHandler(row.original, cell.column)}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
							))}
							</tr>
						))}
						<tr> {totals.map((total, idx) => (
							<td key={columns[idx].id + ' total'} > {total}</td>
						))}</tr>
					</tbody>
				</table>
			</Styles>
		)
	}
	} catch(e) {
		errorToConsoleAndFile(e, true)
	}
}

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = (arg: { cx: number, cy: number, name: string, midAngle: number, innerRadius: number, outerRadius: number, percent: number }) => {
	const radius = arg.innerRadius + (arg.outerRadius - arg.innerRadius) * 1.25;
	const x = arg.cx + radius * Math.cos(-arg.midAngle * RADIAN);
	const y = arg.cy + radius * Math.sin(-arg.midAngle * RADIAN);
	const innerRadius = arg.innerRadius + (arg.outerRadius - arg.innerRadius) * .5;
	const xInner = arg.cx + innerRadius * Math.cos(-arg.midAngle * RADIAN);
	const yInner = arg.cy + innerRadius * Math.sin(-arg.midAngle * RADIAN);
	return (
		<>
			<text x={x} y={y} fill="white" textAnchor={x > arg.cx ? 'start' : 'end'} dominantBaseline="central">
				{arg.name}
			</text>
			<text x={xInner} y={yInner} fill="white" textAnchor={xInner > arg.cx ? 'start' : 'end'} dominantBaseline="central">
				{`${(arg.percent * 100).toFixed(0)}%`}
			</text>
		</>
	);
};