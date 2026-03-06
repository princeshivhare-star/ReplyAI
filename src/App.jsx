import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';
import { checkAuth } from './auth'; // Assuming there's a method to check authentication

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserAuth = async () => {
      const authStatus = await checkAuth(); // Fetch authentication status
      setIsAuthenticated(authStatus);
      setLoading(false);
    };
    checkUserAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Or a loader component
  }

  return (
    <Router>
      <Switch>
        <Route path="/" exact component={LandingPage} />
        <Route path="/dashboard" render={() => (
          isAuthenticated ? <Dashboard /> : <Redirect to="/" />
        )} />
        <Redirect to="/" />
      </Switch>
    </Router>
  );
};

export default App;