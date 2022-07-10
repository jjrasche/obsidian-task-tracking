import * as React from "react";
import { useEffect, useState } from "react";
import { useTable } from "react-table"
import styled from 'styled-components'


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

export function TaskTrackingReactView() {
    const data = React.useMemo(() => [
        { col1: 'Hello', col2: 'World' },
        { col1: 'react-table', col2: 'rocks' },
        { col1: 'whatever', col2: 'you want' },
    ], [])
    const columns = React.useMemo(() => [
        { Header: 'Column 1', accessor: 'col1' as const },
        { Header: 'Column 2', accessor: 'col2' as const },
    ], []);
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({ columns, data }) 
    // const increase = () => {
    //     setCount(count+1);
    // }
 
    return (
        <Styles>
            <table {...getTableProps()}>
            <thead>
                {// Loop over the header rows
                headerGroups.map(headerGroup => (
                // Apply the header row props
                <tr {...headerGroup.getHeaderGroupProps()}>
                    {// Loop over the headers in each row
                    headerGroup.headers.map(column => (
                    // Apply the header cell props
                    <th {...column.getHeaderProps()}>
                        {// Render the header
                        column.render('Header')}
                    </th>
                    ))}
                </tr>
                ))}
            </thead>
            {/* Apply the table body props */}
            <tbody {...getTableBodyProps()}>
                {// Loop over the table rows
                rows.map(row => {
                // Prepare the row for display
                prepareRow(row)
                return (
                    // Apply the row props
                    <tr {...row.getRowProps()}>
                    {// Loop over the rows cells
                    row.cells.map(cell => {
                        // Apply the cell props
                        return (
                        <td {...cell.getCellProps()}>
                            {// Render the cell contents
                            cell.render('Cell')}
                        </td>
                        )
                    })}
                    </tr>
                )
                })}
            </tbody>
            </table>
        </Styles>
      )
}

