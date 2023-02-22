## Ideas for Output Functionality
?Is this more than reading the task.json file in dataview? A: 
could create a view

## Notes About Testing
- if tests start failing seemingly without reason, try restarting obsidian
- tests need to run inside of obsidian if any part of functionality needs access to the Obsidian API
- mock functionality you need to in the main.test.ts
  ```js
    statusBar: HTMLElement = {
        firstChild: null,
        createEl: () => {}
    } as unknown as HTMLElement;
  ```
- created a test runner with selective focusing on a test if it's name starts with `fff`
- couldn't figure out how to send both tests and plugin entry point files to Obsidian at same time, so when running tests, the testing code overrides main.js (esbuild)
- can use other plugins in your plugin if they've exported an API e.g. using DataView by installing the obsidian plugin
- if you need an editor open for your plugin to work, open a test file before running tests and set the cursor as needed
  ```js
    await this.app.workspace.getLeaf().openFile(this.target_file);
    this.editor.setCursor(line);
  ```

## Data Flow
  - triggers
    - command: Specify new state - A, I, C
    - Toggle: switch between Active and inactive 
      - click status bar
      - click view row
  - objects
    - data: {id: sessions[{time, status}]}
    - source: {text, status, id }
  - effects 
    - update status bar
    - write data
    - modify source task
  - functionality
    - getTasks: for output
    - get specific task(s) (most recently changed, all active)
    - update task (data + source)
      - update data: 1) add new session to task, 2) overwrite file
      - update source 2) update task line, 2) save file 
    - set statusbar
    - inactivate all active tasks
    - getNextTaskID
    - reconcile source and data: change the source status to match data status
  - files
    <!-- - Singleton Services -> allow for global state with the ability to mock 
      - App: get/set
      - settings: get/set
      - statusBar
      -->
    - ModifyTask (functions)
      - updateTaskFromEditor(app, editor): tries to get task from editor cursor, if task not tracked then adds to s
      - updateTaskFromClick(taskID): handles interaction with tasks when done by clicking (toggle)
      - changeTaskStatus(taskID, status): handles potential inactivating of all active tasks, calls statusBar change
    - Tas: create and manage tasks data
      - tasks: Task[]
      - constructor: create tasks object
      - getMostRecent(): Task
      - getAllActive(): Task[]
      - toData(): {[id: number]: Session[]}
      - saveChange(): update source, update data
    - TaskSourceService:
      - getAllTasks: using dataService, only tasks with the " id: ##" pattern
      * setup listeners on files to update tasks
    - TaskDataService:
      - getData(): {[id: number]: Session[]}
      - save(data: {[id: number]: Session[]})
    - FileService: readFile, overwriteFile 
      - ? if I change a file via `fs` will it trigger dataview update?
    - StatusBar: setStatusBar, initialize
    - task.model.ts: plain object
      - dirty bit;
      - toView(): ViewData
    - view-data.mode.ts: plain object
    - global data: private global data with setter and getter (app, settings, statusBar)
      - tasks: get, set, initialize

## Considerations
- batch task changes for data 
- atomic updates. may not be necessary as if source and data are out of sync, data takes precidence
- when do I need to refresh data
  - source: since text can change outside this application, need to update before every action
    - optimization might be able to listen to file changes to not have to reload sources  
  - data: only being modified by this application, so don't need to update it except on load 


## Questions
? does it make sense to keep a manageTask.sessions separate from taskData? as when modifying we will need the entire object anyway? A:
? should data be stored as true sesssion instead of list of events? A:
  - read: 

- how is session data used