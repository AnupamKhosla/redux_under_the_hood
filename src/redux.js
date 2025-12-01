import React, { useEffect, useRef, useState } from 'react';

/**
 * Minimal Redux-like store creator.
 *
 * @param {Function} reducer - (state, action) => nextState
 * @param {any} preloadedState - optional initial state
 * @returns {{ getState: Function, dispatch: Function, subscribe: Function }}
 */
export function createStore(reducer, preloadedState) {
  // current application state
  let state = preloadedState;

  // listeners set: subscribers are functions called after every dispatch
  const listeners = new Set();

  // access current state snapshot
  const getState = () => state;

  /**
   * Subscribe a listener.
   * Returns an unsubscribe function.
   * Using a Set avoids duplicate listeners and makes add/remove O(1).
   */
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  /**
   * Dispatch an action:
   * 1. run the reducer with current state + action
   * 2. replace the internal state reference
   * 3. notify all listeners
   */
  const dispatch = (action) => {
    state = reducer(state, action);
    for (const l of listeners) l();
  };

  // Populate initial state by dispatching an init action.
  // This lets reducers return their default initial slice values.
  dispatch({ type: '@@INIT' });

  return { getState, dispatch, subscribe };
}

/**
 * combineReducers implementation:
 * Accepts an object of slice reducers and returns a root reducer.
 *
 * Each slice reducer receives only its slice (prevState[key]) and must
 * return the next slice value. combineReducers assembles these into
 * a new root object only if some slice reference changed.
 */
export function combineReducers(reducers) {
  const keys = Object.keys(reducers);

  return function rootReducer(state = {}, action) {
    let hasChanged = false;
    const nextState = {};

    for (const key of keys) {
      const prevSlice = state[key];
      const nextSlice = reducers[key](prevSlice, action);
      nextState[key] = nextSlice;

      // detect changed slice by reference
      if (nextSlice !== prevSlice) hasChanged = true;
    }

    // If nothing changed, return previous root object (avoid allocation).
    return hasChanged ? nextState : state;
  };
}

/**
 * React hook to select a slice / derived value from the store.
 *
 * - Uses React state (`val`) to drive re-renders.
 * - Keeps a ref of the latest selected value to compare on updates.
 * - Subscribes to the store and re-runs selector when the store dispatches.
 *
 * Note: selector must be a pure function of state (or at least behave
 * consistently for equality checks to be meaningful).
 */
export function useStoreSelector(store, selector) {
  // initialize React state with selector result
  const [val, setVal] = useState(() => selector(store.getState()));
  const latestRef = useRef(val);

  useEffect(() => {
    // check function runs after each dispatch (via store.subscribe)
    const check = () => {
      const next = selector(store.getState());
      if (next !== latestRef.current) {
        latestRef.current = next;
        setVal(next); // trigger React re-render only when selected value changed
      }
    };

    // subscribe and run an initial check (in case state changed between render and effect)
    const unsubscribe = store.subscribe(check);
    check();

    return unsubscribe;
  }, [store, selector]);

  return val; // return React-managed state
}







const initialTasks = {
  byId: {
    "1": { id: "1", text: "Learn Redux", done: false },
    "2": { id: "2", text: "Write custom Redux2", done: false }
  },
  order: ["1", "2"]
};

/* -------------------------
   Example reducer & selectors
   ------------------------- */

/**
 * tasksReducer manages a slice shaped like:
 * { byId: { [id]: task }, order: [id, ...] }
 *
 * Reducer returns a NEW slice object on any change (immutable updates).
 */
function tasksReducer(state = initialTasks, action) {
  switch (action.type) {
    case 'task/add': {
      const id = String(Date.now());
      // add new task immutably
      return {
        byId: { ...state.byId, [id]: { id, text: action.text, done: false } },
        order: [...state.order, id],
      };
    }

    case 'task/delete': {
      const id = action.id;
      // remove id from byId immutably
      const { [id]: _, ...rest } = state.byId;
      return {
        byId: rest,
        order: state.order.filter((x) => x !== id),
      };
    }

    case 'task/toggle': {
      const t = state.byId[action.id];
      return {
        byId: { ...state.byId, [action.id]: { ...t, done: !t.done } },
        order: state.order,
      };
    }

    case 'task/edit': {
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

// assemble root reducer and create the store
export const rootReducer = combineReducers({ tasks: tasksReducer });
export const store = createStore(rootReducer);

/* Selectors */

/**
 * selectTaskOrder:
 * Returns an array of task objects in the stored order.
 * (Derived selector built from the raw state shape)
 */
export const selectTaskOrder = (state) =>
  state.tasks.order.map((id) => state.tasks.byId[id]);

/**
 * makeSelectTask:
 * Factory that returns a selector for a single task by id.
 * Example usage: const selectTask42 = makeSelectTask('42'); useStoreSelector(store, selectTask42)
 */
export const makeSelectTask = (id) => (state) => state.tasks.byId[id];
