#### thoughts on logic flow
1. get current position from editor and check if currently on a task, if not, then return
1. get all tasks using dataview
1. filter out tasks without ID
1. transform dv tasks into ManagedTask
1. based on logic
  1. change data task-data.addSession
  1. change task file-manipulation.replaceLine


need to do both updates at once, - update data and change task in sourcefile