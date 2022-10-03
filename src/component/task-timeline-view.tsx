import { View } from "obsidian";
import * as React from "react";
import { useEffect, useState } from "react";
import styled from 'styled-components'
import { Status } from "../model/status";
import { ViewData } from "../model/view-data.model";
import * as taskState from '../state/tasks.state';
import Chart from "react-google-charts";

const Styles = styled.div`
  
`

export function TaskTimelineView({ view }: { view: View }): JSX.Element {
	const [loading, setLoading] = useState(true);
	const [tasks, setTasks] = useState<ViewData[]>([]);

	useEffect(() => {
		refresh()
		taskState.getChangeListener().subscribe(tasks => refresh());
	}, []);


	const refresh = () => {
		setLoading(true);
		taskState.getViewData().then((ts) => {
			setLoading(false);
			setTasks(ts);
			const cd = ts.filter(task => !!task.timeSpentToday && task.timeSpentToday > 0)
				.map(task => ({ name: task.text ?? 'N/A', value: task.timeSpentToday ?? 0 }));
			console.log(`task is active\tid:${ts.find(t => t.status === Status.Active)?.id}\ttags:${ts.find(t => t.status === Status.Active)?.tags}`);
		});
	}

	return (
		<Styles>
			<Chart
				chartType="ScatterChart"
				data={[["Age", "Weight"], [4, 5.5], [8, 12]]}
				width="100%"
				height="400px"
				legendToggle
			/>
		</Styles>
	)
}