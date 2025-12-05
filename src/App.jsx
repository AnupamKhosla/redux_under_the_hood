// App.jsx
import React, { useState, useMemo } from "react";
import {
  store,
  selectTaskOrder,
  makeSelectTask
} from "./reduxTree.js";
import { ReduxProvider, useStoreSelector } from "./reduxTreeReact.jsx";

export default function App() {
  return (
    <ReduxProvider>
      <div style={{ padding: 20 }}>
        <h2>Custom Redux Tasks</h2>
        <AddTask />
        <TaskList />
      </div>
    </ReduxProvider>
  );
}

/* ============================================
   Add Task
============================================ */
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

/* ============================================
   Task List
============================================ */
function TaskList() {
  const tasks = useStoreSelector(selectTaskOrder);

  return (
    <ul>
      {tasks.map((task) => (
        <TaskItem key={task.id} id={task.id} />
      ))}
    </ul>
  );
}

/* ============================================
   Single Task
============================================ */
function TaskItem({ id }) {
  const selector = useMemo(() => makeSelectTask(id), [id]);
  const task = useStoreSelector(selector);

  const [edit, setEdit] = useState(false);
  const [text, setText] = useState(task.text);

  const save = () => {
    store.dispatch({ type: "task/edit", id, text });
    setEdit(false);
  };

  return (
    <li>
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => store.dispatch({ type: "task/toggle", id })}
      />

      {edit ? (
        <>
          <input value={text} onChange={(e) => setText(e.target.value)} />
          <button onClick={save}>Save</button>
        </>
      ) : (
        <>
          <span style={{ textDecoration: task.done ? "line-through" : "none" }}>
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

      <button
        style={{ color: "red" }}
        onClick={() => store.dispatch({ type: "task/delete", id })}
      >
        Delete
      </button>
    </li>
  );
}
