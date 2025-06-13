import React, { useState } from 'react';
import { signup } from '../api/auth';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const [username, setUser] = useState('');
  const [password, setPass] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    const data = await signup({ username, password });
    if (data.message === 'Signup successful.') {
      alert('Account created! Please log in.');
      navigate('/login');
    } else {
      alert(data.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={username} onChange={e => setUser(e.target.value)} placeholder="Username" />
      <input type="password" value={password} onChange={e => setPass(e.target.value)} placeholder="Password" />
      <button type="submit">Sign Up</button>
    </form>
  );
}