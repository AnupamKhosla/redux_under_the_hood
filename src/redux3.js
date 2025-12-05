// redux3_demo_app
// Files: redux3.js  and  App.jsx
// Drop both files into a Vite React project (src/) and run `npm run dev`.

/* ========================= redux3.js ========================= */
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

// Minimal store (same core as Redux)
export function createStore(rootReducer, preloadedState) {
  let state = preloadedState;
  const listeners = new Set();

  function getState() { return state; }
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  function dispatch(action) {
    state = rootReducer(state, action);
    // notify all listeners (order of registration matters for nested subscriptions)
    for (const l of Array.from(listeners)) l();
    return action;
  }

  // initialize
  dispatch({ type: '@@INIT' });

  return { getState, dispatch, subscribe };
}

// combineReducers -> returns a root reducer with the typical semantics
export function combineReducers(reducers) {
  const keys = Object.keys(reducers);
  return function root(state = {}, action) {
    let hasChanged = false;
    const next = {};
    for (const k of keys) {
      const prevSlice = state[k];
      const nextSlice = reducers[k](prevSlice, action);
      next[k] = nextSlice;
      if (nextSlice !== prevSlice) hasChanged = true;
    }
    return hasChanged ? next : state;
  };
}

/* ========================= Subscription tree (Provider + Connected) ========================= */

// StoreContext: gives components access to store
const StoreContext = createContext(null);
// SubContext: a function children can call to register their "onParentNotify" callback
// registerChild(fn) => returns unsubscribe
const SubContext = createContext(() => () => {});

// Provider: wires the store and acts as the root parent for nested subscribers
export function Provider({ store, children }) {
  // root child listeners set
  const rootChildrenRef = useRef(new Set());

  const registerRootChild = useCallback((fn) => {
    rootChildrenRef.current.add(fn);
    return () => rootChildrenRef.current.delete(fn);
  }, []);

  // when store changes, call every root child (they will run their selectors and notify their children)
  useEffect(() => {
    const notify = () => {
      // copy set to avoid mutation during iteration
      for (const fn of Array.from(rootChildrenRef.current)) fn();
    };
    const unsub = store.subscribe(notify);
    return unsub;
  }, [store]);

  return (
    <StoreContext.Provider value={store}>
      <SubContext.Provider value={registerRootChild}>
        {children}
      </SubContext.Provider>
    </StoreContext.Provider>
  );
}

// Connected component: creates a local subscription node in the tree and renders children
// - selector: (state) => selectedValue
// - children: either a render-function: children(selected) or plain React nodes that can read selected via render prop
export function Connected({ selector, children }) {
  const store = useContext(StoreContext);
  const parentRegister = useContext(SubContext); // function to register with parent

  // local selected state
  const [selected, setSelected] = useState(() => selector(store.getState()));
  const latestRef = useRef(selected);

  // local child registry for nested subscribers
  const localChildrenRef = useRef(new Set());
  const registerChild = useCallback((fn) => {
    localChildrenRef.current.add(fn);
    return () => localChildrenRef.current.delete(fn);
  }, []);

  // the check function the parent will call on store updates
  const check = useCallback(() => {
    const next = selector(store.getState());
    const changed = next !== latestRef.current;
    if (changed) {
      latestRef.current = next;
      setSelected(next);
    }
    // ALWAYS notify nested children so each child can run its own selector in the correct top-down order
    // (this mirrors how real React-Redux orders notifications).
    for (const fn of Array.from(localChildrenRef.current)) fn();
  }, [selector, store]);

  // register with parent subscription on mount
  useEffect(() => {
    const unsubParent = parentRegister(check);
    // immediately check once in case something changed between render and effect
    check();
    return unsubParent;
  }, [parentRegister, check]);

  // render a SubContext.Provider so nested Connected children register under this node
  return (
    <SubContext.Provider value={registerChild}>
      {typeof children === 'function' ? children(selected) : children}
    </SubContext.Provider>
  );
}

// small helper hook to dispatch actions easily
export function useStoreDispatch() {
  const store = useContext(StoreContext);
  return store.dispatch;
}

/* ========================= End redux3.js ========================= */


/* ========================= App.jsx ========================= */
// An example app that uses redux3. The component tree is nested like:
// Provider
//  └─ SliceB (Connected -> selects sliceB)
//      └─ SliceAParent (Connected -> selects sliceA.value)
//          └─ SliceAChild (Connected -> also selects sliceA.value)
// We will dispatch only setA action and observe that both SliceAParent and SliceAChild update,
// while SliceB does not re-render because its selected value (sliceB) is unchanged.

import { createStore, combineReducers, Provider, Connected, useStoreDispatch } from './redux3';

// reducers
function sliceAReducer(state = { value: 0 }, action) {
  switch (action.type) {
    case 'setA':
      return { ...state, value: action.payload };
    default:
      return state;
  }
}
function sliceBReducer(state = { label: 'B', tick: 0 }, action) {
  switch (action.type) {
    case 'tickB':
      return { ...state, tick: state.tick + 1 };
    default:
      return state;
  }
}

const rootReducer = combineReducers({ sliceA: sliceAReducer, sliceB: sliceBReducer });
export const store = createStore(rootReducer, undefined);

// UI components
function SliceAChild() {
  // Connected will inject current sliceA value into render-prop
  return (
    <Connected selector={(s) => s.sliceA.value}>
      {(aValue) => (
        <div style={{ marginLeft: 20 }}>
          <strong>SliceAChild</strong> — sliceA.value: {String(aValue)}
        </div>
      )}
    </Connected>
  );
}

function SliceAParent() {
  const dispatch = useStoreDispatch();

  return (
    <Connected selector={(s) => s.sliceA.value}>
      {(aValue) => (
        <div style={{ marginLeft: 10 }}>
          <div><strong>SliceAParent</strong> — sliceA.value: {String(aValue)}</div>
          <div style={{ marginTop: 6 }}>
            <button onClick={() => dispatch({ type: 'setA', payload: aValue + 1 })}>increment A</button>
            <button style={{ marginLeft: 6 }} onClick={() => dispatch({ type: 'setA', payload: 0 })}>reset A</button>
          </div>
          <SliceAChild />
        </div>
      )}
    </Connected>
  );
}

function SliceB() {
  // Note: SliceB selects s.sliceB.tick to display; we will not dispatch tickB in the demo so this should NOT change
  return (
    <Connected selector={(s) => s.sliceB.tick}>
      {(bTick) => (
        <div>
          <div><strong>SliceB</strong> — sliceB.tick: {bTick}</div>
          <SliceAParent />
        </div>
      )}
    </Connected>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <div style={{ fontFamily: 'system-ui', padding: 20 }}>
        <h3>redux3 nested subscription demo</h3>
        <p>Tree: SliceB (parent) → SliceAParent → SliceAChild</p>
        <p>Click "increment A" — only SliceAParent and SliceAChild should update. SliceB output should remain unchanged.</p>
        <SliceB />
      </div>
    </Provider>
  );
}

/* ========================= End App.jsx ========================= */
