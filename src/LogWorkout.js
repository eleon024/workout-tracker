import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Badge } from 'react-bootstrap';
import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const predefinedSupplements = [
  'Creatine',
  'BCAAs',
  'Protein',
  'Beta-alanine',
  'Caffeine',
  'Glutamine',
  'Pre-Workout'
];

const LogWorkout = () => {
  const navigate = useNavigate();
  const [exercise, setExercise] = useState('');
  const [customExercise, setCustomExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [nutrition, setNutrition] = useState('');
  const [quality, setQuality] = useState('');
  const [splitDay, setSplitDay] = useState('');
  const [selectedSupplement, setSelectedSupplement] = useState('');
  const [customSupplement, setCustomSupplement] = useState('');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('g');
  const [supplements, setSupplements] = useState([]);
  const [profile, setProfile] = useState({});
  const [customSupplements, setCustomSupplements] = useState([]);
  const [customExercises, setCustomExercises] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
          setCustomSupplements(data.customSupplements || []);
          setCustomExercises(data.customExercises || []);
        } else {
          setProfile({ split: '' });
        }
      }
    };
    fetchProfile();
  }, []);

  const handleAddSupplement = async () => {
    let newSupplement = '';
    if (selectedSupplement) {
      newSupplement = `${selectedSupplement} - ${dosage}${unit}`;
    } else if (customSupplement) {
      newSupplement = `${customSupplement} - ${dosage}${unit}`;
      // Save custom supplement to the user's profile
      const user = auth.currentUser;
      if (user) {
        const profileRef = doc(db, 'profiles', user.uid);
        await updateDoc(profileRef, {
          customSupplements: [...customSupplements, customSupplement]
        });
        setCustomSupplements([...customSupplements, customSupplement]);
      }
    }
    
    if (newSupplement) {
      setSupplements([...supplements, newSupplement]);
      setSelectedSupplement('');
      setCustomSupplement('');
      setDosage('');
      setUnit('g');
    }
  };

  const handleLogWorkout = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      try {
        const exerciseToSave = customExercise ? customExercise : exercise;
        await addDoc(collection(db, 'workouts'), {
          exercise: exerciseToSave,
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
        setSuccessMessage('Workout logged successfully!');
        setErrorMessage('');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000); // Redirect after 2 seconds
        // Save custom exercise to the user's profile
        if (customExercise && !customExercises.includes(customExercise)) {
          const profileRef = doc(db, 'profiles', user.uid);
          await updateDoc(profileRef, {
            customExercises: [...customExercises, customExercise]
          });
          setCustomExercises([...customExercises, customExercise]);
        }
        setExercise('');
        setCustomExercise('');
        setWeight('');
        setSets('');
        setReps('');
        setNutrition('');
        setQuality('');
        setSplitDay('');
        setSupplements([]);
      } catch (error) {
        console.error(error);
        setErrorMessage(error.message);
        setSuccessMessage('');
      }
    }
  };

  const allSupplements = [...predefinedSupplements, ...customSupplements];
  const allExercises = [...customExercises];

  return (
    <>
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      <Form onSubmit={handleLogWorkout}>
        <Form.Group controlId="formSplitDay">
          <Form.Label>Workout Split Day</Form.Label>
          <Form.Control
            as="select"
            value={splitDay}
            onChange={(e) => setSplitDay(e.target.value)}
            required
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
            as="select"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            required={!customExercise} // Required if no custom exercise
          >
            <option value="">Select Exercise</option>
            {allExercises.map((exercise, index) => (
              <option key={index} value={exercise}>{exercise}</option>
            ))}
          </Form.Control>
          <Form.Control
            type="text"
            placeholder="Or enter a new exercise"
            value={customExercise}
            onChange={(e) => setCustomExercise(e.target.value)}
            required={!exercise} // Required if no selected exercise
          />
        </Form.Group>
        <Form.Group controlId="formWeight">
          <Form.Label>Weight</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group controlId="formSets">
          <Form.Label>Sets</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter sets"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group controlId="formReps">
          <Form.Label>Reps</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            required
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
            required
          >
            <option value="">Select Quality</option>
            <option value="poor">Poor</option>
            <option value="normal">Normal</option>
            <option value="great">Great</option>
          </Form.Control>
        </Form.Group>
        <Form.Group controlId="formSupplements">
          <Form.Label>Supplements</Form.Label>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <Form.Control
              as="select"
              value={selectedSupplement}
              onChange={(e) => setSelectedSupplement(e.target.value)}
              style={{ marginRight: '10px' }}
            >
              <option value="">Select Supplement</option>
              {allSupplements.map((supplement, index) => (
                <option key={index} value={supplement}>{supplement}</option>
              ))}
            </Form.Control>
            <Form.Control
              type="text"
              placeholder="Custom Supplement"
              value={customSupplement}
              onChange={(e) => setCustomSupplement(e.target.value)}
              style={{ marginRight: '10px' }}
            />
            <Form.Control
              type="number"
              placeholder="Dosage"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              style={{ width: '100px', marginRight: '10px' }}
            />
            <Form.Control
              as="select"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={{ width: '70px', marginRight: '10px' }}
            >
              <option value="g">g</option>
              <option value="mg">mg</option>
            </Form.Control>
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
