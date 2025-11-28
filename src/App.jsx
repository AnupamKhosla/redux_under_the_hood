import React,{useState} from 'react';
import {store,useStoreSelector,selectTaskOrder,makeSelectTask} from './redux.js';

export default function App(){
  return <div style={{padding:20}}>
    <h2>Custom Redux Tasks</h2>
    <AddTask/>
    <TaskList/>
  </div>;
}

function AddTask(){
  const [t,setT]=useState('');
  const add=()=>{ if(t.trim()){ store.dispatch({type:'task/add',text:t}); setT(''); } };
  return <>
    <input value={t} onChange={e=>setT(e.target.value)}/>
    <button onClick={add}>Add</button>
  </>;
}

function TaskList(){
  const tasks=useStoreSelector(store,selectTaskOrder);
  return <ul>{tasks.map(x=><TaskItem key={x.id} id={x.id}/>)}</ul>;
}

function TaskItem({id}){
  const sel=React.useMemo(()=>makeSelectTask(id),[id]);
  const t=useStoreSelector(store,sel);
  const [edit,setEdit]=useState(false);
  const [txt,setTxt]=useState(t.text);
  const save=()=>{ store.dispatch({type:'task/edit',id,text:txt}); setEdit(false); };
  return <li>
    <input type="checkbox" checked={t.done} onChange={()=>store.dispatch({type:'task/toggle',id})}/>
    {" "}
    {edit?
      <>
        <input value={txt} onChange={e=>setTxt(e.target.value)}/>
        <button onClick={save}>Save</button>
      </>:
      <>
        <span style={{textDecoration:t.done?'line-through':'none'}}>{t.text}</span>
        <button onClick={()=>{setEdit(true);setTxt(t.text);}}>Edit</button>
      </>
    }
    <button style={{color:'red'}} onClick={()=>store.dispatch({type:'task/delete',id})}>Delete</button>
  </li>;
}
