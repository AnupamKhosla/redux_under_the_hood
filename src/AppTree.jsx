import React from "react";
import ReactDOM from "react-dom/client";
import { Provider, store, useStoreSelector } from "./redux_Tree.js";

function Parent() {
  const b = useStoreSelector(s => s.sliceB);
  console.log("Parent render", b);
  return (
    <div style={{border:"2px solid blue",padding:10,margin:10}}>
      <h3>Parent (sliceB)</h3>
      <p>B: {b.val}</p>
      <Child />
    </div>
  );
}

function Child() {
  const a = useStoreSelector(s => s.sliceA);
  console.log("Child render", a);
  return (
    <div style={{border:"2px solid green",padding:10,margin:10}}>
      <h4>Child (sliceA)</h4>
      <p>A: {a.count}</p>
      <GrandChild />
    </div>
  );
}

function GrandChild() {
  const a = useStoreSelector(s => s.sliceA);
  console.log("GrandChild render", a);
  return (
    <div style={{border:"2px solid orange",padding:10,margin:10}}>
      <strong>GrandChild (sliceA)</strong>
      <p>A: {a.count}</p>
    </div>
  );
}

function Controls() {
  return (
    <div style={{margin:10}}>
      <button onClick={() => store.dispatch({ type: "incA" })}>incA (A only)</button>
      <button onClick={() => store.dispatch({ type: "setB", val: Math.random().toFixed(2) })}>setB (B only)</button>
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <div style={{fontFamily:"sans-serif",padding:20}}>
        <h2>Tree Subscription Redux Demo</h2>
        <Controls />
        <Parent />
      </div>
    </Provider>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
