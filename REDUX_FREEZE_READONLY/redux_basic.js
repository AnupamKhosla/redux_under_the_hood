import React, { useEffect, useRef, useState } from 'react';

export function createStore(reducer, preloadedState) {
  let state = preloadedState;
  const listeners = new Set();
  const getState = () => state;

  const subscribe = (listener) => {
    listeners.add(listener);    
    return () => {
      console.log('unsubscribe listener');
      listeners.delete(listener);
    }
  };

  const dispatch = (action) => {
    state = reducer(state, action);
    //for (const l of listeners) l(); //records child first parent after    
    for (const l of Array.from(listeners).reverse()) l();
    //Revers to get render order so parent updates first
  };

  dispatch({ type: '@@INIT' });
  return { getState, dispatch, subscribe };
}

export function combineReducers(reducers) {
  const keys = Object.keys(reducers);

  return function rootReducer(state = {}, action) {
    let hasChanged = false;
    const nextState = {};

    for (const key of keys) {
      const prevSlice = state[key];
      const nextSlice = reducers[key](prevSlice, action);
      nextState[key] = nextSlice;
      if (nextSlice !== prevSlice) hasChanged = true;
    }

    return hasChanged ? nextState : state;
  };
}

export function useStoreSelector(store, selector) {
  const [val, setVal] = useState(() => selector(store.getState()));
  const latestRef = useRef(val);

  useEffect(() => {
    const check = () => {
      const next = selector(store.getState());
      console.log('checkListener', next);
      if (next !== latestRef.current) {
        latestRef.current = next;
        setVal(next);
      }
    };    
    const unsubscribe = store.subscribe(check);
    check();
    return unsubscribe;
  }, [store, selector]);

  return val;
}

const initialTasks = {
  byId: {
    "1": { id: "1", text: "Learn Redux", done: false },
    "2": { id: "2", text: "Write custom Redux2", done: false }
  },
  order: ["1", "2"]
};

function tasksReducer(state = initialTasks, action) {
  switch (action.type) {
    case 'task/add': {
      const id = String(Date.now());
      return {
        byId: { ...state.byId, [id]: { id, text: action.text, done: false } },
        order: [...state.order, id],
      };
    }

    case 'task/delete': {
      const id = action.id;
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

export const rootReducer = combineReducers({ tasks: tasksReducer });
export const store = createStore(rootReducer);

export const selectTaskOrder = (state) =>
  state.tasks.order.map((id) => state.tasks.byId[id]);

export const makeSelectTask = (id) => (state) => state.tasks.byId[id];
