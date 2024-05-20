// src/LogWorkout.js
import React, { useState } from 'react';
import { db, auth } from './firebase'; // Ensure you're importing from your firebase.js file
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const LogWorkout = () => {
  const [exercise, setExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [nutrition, setNutrition] = useState('');
  const [quality, setQuality] = useState('');

  const handleLogWorkout = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      try {
        await addDoc(collection(db, 'workouts'), {
          exercise,
          weight,
          sets,
          reps,
          nutrition,
          quality,
          uid: user.uid,
          timestamp: serverTimestamp()
        });
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div>
      <h2>Log Workout</h2>
      <form onSubmit={handleLogWorkout}>
        <input
          type="text"
          value={exercise}
          onChange={(e) => setExercise(e.target.value)}
          placeholder="Exercise"
        />
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Weight"
        />
        <input
          type="number"
          value={sets}
          onChange={(e) => setSets(e.target.value)}
          placeholder="Sets"
        />
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder="Reps"
        />
        <input
          type="text"
          value={nutrition}
          onChange={(e) => setNutrition(e.target.value)}
          placeholder="Nutrition"
        />
        <input
          type="text"
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
          placeholder="Quality"
        />
        <button type="submit">Log Workout</button>
      </form>
    </div>
  );
};

export default LogWorkout;
