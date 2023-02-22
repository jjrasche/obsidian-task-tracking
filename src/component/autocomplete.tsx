import * as React from "react";
import { useEffect, useState } from "react";

export interface AutoCompleteItem {
	display: string;
	key: number;
	lastUpdated: Date;
};

export function AutoComplete({items, onSelectCallback}: {items: AutoCompleteItem[], onSelectCallback: (id: number) => void}): JSX.Element {
	const [filteredItems, setFilteredItems] = useState<AutoCompleteItem[]>([]);
	const [filterValue, setFilterValue] = useState<string>('');

	useEffect(() => {
		const updatedFilteredItems = items.filter(item => getValue(item).contains(filterValue));
		setFilteredItems(updatedFilteredItems);
	}, [filterValue, items]);

	const getValue = (item: AutoCompleteItem): string => `${item.display} id:${item.key}`;

	return <div>
		<input list="items" 
			value={filterValue}
			onInput={(event) => {
				const value = (event.target as any).value;
				setFilterValue(value);
				/*
					I don't see a valid way to use onsubmit/onselect with react, so need to make some assumptions
					about when an item is selected
				*/
				if (/\sid:[0-9]+$/.test(value)) {
					const id = parseInt(value.match(/[0-9]+$/)[0]);
					onSelectCallback(id);
				}
			}}		
			/>
		<datalist id="items">
			{items.map(item => <option value={getValue(item)} key={item.key}></option>)}
		</datalist>
	</div>
}
