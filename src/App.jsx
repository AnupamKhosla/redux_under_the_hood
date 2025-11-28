import React, { useState } from 'react';
import { store, useStoreSelector, makeSelectTodo, selectOrder } from './redux';

export default function App() {
  return (
    <div style={{ padding: 20 }}>
      <h2>Custom Redux Todo</h2>
      <AddTodo />
      <TodoList />
    </div>
  );
}

function AddTodo() {
  const [text, setText] = useState('');
  const add = () => {
    if (text.trim()) {
      store.dispatch({ type: "todo/add", text });
      setText('');
    }
  };

  return (
    <div>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={add}>Add</button>
    </div>
  );
}

function TodoList() {
  const list = useStoreSelector(store, selectOrder);
  return (
    <ul>
      {list.map(t => <TodoItem key={t.id} id={t.id} />)}
    </ul>
  );
}

function TodoItem({ id }) {
  const selector = React.useMemo(() => makeSelectTodo(id), [id]);
  const todo = useStoreSelector(store, selector);

  return (
    <li>
      <label>
        <input type="checkbox"
               checked={todo.done}
               onChange={() => store.dispatch({ type: "todo/toggle", id })} />
        {todo.text}
      </label>
    </li>
  );
}
