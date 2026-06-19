import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LoginForm from './components/Login/LoginForm';

const App = () => {
    return (
        <Router>
            <Switch>
                <Route path="/login" component={LoginForm} />
                {/* Add more routes here as needed */}
            </Switch>
        </Router>
    );
};

export default App;