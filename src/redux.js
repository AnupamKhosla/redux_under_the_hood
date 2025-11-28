import React, { useEffect, useRef, useState } from 'react';

export function createStore(r, pre){
  let state=pre; const listeners=new Set();
  const getState=()=>state;
  const subscribe=fn=>(listeners.add(fn),()=>listeners.delete(fn));
  const dispatch=a=>{ state=r(state,a); listeners.forEach(l=>l()); };
  dispatch({type:'@@INIT'}); return {getState,dispatch,subscribe};
}

export function combineReducers(rs){
  const keys=Object.keys(rs);
  return function root(state={},a){
    let changed=false; const next={};
    for(const k of keys){
      const prev=state[k]; const slice=rs[k](prev,a);
      next[k]=slice; if(prev!==slice) changed=true;
    }
    return changed?next:state;
  };
}

export function useStoreSelector(store,sel){
  const [val,setVal]=useState(()=>sel(store.getState()));
  const ref=useRef(val);
  useEffect(()=>{
    const check=()=>{
      const next=sel(store.getState());
      if(next!==ref.current){ ref.current=next; setVal(next); }
    };
    const unsub=store.subscribe(check); check(); return unsub;
  },[store,sel]);
  return ref.current;
}

// ---- reducer ----
function tasksReducer(state={byId:{},order:[]},a){
  switch(a.type){
    case 'task/add':{
      const id=String(Date.now());
      return {byId:{...state.byId,[id]:{id,text:a.text,done:false}}, order:[...state.order,id]};
    }
    case 'task/delete':{
      const id=a.id; const {[id]:_,...rest}=state.byId;
      return {byId:rest, order:state.order.filter(x=>x!==id)};
    }
    case 'task/toggle':{
      const t=state.byId[a.id];
      return {byId:{...state.byId,[a.id]:{...t,done:!t.done}}, order:state.order};
    }
    case 'task/edit':{
      const t=state.byId[a.id];
      return {byId:{...state.byId,[a.id]:{...t,text:a.text}}, order:state.order};
    }
    default:return state;
  }
}

export const rootReducer=combineReducers({tasks:tasksReducer});
export const store=createStore(rootReducer);

export const selectTaskOrder=s=>s.tasks.order.map(id=>s.tasks.byId[id]);
export const makeSelectTask=id=>s=>s.tasks.byId[id];
