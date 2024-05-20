// src/LogWorkout.js
import React, { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';

const LogWorkout = () => {
  const [exercise, setExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [nutrition, setNutrition] = useState('');
  const [quality, setQuality] = useState('');
  const [split, setSplit] = useState('');
  const [supplements, setSupplements] = useState([]);
  const [profile, setProfile] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const profileRef = doc(db, 'profiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setProfile(data);
          setSplit(data.split);
          setSupplements(data.supplements ? data.supplements.split(',') : []);
        }
      }
    };
    fetchProfile();
  }, []);

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
          split,
          supplements,
          uid: user.uid,
          timestamp: serverTimestamp()
        });
        setExercise('');
        setWeight('');
        setSets('');
        setReps('');
        setNutrition('');
        setQuality('');
        setErrorMessage('');
      } catch (error) {
        console.error(error);
        setErrorMessage(error.message);
      }
    }
  };

  return (
    <>
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      <Form onSubmit={handleLogWorkout}>
        <Form.Group controlId="formSplit">
          <Form.Label>Workout Split</Form.Label>
          <Form.Control
            as="select"
            value={split}
            onChange={(e) => setSplit(e.target.value)}
          >
            <option value="">Select Split</option>
            <option value="push">Push</option>
            <option value="pull">Pull</option>
            <option value="legs">Legs</option>
            <option value="back-bis">Back & Bis</option>
            <option value="chest-tris">Chest & Tris</option>
            <option value="upper">Upper</option>
            <option value="lower">Lower</option>
          </Form.Control>
        </Form.Group>
        <Form.Group controlId="formExercise">
          <Form.Label>Exercise</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter exercise"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="formWeight">
          <Form.Label>Weight</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="formSets">
          <Form.Label>Sets</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter sets"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="formReps">
          <Form.Label>Reps</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="formNutrition">
          <Form.Label>Nutrition</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter what you ate"
            value={nutrition}
            onChange={(e) => setNutrition(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="formSupplements">
          <Form.Label>Supplements</Form.Label>
          <Form.Control
            as="select"
            multiple
            value={supplements}
            onChange={(e) => setSupplements(Array.from(e.target.selectedOptions, option => option.value))}
          >
            {profile.supplements ? profile.supplements.split(',').map((supplement, index) => (
              <option key={index} value={supplement}>{supplement}</option>
            )) : <option value="">No supplements found</option>}
          </Form.Control>
        </Form.Group>
        <Form.Group controlId="formQuality">
          <Form.Label>Quality</Form.Label>
          <Form.Control
            as="select"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
          >
            <option value="">Select Quality</option>
            <option value="poor">Poor</option>
            <option value="normal">Normal</option>
            <option value="great">Great</option>
          </Form.Control>
        </Form.Group>
        <Button variant="primary" type="submit">
          Log Workout
        </Button>
      </Form>
    </>
  );
};

export default LogWorkout;
