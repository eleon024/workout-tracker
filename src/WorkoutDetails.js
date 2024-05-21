// src/WorkoutDetails.js
import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useParams } from 'react-router-dom';

const WorkoutDetails = () => {
  const { id } = useParams();
  const [workout, setWorkout] = useState(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      const docRef = doc(db, 'workouts', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setWorkout(docSnap.data());
      }
    };
    fetchWorkout();
  }, [id]);

  if (!workout) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Workout Details</h2>
      <p><strong>Date:</strong> {new Date(workout.timestamp.seconds * 1000).toLocaleDateString()}</p>
      <p><strong>Exercise:</strong> {workout.exercise}</p>
      <p><strong>Weight:</strong> {workout.weight}</p>
      <p><strong>Sets:</strong> {workout.sets}</p>
      <p><strong>Reps:</strong> {workout.reps}</p>
      <p><strong>Nutrition:</strong> {workout.nutrition}</p>
      <p><strong>Quality:</strong> {workout.quality}</p>
      <p><strong>Split Day:</strong> {workout.splitDay}</p>
      <p><strong>Supplements:</strong> {workout.supplements.join(', ')}</p>
    </div>
  );
};

export default WorkoutDetails;
