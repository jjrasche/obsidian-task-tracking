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