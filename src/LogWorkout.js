// src/LogWorkout.js
import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Badge } from 'react-bootstrap';
import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';

const supplementsList = [
  'Creatine',
  'BCAAs',
  'Protein',
  'Beta-alanine',
  'Caffeine',
  'Glutamine',
  'Pre-Workout',
  'Post-Workout',
];

const LogWorkout = () => {
  const [exercise, setExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [nutrition, setNutrition] = useState('');
  const [quality, setQuality] = useState('');
  const [splitDay, setSplitDay] = useState('');
  const [selectedSupplement, setSelectedSupplement] = useState('');
  const [dosage, setDosage] = useState('');
  const [supplements, setSupplements] = useState([]);
  const [profile, setProfile] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  const splitOptions = {
    'push-pull-legs': ['Push', 'Pull', 'Legs'],
    'upper-lower': ['Upper', 'Lower'],
    'full-body': ['Full Body'],
    'bro-split': ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs'],
    'body-part': ['Chest and Triceps', 'Back and Biceps', 'Shoulders and Abs', 'Legs'],
    'push-pull': ['Push', 'Pull'],
    'hybrid': ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Chest', 'Back', 'Shoulders', 'Arms', 'Chest and Triceps', 'Back and Biceps', 'Shoulders and Abs', 'Legs'],
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const profileRef = doc(db, 'profiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setProfile(data);
        } else {
          setProfile({ split: '' });
        }
      }
    };
    fetchProfile();
  }, []);

  const handleAddSupplement = () => {
    if (selectedSupplement && dosage) {
      const newSupplement = `${selectedSupplement} - ${dosage}`;
      setSupplements([...supplements, newSupplement]);
      setSelectedSupplement('');
      setDosage('');
    }
  };

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
          split: profile.split,
          splitDay,
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
        setSplitDay('');
        setSupplements([]);
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
        <Form.Group controlId="formSplitDay">
          <Form.Label>Workout Split Day</Form.Label>
          <Form.Control
            as="select"
            value={splitDay}
            onChange={(e) => setSplitDay(e.target.value)}
          >
            <option value="">Select Split Day</option>
            {profile.split && splitOptions[profile.split]?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
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
        <Form.Group controlId="formSupplements">
          <Form.Label>Supplements</Form.Label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Form.Control
              as="select"
              value={selectedSupplement}
              onChange={(e) => setSelectedSupplement(e.target.value)}
              style={{ marginRight: '10px' }}
            >
              <option value="">Select Supplement</option>
              {supplementsList.map((supplement, index) => (
                <option key={index} value={supplement}>{supplement}</option>
              ))}
            </Form.Control>
            <Form.Control
              type="number"
              placeholder="Dosage"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              style={{ width: '100px', marginRight: '10px' }}
            />
            <Button onClick={handleAddSupplement}>Add</Button>
          </div>
        </Form.Group>
        <div>
          {supplements.map((supplement, index) => (
            <Badge key={index} pill bg="info" style={{ marginRight: '5px', marginTop: '10px' }}>
              {supplement}
            </Badge>
          ))}
        </div>
        <Button variant="primary" type="submit" style={{ marginTop: '20px' }}>
          Log Workout
        </Button>
      </Form>
    </>
  );
};

export default LogWorkout;
