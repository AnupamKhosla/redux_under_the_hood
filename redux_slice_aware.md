```
import React, { useEffect, useRef, useState } from 'react';

/** --- STORE WITH SLICE-AWARE SUBSCRIPTIONS --- **/
export function createStore(reducer, preloadedState) {
  let state = preloadedState;
  const listeners = new Map(); // key → Set(fns)
  let isDispatching = false;

  const getState = () => state;

  function subscribe(listener, keys = ["*"]) {
    for (const k of keys) {
      if (!listeners.has(k)) listeners.set(k, new Set());
      listeners.get(k).add(listener);
    }
    return () => {
      for (const k of keys) listeners.get(k)?.delete(listener);
    };
  }

  function dispatch(action) {
    if (isDispatching) throw new Error("No dispatch inside reducer");

    isDispatching = true;
    const { nextState, changedKeys } = reducer(state, action);
    isDispatching = false;

    state = nextState;

    const called = new Set();
    for (const key of changedKeys) {
      const subs = listeners.get(key);
      if (subs) {
        for (const fn of subs) {
          if (!called.has(fn)) {
            called.add(fn);
            fn();
          }
        }
      }
    }
    return action;
  }

  dispatch({ type: "@@INIT" });
  return { getState, dispatch, subscribe };
}

/** --- COMBINE REDUCERS THAT RETURNS changedKeys --- **/
export function combineReducers(reducers) {
  const keys = Object.keys(reducers);

  return function root(state = {}, action) {
    const nextState = {};
    const changedKeys = [];

    for (const k of keys) {
      const prev = state[k];
      const slice = reducers[k](prev, action);
      nextState[k] = slice;
      if (slice !== prev) changedKeys.push(k);
    }

    return { nextState, changedKeys };
  };
}

/** --- SELECTOR HOOK WITH SLICE SUBSCRIPTION --- **/
export function useStoreSelector(store, selector, sliceKeys) {
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
```