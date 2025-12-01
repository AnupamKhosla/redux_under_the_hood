Correct, clear combineReducers (tracks changed keys)
function combineReducers(reducers) {
  const keys = Object.keys(reducers);
  function rootReducer(state = {}, action) {
    let hasChanged = false;
    const nextState = {};
    const changedKeys = [];

    for (const k of keys) {
      const prevSlice = state[k];
      const nextSlice = reducers[k](prevSlice, action);
      nextState[k] = nextSlice;
      if (nextSlice !== prevSlice) {
        hasChanged = true;
        changedKeys.push(k);
      }
    }

    // publish changedKeys for the store to read after calling reducer
    rootReducer.changedKeys = changedKeys;
    return hasChanged ? nextState : state;
  }

  rootReducer.keys = keys;
  return rootReducer;
}


Notes:

state = {} only applies when the reducer is first called with undefined. If you create the store with preloadedState, that value is used.

Each slice reducer gets its prevSlice only. That enforces slice isolation.

Store that uses changedKeys to notify only interested listeners
function createStore(reducer, preloadedState) {
  let state = preloadedState;
  const genericListeners = new Set();        // listeners without key constraints
  const keyListeners = new Map();           // Map<key, Set<listener>>
  
  function getState() { return state; }

  // subscribe(listener, keys?) — keys is optional array of slice keys the listener cares about
  function subscribe(listener, keys) {
    if (!keys || keys.length === 0) {
      genericListeners.add(listener);
      return () => genericListeners.delete(listener);
    }
    for (const k of keys) {
      if (!keyListeners.has(k)) keyListeners.set(k, new Set());
      keyListeners.get(k).add(listener);
    }
    return () => {
      for (const k of keys) {
        const s = keyListeners.get(k);
        if (s) s.delete(listener);
      }
    };
  }

  function dispatch(action) {
    const prev = state;
    const next = reducer(state, action);         // reducer may set reducer.changedKeys
    state = next;
    const changed = reducer.changedKeys || [];  // array of keys that changed

    // 1) Notify generic listeners (those that want every dispatch)
    for (const l of genericListeners) l();

    // 2) Notify key-specific listeners only if their key changed — avoid duplicate calls
    const called = new Set();
    for (const k of changed) {
      const set = keyListeners.get(k);
      if (!set) continue;
      for (const l of set) {
        if (!called.has(l)) { called.add(l); l(); }
      }
    }
  }

  return { getState, dispatch, subscribe };
}


Usage example (component pseudo-hook):

// component subscribes to "todos" key only:
const unsubscribe = store.subscribe(() => {
  const slice = selector(store.getState());
  // update component if slice changed (selector + local ref)
}, ['todos']);


Or higher-level hook would call subscribe(listener, [key]) under the hood so the hook’s check runs only when that key is in changedKeys.

Concrete demonstration (why this matters)

You have 1000 components each reading different slices. With naive subscribe-all, one dispatch wakes 1000 checks.

With key-subscription, a dispatch that only changes todos hits only components subscribed to todos (cheap), and generic subscribers (if any). That’s the practical win — not theoretical.

Addressing the “root ref” question

Returning a new root object when any slice changed is a cheap O(1) detect for global consumers: nextRoot !== prevRoot. That’s useful for any code that wants a single boolean “some slice changed” without iterating slices. But you don’t need every component to use that — per-slice subscriptions + changedKeys let components avoid global checks.

The pattern return hasChanged ? nextState : state both avoids allocations when nothing changed and gives consistent equality semantics.

TL;DR (actionable)

Use the combineReducers above (it preserves preloaded state and tracks changed keys).

Implement store dispatch that reads reducer.changedKeys and uses per-key subscriptions.

Provide a hook API that subscribes the component to the specific slice keys it depends on (so it runs its selector only when those keys change).

This solves the “1000 checks on every dispatch” problem without violating combineReducers’ isolation rules.

If you want, I’ll:

(A) Show a useStoreSelector hook that auto-registers the component for the right key(s) (you’ll need to declare which top-level key(s) the selector reads), or

(B) Show how React-Redux achieves this with subscription trees (more complex but production-ready). Which do you want?

You said:
You haven't explained how useStoreSelector would be implemented with this new implementation of combineReducers and createStore.
ChatGPT said:

Below is the missing piece: how to implement useStoreSelector correctly once we introduce:

combineReducers

per-slice subscriptions

the real store shape ({ todos: ..., filters: ... })

This is the part you asked for and the part we hadn’t completed.

I will show:

The minimal store implementation you now have

How useStoreSelector must work with slice-aware subscriptions

A concrete, working example of selecting state.todos and updating a component only when that slice changes.

No theory. Only concrete, connected logic.

1. The Store We Now Have (recap)

You now have a store where:

combineReducers produces a new root object

It sets reducer.changedKeys = ['todos', ...]

The store notifies only listeners subscribed to those keys

const store = {
  getState,
  dispatch,
  subscribe // (listener, keys)
}


A component can subscribe to only the slice keys it cares about:

store.subscribe(myListener, ['todos']);

2. Problem: useStoreSelector must subscribe to the right slice

Example:

useStoreSelector(state => state.todos);


This selector depends on one top-level key: "todos".

Therefore:

You must subscribe the hook to "todos"

The hook must only re-run selector logic when "todos" changes

Dispatch for "filters" must not wake this component

This is the change introduced by combineReducers.

3. Implementation: useStoreSelector
Step A — Extract slice keys used by selector

A selector like state => state.todos uses the "todos" slice.

We need the user to declare which top-level keys a selector uses:

useStoreSelector(selector, ['todos']);


Later we can auto-detect, but for now we keep it explicit.

Step B — Hook Implementation
import { useState, useEffect, useRef } from 'react';
import { store } from './store';  // your custom store

export function useStoreSelector(selector, sliceKeys) {
  const [, forceRender] = useState({});
  const latestSelected = useRef();

  // Run selector initially
  const currentSlice = selector(store.getState());
  if (latestSelected.current === undefined)
    latestSelected.current = currentSlice;

  useEffect(() => {
    const check = () => {
      const next = selector(store.getState());
      if (next !== latestSelected.current) {
        latestSelected.current = next;
        forceRender({}); // rerender only when slice actually changed
      }
    };

    // subscribe ONLY to the slice keys this selector depends on
    const unsubscribe = store.subscribe(check, sliceKeys);

    return unsubscribe;
  }, []);

  return latestSelected.current;
}

4. How this works in practice
Component A: depends only on todos
function TodoList() {
  const todos = useStoreSelector(s => s.todos, ['todos']);
  return <TodoView list={todos} />;
}

Component B: depends only on filters
function FilterPanel() {
  const filters = useStoreSelector(s => s.filters, ['filters']);
  return <FilterUI filters={filters} />;
}

Dispatch flow example:
store.dispatch({ type: 'filters/statusFilterChanged', payload:'Active' });


combineReducers produces:
changedKeys = ['filters']

Store dispatch then:

Notifies listeners subscribed to 'filters'
→ FilterPanel’s check runs

Does NOT notify listeners of 'todos'
→ TodoList’s check never runs
→ TodoList never re-renders

This is the optimization Redux was invented for.

5. Why this is now correct

Because:

Components only run their selectors when the slices they depend on change

No more “1000 components re-run selector on every dispatch”

combineReducers makes each slice reducer isolated

The store emits slice-level invalidations

useStoreSelector filters notifications to relevant components only

The entire model is scalable and predictable

This is the missing conceptual link you wanted.

6. Summary

useStoreSelector must now:

Accept a selector

Accept which slice keys the selector depends on

Subscribe ONLY to those slice keys

Run selector ONLY when those keys change

Compare previous slice vs next slice

Re-render only when slice reference changes

This pattern aligns perfectly with real Redux + React-Redux internals.

If you want, I can now show:

A version that auto-detects which slices the selector touches

A version that mimics React-Redux’s subscription tree

A full working mini-Redux + React demo you can run in a single JS file

Tell me which direction you want next.