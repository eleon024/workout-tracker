import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import SignUp from './SignUp';
import SignIn from './SignIn';
import LogWorkout from './LogWorkout';
import Recommendations from './Recommendations';
import ManageProfile from './ManageProfile';
import PrivateRoute from './PrivateRoute';
import { auth } from './firebase';
import PerformanceGraphsPage  from './PerformanceGraphsPage';
import WorkoutDetails from './WorkoutDetails';
import { useAuth } from './useAuth';
import HomePage from './HomePage';

function App() {
  const { currentUser } = useAuth();

  const handleSignOut = () => {
    auth.signOut();
  };

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
              {currentUser && (
                <>
                  <Nav.Link as={Link} to="/log-workout">Log Workout</Nav.Link>
                  <Nav.Link as={Link} to="/recommendations">Recommendations</Nav.Link>
                  <Nav.Link as={Link} to="/manage-profile">Manage Profile</Nav.Link>
                  <Nav.Link as={Link} to="/performance-graphs">Performance Graphs</Nav.Link> {/* Add link to new page */}
                  <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                </>
              )}
            </Nav>
            {currentUser && <Button variant="outline-light" onClick={handleSignOut}>Sign Out</Button>}
          </Navbar.Collapse>
        </Navbar>
        <Container className="mt-4">
          <Routes>
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route element={<PrivateRoute />}>
              <Route path="/log-workout" element={<LogWorkout />} />
              {/* <Route path="/recommendations" element={<Recommendations />} /> */}
              <Route path="/manage-profile" element={<ManageProfile />} />
              <Route path="/dashboard" element={<HomePage />} />
              <Route path="/workout/:id" element={<WorkoutDetails />} />
              <Route path="/performance-graphs" element={<PerformanceGraphsPage />} /> {/* Add route for new page */}
            </Route>
            <Route path="/" element={<SignIn />} /> {/* Default to SignIn if not authenticated */}
          </Routes>
        </Container>
      </div>
    </Router>
  );
}

export default App;
