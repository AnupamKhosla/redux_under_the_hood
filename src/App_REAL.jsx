// App.js — Reduced version: only 3 reducers and 3 actions.

import React, { useState, useSyncExternalStore } from "react";

// =======================================================
// Minimal Redux implementation (unchanged)
// =======================================================

function createStore(reducer) {
  let state = reducer(undefined, { type: "@@INIT" });
  let listeners = new Set();
  function listenerCount() {
      return listeners.size;;
    }
  return {
    listenerCount() {
      return listeners.size;;
    },
    getState() { 
      return state;
    },
    subscribe(fn) {
      listeners.add(fn);
      console.log("Subscribed listener", listenerCount(), fn.toString());
      return () => {        
        listeners.delete(fn);   
        console.log("Unsubscribed listener", listenerCount(), fn.toString());};     
    },
    dispatch(action) {
      state = reducer(state, action);
      for (const l of Array.from(listeners).reverse()) {
        l();
        console.log("Notified listener", l.toString());
      }
      return action;
    },
  };
}

function combineReducers(reducers) {
  return (state = {}, action) => {
    const next = {};
    for (const key in reducers) next[key] = reducers[key](state[key], action);
    return next;
  };
}



function useStoreSelector(store, selector) {
  return useSyncExternalStore(
    store.subscribe,
    function mySnapshot (){ return selector(store.getState()) }
  );
}

// =======================================================
// Reducers
// =======================================================

const initialItems = {
  byId: {
    "1": { id: "1", text: "First Child" },
    
  },
  order: ["1"],
};

function itemsReducer(state = initialItems, action) {
  switch (action.type) {
    case "item/add": {
      const id = String(Date.now());
      return {
        byId: { ...state.byId, [id]: { id, text: action.text } },
        order: [...state.order, id],
      };
    }

    case "item/delete": {
      const id = action.id;
      const { [id]: _, ...rest } = state.byId;
      return {
        byId: rest,
        order: state.order.filter((x) => x !== id),
      };
    }

    case "item/updateText": {
      const { id, text } = action;
      if (!state.byId[id]) return state; // ignore if missing
      return {
        byId: {
          ...state.byId,
          [id]: { ...state.byId[id], text },
        },
        order: state.order,
      };
    }

    default:
      return state;
  }
}

function metaReducer(state = { name: "demo" }, action) {
  return state;
}

function extraReducer(state = { val: 42 }, action) {
  return state;
}

const rootReducer = combineReducers({
  items: itemsReducer,
  meta: metaReducer,
  extra: extraReducer,
});

// Store
const store = createStore(rootReducer);

// =======================================================
// UI Components
// =======================================================

function Parent() {
  const hasItem = useStoreSelector(store, (state) =>
    state.items.order.includes("1")
  );

  const state = store.getState();
  console.log("Parent render, hasItem =", hasItem);  
  return (
    <div style={{ border: "2px solid black", padding: 12 }}>
      <h3>Parent (renders child only when item exists)</h3>
      <Controls />
      {hasItem ? <Child id="1" /> : <div>(Child not rendered)</div>}      
    </div>
  );
}

function Child({ id }) {

  console.log("Child render, id =", id, "count =", store.listenerCount());
  const text = useStoreSelector(store, (state) => state.items.byId[id].text);
  return (
    <div style={{ border: "1px dashed red", marginTop: 8, padding: 8 }}>
      <strong>Child</strong>
      <div>Item text: {text}</div>
    </div>
  );
}

function Controls() {
  const [, setErr] = useState(null);
  const [, tick] = useState(0);

  const safeDelete = () => {
    store.dispatch({ type: "item/delete", id: "1" });  
  };

  const add = () =>
    store.dispatch({ type: "item/add", text: "New item " + Date.now() });

  const update = () =>
    store.dispatch({
      type: "item/updateText",
      id: "1",
      text: "UPDATED " + Date.now(),
    });

  return (
    <div style={{ marginBottom: 8 }}>
      <button onClick={safeDelete} style={{ marginRight: 8 }}>
        Delete item '1'
      </button>
      <button onClick={add} style={{ marginRight: 8 }}>
        Add item
      </button>
      <button onClick={update} style={{ marginRight: 8 }}>
        Update item '1'
      </button>
    </div>
  );
}

// =======================================================
// App wrapper
// =======================================================

export default function App() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 20 }}>
      <h2>Redux clone — Bug X demo</h2>
      <p>
        Actions available: <b>delete</b>, <b>add</b>, <b>updateText</b>.
      </p>
      <Parent />
    </div>
  );
}
