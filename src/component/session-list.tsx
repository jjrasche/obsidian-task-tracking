// import { App, MarkdownView, Platform, Setting, TFile, View, EventRef } from "obsidian";
// import * as React from "react";
// import { useEffect, useState } from "react";
// import styled from 'styled-components'
// import {
// 	ColumnDef,
// 	ColumnFiltersState,
// 	flexRender,
// 	getCoreRowModel,
// 	getSortedRowModel,
// 	getFilteredRowModel,
// 	SortingState,
// 	useReactTable,
// 	FilterFn,
// 	Row,
// 	Table,
// } from '@tanstack/react-table'
// import { Status, StatusIndicator, StatusWord } from "model/status";
// import { ViewData } from "model/view-data.model";
// import { updateTaskFromClick } from "service/modify-task.service";
// import * as taskState from 'state/tasks.state';
// import * as appState from 'state/app.state';
// import * as settings from 'state/settings.state';
// import { Session } from "model/session";
// import { Task } from "model/task.model";
// import * as dateService from 'service/date.service';
// import { Pie, PieChart, ResponsiveContainer } from "recharts";
// import { errorToConsoleAndFile } from "service/logging.service";
// // import * as Autocomplete from "react-autocomplete";
// import { AutoComplete, AutoCompleteItem } from "./autocomplete";

// const Styles = styled.div`
//   padding: 1rem;

//   table {
//     border-spacing: 0;
//     border: 1px solid black;

//     tr {
//       :last-child {
//         td {
//           border-bottom: 0;
//         }
//       }
//     }

//     th,
//     td {
//       margin: 0;
//       padding: 0.5rem;
//       border-bottom: 1px solid black;
//       border-right: 1px solid black;

//       :last-child {
//         border-right: 0;
//       }
//     }
//   }
// `

// class SessionRange {
// 	task: number;
// 	tags: string[];
// 	start: Date;
// 	end: Date;	

// 	constructor(task: Task, active: Session, next?: Session) {
// 		this.task = task.id;
// 		this.tags = task.tags;
// 		this.start = active.time,
// 			this.end = !!next ? next.time : new Date()
// 	}

// 	// assumption can use new date variable as this will be called quickly after other related functionality
// 	trimDates(): this {
// 		const now = new Date()
// 		if (this.start.toDateString() !== now.toDateString()) {
// 			this.start = new Date(now.setTime(0));
// 		}
// 		return this;
// 	}

// 	get duration(): number {
// 		return this.end.getTime() - this.start.getTime();
// 	}
// }

// const getTodaysSessionRanges = async (): Promise<SessionRange[]> => {
// 	const tasks = await taskState.get();
// 	const now = (new Date);
// 	const todayDate = now.toDateString();
// 	const sessionRanges: SessionRange[] = []
// 	tasks.forEach(task => {
// 		if (!!task.sessions) {
// 			task.sessions.forEach((active, idx) => {
// 				if (active.status === Status.Active) {
// 					sessionRanges.push(new SessionRange(task, active, task.sessions[idx + 1]));
// 				}
// 			});
// 		}
// 	})

// 	const todaysessionRanges = sessionRanges.filter(range => range?.end.toDateString() === todayDate || range?.start.toDateString() === todayDate)
// 	const trimmedSessionRanges = todaysessionRanges.map(range => range.trimDates());
// 	return trimmedSessionRanges;
// }

// enum TableState {
// 	daily,
// 	all
// }

// const TableStateDisplay: {[key in TableState]: string } = {
// 	[TableState.daily]: "daily",
// 	[TableState.all]: "all"
// };

// const dailyFilter = { id: "lastActive", value: (new Date()).toLocaleDateString("en-US", { month: 'short', day: '2-digit' }) };
// const testFilter = { id: "id", value: "191" };


// export function TaskTableView({ view }: { view: View }): JSX.Element {
// 	try {
// 	const [loading, setLoading] = useState(true);
// 	const [timeTracked, setTimeTracked] = useState("");
// 	const [percentTimeTracked, setPercentTimeTracked] = useState("");
// 	const [tasks, setTasks] = useState<ViewData[]>([]);
// 	const [tableState, setTableState] = useState<TableState>(TableState.daily);
// 	// const [table, setTable] = useState<Table<ViewData>>();
// 	const [columns, setColumns] = useState<ColumnDef<ViewData>[]>(getColumns());
// 	const [chartData, setChartData] = useState<{ name: string, value: number }[]>([]);
// 	const [sorting, setSorting] = React.useState<SortingState>([{ id: "lastActive", desc: true }]);
// 	// const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([dailyFilter]);
// 	const yesterday = new Date();
// 	yesterday.setDate(yesterday.getDate());
// 	const date = yesterday;
// 	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([{ id: "lastActive", value: date.toLocaleDateString("en-US", { month: 'short', day: '2-digit', year: '2-digit' }) }]);
// 	// const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
// 	// const refreshTable = () => setTable(useReactTable({ data: tasks, columns, state: { sorting, columnFilters }, onSortingChange: setSorting, onColumnFiltersChange: setColumnFilters, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel() }));
// 	// refreshTable();
// 	console.log(`2tableState: ${tableState}`);
// 	console.log(`2\n${JSON.stringify(columns)}`);
// 	const table = useReactTable({ data: tasks, columns, state: { sorting, columnFilters }, onSortingChange: setSorting, onColumnFiltersChange: setColumnFilters, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel() });
// 	useEffect(() => {
// 		refresh()
// 		setSorting([{ id: "lastActive", desc: true }]);
// 		taskState.getChangeListener().subscribe(tasks => refresh());
// 		// const interval = view.registerInterval(window.setInterval(async () => updateMetrics(), 1000));
// 		// return () => clearInterval(interval)
// 	}, []);


// 	// useEffect(() => {
// 	// 	console.log(`tableState: ${tableState}`);
// 	// 	const columns = getColumns(tableState);
// 	// 	console.log(`1\n${JSON.stringify(columns)}`);
// 	// 	setColumns(columns);
// 	// 	console.log(`in here\n${JSON.stringify(columns[columns.findIndex(col => ["spent", "Time Spent", "daily", "all"].contains(col.header as string))])}`)
// 	// 	// setColumnFilters([testFilter]);
// 	// }, [tableState]);


// 	const refresh = () => {
// 		setLoading(true);
// 		taskState.getViewData(date).then((ts) => {
// 			setLoading(false);
// 			setTasks(ts);
// 		});
// 	}

// 	const updateMetrics = async () => {
// 		const ranges = await getTodaysSessionRanges();
// 		const trackedSeconds = ranges.reduce((acc, cur) => acc + cur.duration, 0) / 1000;
// 		const time = SecondsToTime(trackedSeconds);
// 		setTimeTracked(time);
// 		// don't include sleeping so 7- 10:30 = 15.5 hours
// 		const timeSinceDayStart = new Date().getTime() - (new Date((new Date()).setHours(7))).getTime();
// 		const percentTimeTracked = ((trackedSeconds / (timeSinceDayStart / 1000)) * 100).toFixed(2) + '%';

// 		setPercentTimeTracked(percentTimeTracked);
// 	}

// 	const rowClickHandler = async (row: ViewData, column: ColumnDef<ViewData, unknown>) => {
// 		if (column.id !== "fileName") {
// 			handleTaskChange(row.id)
// 		}
// 	}
// 	const handleTaskChange = async (id: any) => {
// 		await updateTaskFromClick(id).then(() => refresh()); 
// 	}

// 	const data01 = [ { "name": "Group A", "value": 400 }, { "name": "Group B", "value": 300 }, { "name": "Group C", "value": 300 }, { "name": "Group D", "value": 200 }, { "name": "Group E", "value": 278 }, { "name": "Group F", "value": 189 }];
// 	const data02 = [ { "name": "Group A", "value": 2400 }, { "name": "Group B", "value": 4567 }, { "name": "Group C", "value": 1398 }, { "name": "Group D", "value": 9800 }, { "name": "Group E", "value": 3908 }, { "name": "Group F", "value": 4800 }];


// 	if (loading) {
// 		return <h2>loading</h2>
// 	} else {
// 		return (
// 			<Styles>
// 				{/* <div>{timeTracked}</div>
// 				<div>{percentTimeTracked}</div>
// 				<ResponsiveContainer width={'99%'} height={300}>
// 					<PieChart width={730} height={250}>
// 						<Pie data={chartData} label={renderCustomizedLabel} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" />
// 					</PieChart>
// 				</ResponsiveContainer> */}
// 				<AutoComplete items={tasks.map(t => ({ display: t.text, key: t.id } as AutoCompleteItem))} onSelectCallback={handleTaskChange}/>
// 				{/* <button onClick={() => setTableState((tableState + 1) % Object.keys(TableStateDisplay).length)}>{TableStateDisplay[tableState]}</button> */}
// 				<table>
// 					<thead>{table.getHeaderGroups().map(headerGroup => (
// 						<tr key={headerGroup.id}>{headerGroup.headers.map(header => (
// 							<th key={header.id} colSpan={header.colSpan}>
// 								{header.isPlaceholder ? null : (
// 									<>
// 										<div {...{ className: header.column.getCanSort() ? 'cursor-pointer select-none' : '', onClick: header.column.getToggleSortingHandler() }}>
// 											{flexRender(header.column.columnDef.header, header.getContext())}
// 											{{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
// 										</div>
// 										{header.column.getCanFilter() ? (
// 										<div>
// 											<input onChange={ e => header.column.setFilterValue(e.target.value) }/>
// 										</div>
// 									) : null}
// 									</>
// 								)}


// 							</th>
// 						))}
// 						</tr>
// 					))}
// 					</thead>
// 					<tbody>{table.getRowModel().rows.map(row => (
// 						<tr key={row.id}>{row.getVisibleCells().map(cell => (
// 							<td key={cell.id} onClick={async () => await rowClickHandler(row.original, cell.column)}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
// 						))}
// 						</tr>
// 					))}
// 					</tbody>
// 				</table>
// 			</Styles>
// 		)
// 	}
// 	} catch(e) {
// 		errorToConsoleAndFile(e, true)
// 	}
// }

// const RADIAN = Math.PI / 180;

// const renderCustomizedLabel = (arg: { cx: number, cy: number, name: string, midAngle: number, innerRadius: number, outerRadius: number, percent: number }) => {
// 	const radius = arg.innerRadius + (arg.outerRadius - arg.innerRadius) * 1.25;
// 	const x = arg.cx + radius * Math.cos(-arg.midAngle * RADIAN);
// 	const y = arg.cy + radius * Math.sin(-arg.midAngle * RADIAN);
// 	const innerRadius = arg.innerRadius + (arg.outerRadius - arg.innerRadius) * .5;
// 	const xInner = arg.cx + innerRadius * Math.cos(-arg.midAngle * RADIAN);
// 	const yInner = arg.cy + innerRadius * Math.sin(-arg.midAngle * RADIAN);
// 	return (
// 		<>
// 			<text x={x} y={y} fill="white" textAnchor={x > arg.cx ? 'start' : 'end'} dominantBaseline="central">
// 				{arg.name}
// 			</text>
// 			<text x={xInner} y={yInner} fill="white" textAnchor={xInner > arg.cx ? 'start' : 'end'} dominantBaseline="central">
// 				{`${(arg.percent * 100).toFixed(0)}%`}
// 			</text>
// 		</>
// 	);
// };