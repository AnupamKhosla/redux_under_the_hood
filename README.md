# Custom Redux Todo


This is a reconstruction of redux working under the hood with basic js. This will help the reader understand, how redux work underneath.
------


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
