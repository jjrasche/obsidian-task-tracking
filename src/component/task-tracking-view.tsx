import { App, MarkdownView } from "obsidian";
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
  } from '@tanstack/react-table'
import { Status, StatusWord } from "model/status";
import { ViewData } from "model/view-data.model";
import { updateTaskFromClick } from "service/modify-task.service";
import * as taskState from 'state/tasks.state';
import * as appState from 'state/app.state';


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

const navigate = (app: App, cell: any) => {
	const row = cell.row.original as ViewData;
	if (!!row) {
		const app = appState.get();
		app.workspace.openLinkText("", row.fileName ?? "").then(() => {
			const view = app.workspace.getActiveViewOfType(MarkdownView);
			const editor = view?.editor;
			console.log(editor);
			if (!!editor) {
				editor.scrollIntoView({ from: {line: row.line ?? 0, ch: 0}, to: {line: row.line ?? 0, ch: 0}}, true);
			}
		}); 
	}
}

const filterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
	let val: any = row.getValue(columnId);
	const columnDef = columns.find((col: any) => col.accessorKey === columnId);
	const cell = row.getAllCells().find(cell => cell.column.id === columnId)
	if (!!columnDef && !!columnDef.cell) {
		// val = columnDef.cell(cell);
	}
	return val.toString().toLowerCase().contains(value.toLowerCase());
}	

const columns: ColumnDef<ViewData>[] = [
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
	{ header: 'File', accessorKey: 'fileName', cell: (cell: any) => <a onClick={() => navigate(app, cell)}>{cell.getValue()}</a>, filterFn },
];


export function TaskTrackingReactView(): JSX.Element {
	const [loading, setLoading] = useState(true);
	const [tasks, setTasks] = useState<ViewData[]>([]);
	const [sorting, setSorting] = React.useState<SortingState>([{id: "lastActive", desc: true}])
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([{ id: "lastActive", value: (new Date()).toLocaleDateString("en-US", {month: 'short', day: '2-digit' }) }]);
	const table = useReactTable({ data: tasks, columns, state: { sorting, columnFilters }, onSortingChange: setSorting, onColumnFiltersChange: setColumnFilters, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel() });

	useEffect(() => {
		refresh()
		taskState.getChangeListener().subscribe(tasks => refresh());
		console.log("this should only get run once right?");
	}, []);
	useEffect(() => {
		if (table.getState().columnFilters[0]?.id === 'fullName') {
		  if (table.getState().sorting[0]?.id !== 'fullName') {
			table.setSorting([{ id: 'fullName', desc: false }])
		  }
		}
	  }, [table.getState().columnFilters[0]?.id])

	
	const refresh = () => {
		setLoading(true);
		taskState.getViewData().then((ts) => {
			setLoading(false);
			setTasks(ts);
		});
	}

	const rowClickHandler = async (row: ViewData, column: ColumnDef<ViewData, unknown>) => {
		if (column.id == "status") {
			updateTaskFromClick(row.id).then(() => refresh());
		}
	}
	  
	if (loading) {
		return <h2>loading</h2>
	} else {
		return (
			<Styles>
				{/* <button onClick={refresh}>Refresh</button> */}
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