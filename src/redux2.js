import React, { useEffect, useRef, useState } from "react";

/* =========================================================
   STORE IMPLEMENTATION (SLICE-AWARE REDUX)
   ========================================================= */
export function createStore(reducer, preloadedState) {
  let state = preloadedState;

  // Map: sliceKey -> Set(listeners)
  const listeners = new Map();

  const getState = () => state;

  function subscribe(listener, sliceKeys = ["*"]) {
    for (const key of sliceKeys) {
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key).add(listener);
    }
    return () => {
      for (const key of sliceKeys) listeners.get(key)?.delete(listener);
    };
  }

  function dispatch(action) {
    const { nextState, changedKeys } = reducer(state, action);
    state = nextState;

    const called = new Set();

    for (const key of changedKeys) {
      const subs = listeners.get(key);
      if (!subs) continue;

      for (const fn of subs) {
        if (!called.has(fn)) {
          called.add(fn);
          fn();
        }
      }
    }

    // wildcard listeners ("listen to everything")
    const wild = listeners.get("*");
    if (wild) {
      for (const fn of wild) {
        if (!called.has(fn)) {
          called.add(fn);
          fn();
        }
      }
    }

    return action;
  }

  dispatch({ type: "@@INIT" });
  return { getState, dispatch, subscribe };
}

/* =========================================================
   COMBINE REDUCERS (RETURNS changedKeys)
   ========================================================= */
export function combineReducers(reducers) {
  const keys = Object.keys(reducers);

  return function rootReducer(state = {}, action) {
    const nextState = {};
    const changedKeys = [];

    for (const key of keys) {
      const prev = state[key];
      const next = reducers[key](prev, action);
      nextState[key] = next;

      if (next !== prev) changedKeys.push(key);
    }

    return { nextState, changedKeys };
  };
}

/* =========================================================
   SELECTOR HOOK
   ========================================================= */
export function useStoreSelector(store, selector, sliceKeys = ["*"]) {
  const [val, setVal] = useState(() => selector(store.getState()));
  const ref = useRef(val);

  useEffect(() => {
    const check = () => {
      const next = selector(store.getState());
      if (next !== ref.current) {
        ref.current = next;
        setVal(next);
      }
    };

    const unsub = store.subscribe(check, sliceKeys);
    check();
    return unsub;
  }, [store, selector, sliceKeys]);

  return val;
}

/* =========================================================
   TASKS REDUCER WITH INITIAL STATE
   ========================================================= */

const initialTasks = {
  byId: {
    "1": { id: "1", text: "Learn Redux", done: false },
    "2": { id: "2", text: "Write custom Redux2", done: false }
  },
  order: ["1", "2"]
};

function tasksReducer(state = initialTasks, action) {
  switch (action.type) {
    case "task/add": {
      const id = String(Date.now());
      return {
        byId: { ...state.byId, [id]: { id, text: action.text, done: false } },
        order: [...state.order, id],
      };
    }

    case "task/delete": {
      const id = action.id;
      const { [id]: _, ...rest } = state.byId;
      return {
        byId: rest,
        order: state.order.filter((x) => x !== id),
      };
    }

    case "task/toggle": {
      const t = state.byId[action.id];
      return {
        byId: { ...state.byId, [action.id]: { ...t, done: !t.done } },
        order: state.order,
      };
    }

    case "task/edit": {
      const t = state.byId[action.id];
      return {
        byId: { ...state.byId, [action.id]: { ...t, text: action.text } },
        order: state.order,
      };
    }

    default:
      return state;
  }
}

/* =========================================================
   ROOT + STORE
   ========================================================= */

export const rootReducer = combineReducers({ tasks: tasksReducer });
export const store = createStore(rootReducer);

/* =========================================================
   SELECTORS
   ========================================================= */

export const selectTaskOrder = (state) =>
  state.tasks.order.map((id) => state.tasks.byId[id]);

export const makeSelectTask = (id) => (state) => state.tasks.byId[id];
