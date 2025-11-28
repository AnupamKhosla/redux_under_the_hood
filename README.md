# Custom Redux Todo

## redux.js 
https://github.com/AnupamKhosla/redux_under_the_hood/blob/main/src/redux.js

### chatgpt discussion to make this

https://github.com/AnupamKhosla/redux_under_the_hood/blob/main/src/chatgpt.md


This is a reconstruction of redux working under the hood with basic js. This will help the reader understand, how redux work underneath.
---
```
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
```





----
Run using Vite:

```
npm install
npm run start
```

Files:
- src/redux.js — custom Redux implementation
- src/App.js — Todo demo
- src/index.js
