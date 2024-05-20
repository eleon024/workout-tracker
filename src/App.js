// src/App.js
import React from 'react';
import SignUp from './SignUp';
import SignIn from './SignIn';
import LogWorkout from './LogWorkout';
import Recommendations from './Recommendations'; // Assuming you've added this component for recommendations

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Workout Tracker</h1>
      </header>
      <main>
        <SignUp />
        <SignIn />
        <LogWorkout />
        <Recommendations />
      </main>
    </div>
  );
}

export default App;
