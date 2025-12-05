// reduxTree.js
import React from "react";

/* ============================================
   Node (subscription tree)
============================================ */
export class Node {
  constructor() {
    this.listeners = new Set();
    this.children = new Set();
  }

  addListener(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  addChild(childNode) {
    this.children.add(childNode);
    return () => this.children.delete(childNode);
  }

  notify() {
    for (const fn of this.listeners) fn();
    for (const c of this.children) c.notify();
  }
}

/* ============================================
   createStore with rootNode
============================================ */
export function createStore(reducer, preloaded) {
  let state = preloaded;
  const rootNode = new Node();

  const getState = () => state;

  const dispatch = (action) => {
    state = reducer(state, action);
    rootNode.notify();
  };

  dispatch({ type: "@@INIT" });

  const subscribe = () => () => {};

  return { getState, dispatch, subscribe, rootNode };
}

/* ============================================
   combineReducers
============================================ */
export function combineReducers(reducers) {
  const keys = Object.keys(reducers);

  return function rootReducer(state = {}, action) {
    let changed = false;
    const next = {};

    for (const k of keys) {
      const prevSlice = state[k];
      const nextSlice = reducers[k](prevSlice, action);
      next[k] = nextSlice;
      if (nextSlice !== prevSlice) changed = true;
    }

    return changed ? next : state;
  };
}

/* ============================================
   Task reducer
============================================ */
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
        order: [...state.order, id]
      };
    }
    case "task/delete": {
      const { [action.id]: removed, ...rest } = state.byId;
      return {
        byId: rest,
        order: state.order.filter((x) => x !== action.id)
      };
    }
    case "task/toggle": {
      const t = state.byId[action.id];
      return {
        byId: {
          ...state.byId,
          [action.id]: { ...t, done: !t.done }
        },
        order: state.order
      };
    }
    case "task/edit": {
      const t = state.byId[action.id];
      return {
        byId: {
          ...state.byId,
          [action.id]: { ...t, text: action.text }
        },
        order: state.order
      };
    }
    default:
      return state;
  }
}

export const rootReducer = combineReducers({ tasks: tasksReducer });
export const store = createStore(rootReducer);

/* ============================================
   Selectors
============================================ */
export const selectTaskOrder = (state) =>
  state.tasks.order.map((id) => state.tasks.byId[id]);

export const makeSelectTask = (id) => (state) => state.tasks.byId[id];
