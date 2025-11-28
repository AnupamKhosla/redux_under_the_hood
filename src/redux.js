import React, { useEffect, useRef, useState } from 'react';

export function createStore(reducer, preloadedState) {
  let state = preloadedState;
  const listeners = new Set();
  let isDispatching = false;

  function getState() {
    return state;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function dispatch(action) {
    if (isDispatching) throw new Error("No dispatch inside reducer");
    isDispatching = true;
    state = reducer(state, action);
    isDispatching = false;
    for (const l of listeners) l();
    return action;
  }

  dispatch({ type: "@@INIT" });
  return { getState, dispatch, subscribe };
}

export function combineReducers(reducers) {
  const keys = Object.keys(reducers);
  return function root(state = {}, action) {
    let changed = false;
    const next = {};
    for (const k of keys) {
      const prev = state[k];
      const slice = reducers[k](prev, action);
      next[k] = slice;
      if (slice !== prev) changed = true;
    }
    return changed ? next : state;
  };
}

export function useStoreSelector(store, selector) {
  const [selected, setSelected] = useState(() => selector(store.getState()));
  const ref = useRef(selected);

  useEffect(() => {
    const check = () => {
      const next = selector(store.getState());
      if (next !== ref.current) {
        ref.current = next;
        setSelected(next);
      }
    };
    const unsub = store.subscribe(check);
    check();
    return unsub;
  }, [store, selector]);

  return selected;
}

// Todo reducer
function todos(state = { byId: {}, order: [] }, action) {
  switch (action.type) {
    case "todo/add": {
      const id = String(Date.now());
      return {
        byId: { ...state.byId, [id]: { id, text: action.text, done: false }},
        order: [...state.order, id]
      };
    }
    case "todo/toggle": {
      const t = state.byId[action.id];
      return {
        byId: { ...state.byId, [action.id]: { ...t, done: !t.done }},
        order: state.order
      };
    }
    default:
      return state;
  }
}

export const rootReducer = combineReducers({ todos });
export const store = createStore(rootReducer);

// selectors
export const makeSelectTodo = id => state => state.todos.byId[id];
export const selectOrder = state => state.todos.order.map(id => state.todos.byId[id]);
