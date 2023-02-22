import * as React from "react";
import { Event  } from "../model/event";
import { useState } from "react";
import styled, { useTheme } from 'styled-components';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import { Status, StatusWord } from '../model/status';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import TextField from '@mui/material/TextField';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Grid, Paper } from "@mui/material";
import Box from '@mui/material/Box';

// const item = styled(Paper)(({theme}) => ({
//   backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
//   ...theme.typography.body2,
//   padding: theme.spacing(1),
//   textAlign: 'center',
//   color: theme.palette.text.secondary,
// }) )as typeof Paper;

export function EventComponent({event}: {event: Event}): JSX.Element {
  const [status, setStatus] = useState<Status>(event.status);
  const [time, setTime] = React.useState<Dayjs | null>( dayjs(event.time));

  return <Box className="event" sx={{ flexGrow: 1, backgroundColor: 'primary.dark', '&:hover': { backgroundColor: 'primary.main', opacity: [0.9, 0.8, 0.7] } }}>
  <Grid container spacing={2}>
    <Grid item xs={2}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateTimePicker
          label="Time"
          value={time}
          onChange={ (val) => setTime(val) }
          renderInput={(params) => <TextField {...params} />}
        />
      </LocalizationProvider>
    </Grid>
    <Grid item xs={2}>
      <FormControl fullWidth>
        <InputLabel>Status</InputLabel>
        <Select value={status} onChange={ (event) => setStatus(event.target.value as Status) }>
              { Object.keys(Status).filter((v) => !isNaN(Number(v))).map(key => <MenuItem value={parseInt(key)}>{Status[parseInt(key)]}</MenuItem> )}
        </Select>
      </FormControl>
    </Grid>
  </Grid>
</Box>
  // return <div>
  //   {/* <FormGroup row> */}
  //   return <Grid>
  //     <FormControl fullWidth>
  //       <InputLabel>Status</InputLabel>
  //       <Select value={status} onChange={ (event) => setStatus(event.target.value as Status) }>
  //             { Object.keys(Status).filter((v) => !isNaN(Number(v))).map(key => <Men item value={parseInt(key)}>{Status[parseInt(key)]}</MenuItem> )}
  //       </Select>
  //       {/* <FormControlLabel
  //         label="Status"
  //         control={
  //           <Select onChange={ (event) => setStatus(event.target.value as Status) }>
  //             { Object.keys(Status).filter((v) => !isNaN(Number(v))).map(key => <Men item value={parseInt(key)}>{Status[parseInt(key)]}</MenuItem> )}
  //           </Select>
  //         }
  //       /> */}
  //     </FormControl>
  //     <LocalizationProvider dateAdapter={AdapterDayjs}>
  //       <DateTimePicker
  //         label="Time"
  //         value={time}
  //         onChange={ (val) => setTime(val) }
  //         renderInput={(params) => <TextField {...params} />}
  //       />
  //     </LocalizationProvider>
  //   {/* </FormGroup> */}
  // {/* </div> */}
  // </Grid>
}
