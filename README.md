# Custom Redux Todo


This is a reconstruction of redux working under the hood with basic js. This will help the reader understand, how redux work underneath.
------

FULL FINAL WORKING REDUX WITH NO ISSUES:

App_REAL.jsx -- 
https://github.com/AnupamKhosla/redux_under_the_hood/blob/main/src/App_REAL.jsx

This doesn't use parent-child notifyNestedSub mechanism. because, new useSyncExternalStore hook batches re render and react reconciliation renders parent first child next, regardless of listens' order, and as soon as parent removes child1, child1's unsubscribe is triggered.

There might be problem with React concurrent or Suspense etc features, which I haven't experimented with for custom redux. Real redux uses that parent-child tree mechanism to make sure chils's listener never fires before parent.

-----


Other versions may fall for zombie/stale state, e.g. if a child component is deleted, it's check might run before it's listenr is unscubscribed, e.g. state.id.text is being read, but id becomes undefined and hence access undefined.text throws error.


## redux.js 
https://github.com/AnupamKhosla/redux_under_the_hood/blob/main/src/redux.js


## redux_slice_aware.js 
https://github.com/AnupamKhosla/redux_under_the_hood/blob/main/src/redux2.js



### chatgpt discussion to make this

https://github.com/AnupamKhosla/redux_under_the_hood/blob/main/chatgpt.md

There is more chat that led to redux2:


https://github.com/AnupamKhosla/redux_under_the_hood/blob/main/chatgpt_slice_aware.md


---

Original redux emulation concept, but this trigger check function for all components on a single dispatch.

https://github.com/AnupamKhosla/redux_under_the_hood/blob/main/redux_og.md




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
