import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';
import Signup from './Signup';
import Login from './Login';
import Dashboard from './Dashboard';

const supabase = createClient('your_supabase_url', 'your_supabase_anon_key');

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = supabase.auth.session();
    setUser(session?.user || null);
    setLoading(false);
    
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
  }, []);

  const handleSignup = async (email, password) => {
    const { user, error } = await supabase.auth.signUp({ email, password });
    if (error) console.error(error);
    else setUser(user);
  };

  const handleLogin = async (email, password) => {
    const { user, error } = await supabase.auth.signIn({ email, password });
    if (error) console.error(error);
    else setUser(user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <Route path="/signup">
        {user ? <Redirect to="/dashboard" /> : <Signup onSignup={handleSignup} />}
      </Route>
      <Route path="/login">
        {user ? <Redirect to="/dashboard" /> : <Login onLogin={handleLogin} />}
      </Route>
      <Route path="/dashboard">
        {user ? <Dashboard onLogout={handleLogout} user={user} /> : <Redirect to="/login" />}
      </Route>
      <Redirect from="/" to="/dashboard" />
    </Router>
  );
};

export default App;