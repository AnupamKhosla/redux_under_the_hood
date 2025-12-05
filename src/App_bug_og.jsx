// app_bug_demo.js
// Demonstrates "bug X": child subscription check running before parent
// using the minimal redux implementation exported from redux.js (keep redux.js untouched).

import React, { useState } from 'react';
import { createStore, combineReducers, useStoreSelector } from './redux.js';

// -----------------------------
// Reducers (3-4 different slices)
// -----------------------------

const initialItems = {
  byId: {
    '1': { id: '1', text: 'TextContent Child' }
  },
  order: ['1']
};

function itemsReducer(state = initialItems, action) {
  switch (action.type) {
    case 'item/add': {
      const id = String(Date.now());
      return {
        byId: { ...state.byId, [id]: { id, text: action.text } },
        order: [...state.order, id]
      };
    }
    case 'item/delete': {
      const id = action.id;
      const { [id]: _, ...rest } = state.byId;
      return {
        byId: rest,
        order: state.order.filter((x) => x !== id)
      };
    }
    default:
      return state;
  }
}

function flagsReducer(state = { ping: 0 }, action) {
  switch (action.type) {
    case 'flags/ping':
      return { ping: state.ping + 1 };
    default:
      return state;
  }
}

function metaReducer(state = { name: 'demo' }, action) {
  return state;
}

function extraReducer(state = { val: 42 }, action) {
  return state;
}

// -----------------------------
// Create store using clone's createStore & combineReducers
// -----------------------------
const rootReducer = combineReducers({
  items: itemsReducer,
  flags: flagsReducer,
  meta: metaReducer,
  extra: extraReducer
});

export const store = createStore(rootReducer);

// -----------------------------
// App that demonstrates the bug
// -----------------------------

function Parent() {
  // Parent decides whether to render Child based on whether the item id exists in order
  const hasItem = useStoreSelector(store, (state) => state.items.order.includes('1'));

  return (
    <div style={{ border: '2px solid black', padding: 12 }}>
      <h3>Parent (renders child only when item exists)</h3>
      <Controls />
      {hasItem ? <Child id={'1'} /> : <div>(Child not rendered)</div>}
    </div>
  );
}

function Child({ id }) {
  // This selector will throw if the item was deleted (because it accesses .text on undefined)
  const text = useStoreSelector(store, (state) => state.items.byId[id].text);

  return (
    <div style={{ border: '1px dashed red', marginTop: 8, padding: 8 }}>
      <strong>Child</strong>
      <div>Item text: {text}</div>
    </div>
  );
}

function Controls() {
  const [, setErr] = useState(null);
  const [, tick] = useState(0);

  const safeDelete = () => {
    try {
      // Dispatch the delete action. If the child subscription check runs before
      // the parent unmounts the child, the child's selector will access a missing
      // object and throw — this will propagate out of dispatch and be caught here.
      store.dispatch({ type: 'item/delete', id: '1' });
    } catch (e) {
      setErr(String(e));
      // Force a local re-render so the UI can display the caught error
      tick((n) => n + 1);
      console.error('Caught error from dispatch:', e);
    }
  };

  const add = () => store.dispatch({ type: 'item/add', text: 'New item ' + Date.now() });
  const ping = () => store.dispatch({ type: 'flags/ping' });

  return (
    <div style={{ marginBottom: 8 }}>
      <button onClick={safeDelete} style={{ marginRight: 8 }}>Delete item '1'</button>
      <button onClick={add} style={{ marginRight: 8 }}>Add item</button>
      <button onClick={ping}>Ping flags</button>
    </div>
  );
}

function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <h2>Redux clone — Bug X demo</h2>
      <p>Click <em>Delete item '1'</em> to trigger the scenario.</p>
      <Parent />
    </div>
  );
}


// Exported for testability
export default App;
