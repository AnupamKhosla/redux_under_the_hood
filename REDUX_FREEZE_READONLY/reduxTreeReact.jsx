// reduxTreeReact.jsx
import React, { useContext, useEffect, useRef, useState } from "react";
import { Node, store } from "./reduxTree.js";

export const ReduxNodeContext = React.createContext(null);

/* ============================================
   Provider — supplies store + rootNode
============================================ */
export function ReduxProvider({ children }) {
  return (
    <ReduxNodeContext.Provider
      value={{ store, node: store.rootNode }}
    >
      {children}
    </ReduxNodeContext.Provider>
  );
}

/* ============================================
   useStoreSelector — returns PURE VALUE
   (no JSX, no Provider wrapping)
============================================ */
export function useStoreSelector(selector) {
  const ctx = useContext(ReduxNodeContext);
  if (!ctx) throw new Error("Missing <ReduxProvider>");

  const { store, node: parentNode } = ctx;

  const nodeRef = useRef(null);
  if (!nodeRef.current) nodeRef.current = new Node();

  const [val, setVal] = useState(() => selector(store.getState()));
  const latestRef = useRef(val);

  // attach node to tree
  useEffect(() => {
    return parentNode.addChild(nodeRef.current);
  }, [parentNode]);

  // run selector on this node
  useEffect(() => {
    const check = () => {
      const next = selector(store.getState());
      if (next !== latestRef.current) {
        latestRef.current = next;
        setVal(next);
      }
    };

    const unsub = nodeRef.current.addListener(check);
    check();

    return unsub;
  }, [selector, store]);

  return val; // IMPORTANT: return value, not JSX
}
