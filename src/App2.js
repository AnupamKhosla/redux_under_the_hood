import React, { useState, useMemo } from "react";
import {
  store,
  useStoreSelector,
  selectTaskOrder,
  makeSelectTask
} from "./redux2";

export default function App2() {
  return (
    <div style={{ padding: 20 }}>
      <h2>Redux2 Slice-Aware Demo</h2>
      <AddTask />
      <TaskList />
    </div>
  );
}

function AddTask() {
  const [t, setT] = useState("");

  return (
    <div>
      <input value={t} onChange={(e) => setT(e.target.value)} />
      <button
        onClick={() => {
          if (t.trim()) {
            store.dispatch({ type: "task/add", text: t });
            setT("");
          }
        }}
      >
        Add
      </button>
    </div>
  );
}

function TaskList() {
  const tasks = useStoreSelector(store, selectTaskOrder, ["tasks"]);
  return (
    <ul>
      {tasks.map((x) => (
        <TaskItem key={x.id} id={x.id} />
      ))}
    </ul>
  );
}

function TaskItem({ id }) {
  const selector = useMemo(() => makeSelectTask(id), [id]);
  const task = useStoreSelector(store, selector, ["tasks"]);

  const [txt, setTxt] = useState(task.text);
  const [edit, setEdit] = useState(false);

  return (
    <li>
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => store.dispatch({ type: "task/toggle", id })}
      />

      {edit ? (
        <>
          <input value={txt} onChange={(e) => setTxt(e.target.value)} />
          <button
            onClick={() => {
              store.dispatch({ type: "task/edit", id, text: txt });
              setEdit(false);
            }}
          >
            Save
          </button>
        </>
      ) : (
        <>
          <span style={{ textDecoration: task.done ? "line-through" : "" }}>
            {task.text}
          </span>
          <button
            onClick={() => {
              setTxt(task.text);
              setEdit(true);
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
