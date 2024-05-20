// src/LogWorkout.js
import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { db, auth } from './firebase';
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
    <Form onSubmit={handleLogWorkout}>
      <Form.Group controlId="formExercise">
        <Form.Label>Exercise</Form.Label>
        <Form.Control
          type="text"
          value={exercise}
          onChange={(e) => setExercise(e.target.value)}
          placeholder="Enter exercise"
        />
      </Form.Group>
      <Form.Group controlId="formWeight">
        <Form.Label>Weight</Form.Label>
        <Form.Control
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Enter weight"
        />
      </Form.Group>
      <Form.Group controlId="formSets">
        <Form.Label>Sets</Form.Label>
        <Form.Control
          type="number"
          value={sets}
          onChange={(e) => setSets(e.target.value)}
          placeholder="Enter sets"
        />
      </Form.Group>
      <Form.Group controlId="formReps">
        <Form.Label>Reps</Form.Label>
        <Form.Control
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder="Enter reps"
        />
      </Form.Group>
      <Form.Group controlId="formNutrition">
        <Form.Label>Nutrition</Form.Label>
        <Form.Control
          type="text"
          value={nutrition}
          onChange={(e) => setNutrition(e.target.value)}
          placeholder="Enter nutrition"
        />
      </Form.Group>
      <Form.Group controlId="formQuality">
        <Form.Label>Quality</Form.Label>
        <Form.Control
          type="text"
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
          placeholder="Enter quality"
        />
      </Form.Group>
      <Button variant="primary" type="submit">
        Log Workout
      </Button>
    </Form>
  );
};

export default LogWorkout;
