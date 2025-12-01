import React, { useState, useMemo } from "react";
import {
  store,
  useStoreSelector,
  selectTaskOrder,
  makeSelectTask,
} from "./redux.js";

export default function App() {
  return (
    <div style={{ padding: 20 }}>
      <h2>Custom Redux Tasks</h2>
      <AddTask />
      <TaskList />
    </div>
  );
}

/* -------------------------
   Add Task Component
   ------------------------- */
function AddTask() {
  const [text, setText] = useState("");

  const add = () => {
    if (text.trim()) {
      store.dispatch({ type: "task/add", text });
      setText("");
    }
  };

  return (
    <>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={add}>Add</button>
    </>
  );
}

/* -------------------------
   Task List Component
   ------------------------- */
function TaskList() {
  // Subscribe to the ordered list of task objects
  const tasks = useStoreSelector(store, selectTaskOrder);

  return (
    <ul>
      {tasks.map((task) => (
        <TaskItem key={task.id} id={task.id} />
      ))}
    </ul>
  );
}

/* -------------------------
   Single Task Component
   ------------------------- */
function TaskItem({ id }) {
  // Selector for this specific task
  const selector = useMemo(() => makeSelectTask(id), [id]);
  const task = useStoreSelector(store, selector);

  const [edit, setEdit] = useState(false);
  const [text, setText] = useState(task.text);

  const save = () => {
    store.dispatch({ type: "task/edit", id, text });
    setEdit(false);
  };

  return (
    <li>
      {/* Toggle checkbox */}
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => store.dispatch({ type: "task/toggle", id })}
      />{" "}

      {/* Edit or display mode */}
      {edit ? (
        <>
          <input value={text} onChange={(e) => setText(e.target.value)} />
          <button onClick={save}>Save</button>
        </>
      ) : (
        <>
          <span
            style={{
              textDecoration: task.done ? "line-through" : "none",
            }}
          >
            {task.text}
          </span>
          <button
            onClick={() => {
              setEdit(true);
              setText(task.text);
            }}
          >
            Edit
          </button>
        </>
      )}

      {/* Delete */}
      <button
        style={{ color: "red" }}
        onClick={() => store.dispatch({ type: "task/delete", id })}
      >
        Delete
      </button>
    </li>
  );
}
