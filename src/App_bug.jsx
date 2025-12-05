// ModernReduxApp.jsx
import React, { useEffect, useState } from "react";
import { Provider, useSelector, useDispatch } from "react-redux";
import { configureStore, createSlice } from "@reduxjs/toolkit";

// -----------------------------
// SLICES (modern equivalent)
// -----------------------------
const itemsSlice = createSlice({
  name: "items",
  initialState: {
    byId: { "1": { id: "1", text: "TextContent Child" } },
    order: ["1"],
  },
  reducers: {
    add(state, action) {
      const id = String(Date.now());
      state.byId[id] = { id, text: action.payload };
      state.order.push(id);
    },
    delete(state, action) {
      const id = action.payload;
      delete state.byId[id];
      state.order = state.order.filter((x) => x !== id);
    },
  },
});

const flagsSlice = createSlice({
  name: "flags",
  initialState: { ping: 0 },
  reducers: {
    ping(state) {
      state.ping++;
    },
  },
});

const metaSlice = createSlice({
  name: "meta",
  initialState: { name: "demo" },
  reducers: {},
});

const extraSlice = createSlice({
  name: "extra",
  initialState: { val: 42 },
  reducers: {},
});

// -----------------------------
// STORE (modern)
// -----------------------------
const store = configureStore({
  reducer: {
    items: itemsSlice.reducer,
    flags: flagsSlice.reducer,
    meta: metaSlice.reducer,
    extra: extraSlice.reducer,
  },
});

// -----------------------------
// COMPONENTS
// -----------------------------

// ---------- PARENT ----------
function Parent() {
  const order = useSelector((s) => s.items.order);
  const hasItem = order.includes("1");

  useEffect(() => {});

  return (
    <div style={{ border: "2px solid black", padding: 12 }}>
      <h3>Parent (modern Redux)</h3>
      <Controls />
      {hasItem ? <Child id="1" /> : <div>(Child not rendered)</div>}

      <h2>Child ID 1, maybe buggy after delete</h2>
     
    </div>
  );
}

// ---------- CHILD ----------
function Child({ id }) {
  // ❗ EXACT SAME BUGGY SELECTOR
  const text = useSelector((s) => s.items.byId[id].text);

  useEffect(() => {});

  return (
    <div style={{ border: "1px dashed red", marginTop: 8, padding: 8 }}>
      <strong>Child</strong>
      <div>Item text: {text}</div>
    </div>
  );
}

// ---------- CONTROLS ----------
function Controls() {
  const dispatch = useDispatch();
  const [, setErr] = useState(null);
  const [, tick] = useState(0);

  const safeDelete = () => {
    try {
      dispatch(itemsSlice.actions.delete("1"));
    } catch (e) {
      setErr(String(e));
      tick((x) => x + 1);
      console.error("Caught error:", e);
    }
  };

  return (
    <div style={{ marginBottom: 8 }}>
      <button onClick={safeDelete}>Delete item '1'</button>

      <button
        onClick={() => dispatch(itemsSlice.actions.add("New item"))}
        style={{ marginLeft: 8 }}
      >
        Add item
      </button>

      <button
        onClick={() => dispatch(flagsSlice.actions.ping())}
        style={{ marginLeft: 8 }}
      >
        Ping flags
      </button>
    </div>
  );
}

// -----------------------------
// ROOT
// -----------------------------
export default function App() {
  return (
    <Provider store={store}>
      <div style={{ fontFamily: "sans-serif", padding: 20 }}>
        <h2>Redux Toolkit + React-Redux v9 — Same Delete Bug Test</h2>
        <p>Click "Delete". Modern Redux will throw.</p>
        <Parent />
      </div>
    </Provider>
  );
}
