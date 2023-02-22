import * as React from "react";
import { Event } from "../model/event";
import { useState } from "react";
import styled from 'styled-components';
import { EventComponent } from "./event";

const Styles = styled.div`
  padding: 1rem;
`

/*
  What editible actions do I see happening most often
  - updating the time to start or end earlier
  - remove an event -> accidentily made
  - adding an inactive event -> forgot to stop session so 1) create inactive event at point going to start 2) add an event around the time you really stopped 3) then set the statuses straight 
  x Out Of Scope: changing the task an event is associated with -> activated wrong task  . this logic seems hard to keep validations going... maybe there should be an undo and redo button that will take you to ...

  features
  - update an event's time or status
  - remove event
  - add event
  - inject a 2 event stop/start
  - show time between events 
  x change task -> remove then add 
  x choosing not to allow changing of an event's time outside the bounds of the previous and next events. I think this will allow tracking how youre changes are applied better, I imagine changing an event's time on a long running task with many events and losing track of where that changed event went. 


  validations (on save)
  - a task cannot have consecutive events with same status
  - an event's time must be greater than previouse event and less than next event

  questions
  - should the events be filtered by task 
*/
export function EventListComponent({events}: {events: Event[]}): JSX.Element {
	const [loading, setLoading] = useState(true);

    return (
        <Styles>
            {
              events.map(event => <EventComponent key={event.time.toString()} event={event}></EventComponent>)
            }
        </Styles>
    )
}