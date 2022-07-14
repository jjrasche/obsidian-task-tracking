import { App } from "obsidian";
import { Session } from "model/session";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import styled from 'styled-components'
import { TaskDataService, TaskDataType } from "task-data.service";
import { Settings } from "settings";
import {
	Column,
	ColumnDef,
	ColumnFiltersState,
	ColumnSort,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	SortingState,
	Table,
	useReactTable,
	FilterFn,
  } from '@tanstack/react-table'
import { DataViewService } from "data-view.service";
import { Status, StatusIndicator, StatusWord } from "model/status";
import { ManagedTask } from "model/managed-task";
import { ModifyTaskService } from "modify-task.service";


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
	id: number;
	status: Status;
	text?: string;
	start: Date;
	lastActive: Date;
	timeSpent?: number;	// in seconds
	timeToClose?: number;	// in seconds
	numSwitches: number;
	fileName?: string;
	tags: string[];
};

function convertToList(data: TaskDataType, tasks: ManagedTask[]): RowData[] {
	const ids = Object.keys(data).map(id => parseInt(id));
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
		const matchingTask = tasks.find(task => (!!task.taskID ? task.taskID === id : undefined));
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
			lastActive: new Date(Math.max(...sessions.filter(s => s.status === Status.Active).map(session => session.time.getTime()))),
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
	return date.toLocaleDateString("en-US", {month: 'short', day: '2-digit', hour: 'numeric', minute: 'numeric', hour12: false});
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
	seconds = Math.trunc(seconds);
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor(seconds / 3600) % 24;
	const minutes = Math.floor(seconds / 60) % 60;
	const sec = seconds % 60;
	
	return `${!!days ? days.toString() + ':' : ''}${!!hours ? hours.toString() + ':' : ''}${!!minutes ? minutes.toString() + ':' : ''}${sec}` as any;
}

const filterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
	let val: any = row.getValue(columnId);
	const columnDef = columns.find((col: any) => col.accessorKey === columnId);
	const cell = row.getAllCells().find(cell => cell.column.id === columnId)
	if (!!columnDef && !!columnDef.cell) {
		val = columnDef.cell(cell);
	}
	return val.toString().toLowerCase().contains(value);
}

// id, text, start, end, time spent, ttc
const columns: ColumnDef<RowData>[] = [
	// { header: 'ID', accessorKey: 'id' },
	{ header: 'Status', accessorKey: 'status', cell: (cell: any) => StatusWord[cell.getValue() as Status], filterFn  },
	{ header: 'Text', accessorKey: 'text' },
	// { header: 'First', accessorKey: 'start', cell: DateFormatter },
	// { header: 'Last', accessorKey: 'end' , cell: DateFormatter },
	{ header: 'Recent', accessorKey: 'lastActive' , cell: DateFormatter, filterFn },
	{ header: 'Tags', accessorKey: 'tags', cell: ArrayFormatter, filterFn },
	{ header: 'Time Spent', accessorKey: 'timeSpent', cell: TimeFormatter, filterFn },
	{ header: 'Time To Close', accessorKey: 'timeToClose', cell: TimeFormatter, filterFn },
	{ header: '# Switches', accessorKey: 'numSwitches', filterFn },
	{ header: 'File', accessorKey: 'fileName', cell: (cell: any) => <a href={`obsidian://open?vault=everything&file=${cell.row.original.fileName}`}>{cell.getValue()}</a>, filterFn },
];

export function TaskTrackingReactView({ app, settings }: { app: App, settings: Settings }): JSX.Element {
	const [taskData, setTaskData] = useState<RowData[]>([]);
	const [dvs] = useState<DataViewService>(new DataViewService(app));
	const [taskSources, setTaskSource] = useState<ManagedTask[]>([]);
	const [mts, setMTS] = useState<ModifyTaskService>();
	const [sorting, setSorting] = React.useState<SortingState>([{id: "lastActive", desc: true}])
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

	useEffect(() => {
		setTaskSource(dvs.getManagedTasks())
	}, []);
	useEffect(() => {
		new TaskDataService(app, settings).setup()
			.then((tds) => {
				setTaskData(convertToList(tds.data, taskSources));
			})
			.catch((e) => console.error(e))
	}, [taskSources]);

	useEffect(() => {
		new ModifyTaskService(app, settings).setup()
			.then((mts) => setMTS(mts))
			.catch((e) => console.error(e))
	}, []);

	const rowClickHandler = async (row: RowData, column: ColumnDef<RowData, unknown>) => {
		if (column.id == "status") {
			const currentTask = taskSources.find(task => task.taskID === row.id);
			if (!currentTask) {
				console.error(`could not find task in source with ID ${row.id}`);
				return;
			}
			await mts?.modifyandSaveExistingTask(currentTask, Status.Active);
			setTaskSource(dvs.getManagedTasks());
		}
	}

	const refresh = () => {
		// todo
	}

	// const table = useMemo(() => useReactTable({ data: taskData, columns, getCoreRowModel: getCoreRowModel() }), [taskData]);
	const table = useReactTable({ data: taskData, columns, state: { sorting, columnFilters }, onSortingChange: setSorting, onColumnFiltersChange: setColumnFilters, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel() });

	React.useEffect(() => {
		if (table.getState().columnFilters[0]?.id === 'fullName') {
		  if (table.getState().sorting[0]?.id !== 'fullName') {
			table.setSorting([{ id: 'fullName', desc: false }])
		  }
		}
	  }, [table.getState().columnFilters[0]?.id])
	  
	if (!taskData || !mts) {
		return <h2>loading</h2>
	} else {
		return (
			<Styles>
				<table>
					<thead>{table.getHeaderGroups().map(headerGroup => (
						<tr key={headerGroup.id}>{headerGroup.headers.map(header => (
							// <th key={header.id}> {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</th>
							<th key={header.id} colSpan={header.colSpan}> { header.isPlaceholder ? null : (
								<>
									<div {...{ className: header.column.getCanSort() ? 'cursor-pointer select-none' : '', onClick: header.column.getToggleSortingHandler() }}>
										{ flexRender(header.column.columnDef.header, header.getContext()) }
										{{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
									</div>
									{header.column.getCanFilter() ? (
										<div>
											<input onChange={e => {
												// console.log(header.column);
												const val = e.target.value;
												header.column.setFilterValue(val);
												// console.log(header.column.getFilterValue());
												// debugger;
												// table.getAllColumns().forEach(col => {
												// 	if (!!col.getFilterValue()) {
												// 		console.log(`${col.getFilterValue()}`);
												// 	}
												// })
											}}/>
										</div>
									) : null}
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




// export function Filter({ column, table }: { column: Column<any, unknown>, table: Table<any> }) {
// 	const firstValue = table
// 	  .getPreFilteredRowModel()
// 	  .flatRows[0]?.getValue(column.id)
  
// 	const columnFilterValue = column.getFilterValue()
  
// 	const sortedUniqueValues = React.useMemo(() =>
// 		typeof firstValue === 'number' ? [] : Array.from(column.getFacetedUniqueValues().keys()).sort(),
// 		[column.getFacetedUniqueValues()]
// 	);
  
// 	return typeof firstValue === 'number' ? (
// 	  <div>
// 		<div className="flex space-x-2">
// 		  <DebouncedInput
// 			type="number"
// 			min={Number(column.getFacetedMinMaxValues()?.[0] ?? '')}
// 			max={Number(column.getFacetedMinMaxValues()?.[1] ?? '')}
// 			value={(columnFilterValue as [number, number])?.[0] ?? ''}
// 			onChange={value =>
// 			  column.setFilterValue((old: [number, number]) => [value, old?.[1]])
// 			}
// 			placeholder={`Min ${
// 			  column.getFacetedMinMaxValues()?.[0]
// 				? `(${column.getFacetedMinMaxValues()?.[0]})`
// 				: ''
// 			}`}
// 			className="w-24 border shadow rounded"
// 		  />
// 		  <DebouncedInput
// 			type="number"
// 			min={Number(column.getFacetedMinMaxValues()?.[0] ?? '')}
// 			max={Number(column.getFacetedMinMaxValues()?.[1] ?? '')}
// 			value={(columnFilterValue as [number, number])?.[1] ?? ''}
// 			onChange={value =>
// 			  column.setFilterValue((old: [number, number]) => [old?.[0], value])
// 			}
// 			placeholder={`Max ${
// 			  column.getFacetedMinMaxValues()?.[1]
// 				? `(${column.getFacetedMinMaxValues()?.[1]})`
// 				: ''
// 			}`}
// 			className="w-24 border shadow rounded"
// 		  />
// 		</div>
// 		<div className="h-1" />
// 	  </div>
// 	) : (
// 	  <>
// 		<datalist id={column.id + 'list'}>
// 		  {sortedUniqueValues.slice(0, 5000).map((value: any) => (
// 			<option value={value} key={value} />
// 		  ))}
// 		</datalist>
// 		<input value={(columnFilterValue ?? '') as string} onChange={value => column.setFilterValue(value)}/>
// 		<div className="h-1" />
// 	  </>
// 	)
//   }