// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Container, Navbar, Nav } from 'react-bootstrap';
import SignUp from './SignUp';
import SignIn from './SignIn';
import LogWorkout from './LogWorkout';
import Recommendations from './Recommendations';
import PrivateRoute from './PrivateRoute'; // Import PrivateRoute

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar bg="dark" variant="dark" expand="lg">
          <Navbar.Brand as={Link} to="/">Workout Tracker</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              <Nav.Link as={Link} to="/sign-up">Sign Up</Nav.Link>
              <Nav.Link as={Link} to="/sign-in">Sign In</Nav.Link>
              <Nav.Link as={Link} to="/log-workout">Log Workout</Nav.Link>
              <Nav.Link as={Link} to="/recommendations">Recommendations</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <Container className="mt-4">
          <Routes>
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/log-workout" element={<PrivateRoute><LogWorkout /></PrivateRoute>} />
            <Route path="/recommendations" element={<PrivateRoute><Recommendations /></PrivateRoute>} />
            <Route path="/" element={<SignIn />} /> {/* Default to SignIn */}
          </Routes>
        </Container>
      </div>
    </Router>
  );
}

export default App;
