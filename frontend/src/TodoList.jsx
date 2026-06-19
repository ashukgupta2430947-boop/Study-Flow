import React, { useState, useEffect } from 'react';

const TodoList = () => {
    const [todos, setTodos] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const API_URL = 'http://localhost:5000/api/todos';

    // Fetch all tasks on component mount
    useEffect(() => {
        console.log("TodoList component loaded, fetching data from:", API_URL);
        setLoading(true);
        fetch(API_URL)
            .then(res => res.json())
            .then(data => {
                setTodos(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching todos:", err);
                setLoading(false);
            });
    }, []);

    const handleAddTodo = async () => {
        if (inputValue.trim()) {
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ task: inputValue })
                });
                const newTodo = await response.json();
                setTodos([newTodo, ...todos]);
                setInputValue('');
            } catch (err) {
                console.error("Error adding todo:", err);
            }
        }
    };

    const toggleTodo = async (id, completed) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !completed })
            });
            const updatedTodo = await response.json();
            setTodos(todos.map(todo => (todo._id === id ? updatedTodo : todo)));
        } catch (err) {
            console.error("Error updating todo:", err);
        }
    };

    const deleteTodo = async (id) => {
        try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            setTodos(todos.filter(todo => todo._id !== id));
        } catch (err) {
            console.error("Error deleting todo:", err);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
            <h2>My Skill Swap Tasks</h2>
            <div style={{ marginBottom: '15px' }}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tasks..."
                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
                />
            </div>
            <div style={{ display: 'flex', marginBottom: '10px' }}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Add a new task..."
                    style={{ flex: 1, padding: '8px' }}
                />
                <button onClick={handleAddTodo} style={{ padding: '8px' }}>Add</button>
            </div>
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
                    <style>
                        {`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}
                    </style>
                    <div style={{
                        border: '4px solid rgba(0, 0, 0, 0.1)',
                        borderTop: '4px solid #3498db',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        animation: 'spin 0.8s linear infinite'
                    }}></div>
                    <p style={{ marginTop: '15px', color: '#666', fontSize: '14px' }}>Loading your tasks...</p>
                </div>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {todos
                        .filter(todo =>
                            todo.task.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map(todo => (
                            <li key={todo._id} style={{ marginBottom: '5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo._id, todo.completed)} />
                                    <span style={{ textDecoration: todo.completed ? 'line-through' : 'none', marginLeft: '10px' }}>
                                        {todo.task}
                                    </span>
                                </div>
                                <button onClick={() => deleteTodo(todo._id)} style={{ marginLeft: '10px', color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                            </li>
                        ))}
                </ul>
            )}
        </div>
    );
};

export default TodoList;