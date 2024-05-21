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
  const [weights, setWeights] = useState(['']);
  const [sameWeight, setSameWeight] = useState(true);
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState(['']);
  const [nutrition, setNutrition] = useState('');
  const [quality, setQuality] = useState('');
  const [splitDay, setSplitDay] = useState('');
  const [selectedSupplement, setSelectedSupplement] = useState('');
  const [customSupplement, setCustomSupplement] = useState('');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('g');
  const [supplements, setSupplements] = useState(JSON.parse(localStorage.getItem('supplements')) || []);
  const [profile, setProfile] = useState({});
  const [customSupplements, setCustomSupplements] = useState([]);
  const [customExercises, setCustomExercises] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [exercises, setExercises] = useState(JSON.parse(localStorage.getItem('exercises')) || []);
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');

  const splitOptions = {
    'push-pull-legs': ['Push', 'Pull', 'Legs', 'Cardio'],
    'upper-lower': ['Upper', 'Lower', 'Cardio'],
    'full-body': ['Full Body', 'Cardio'],
    'bro-split': ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Cardio'],
    'body-part': ['Chest and Triceps', 'Back and Biceps', 'Shoulders and Abs', 'Legs', 'Cardio'],
    'push-pull': ['Push', 'Pull', 'Cardio'],
    'hybrid': ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Chest', 'Back', 'Shoulders', 'Arms', 'Chest and Triceps', 'Back and Biceps', 'Shoulders and Abs', 'Legs', 'Cardio'],
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
          setCustomExercises(data.customExercises || {});
        } else {
          setProfile({ split: '' });
        }
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    localStorage.setItem('exercises', JSON.stringify(exercises));
  }, [exercises]);

  useEffect(() => {
    localStorage.setItem('supplements', JSON.stringify(supplements));
  }, [supplements]);

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

  const handleAddExercise = () => {
    const exerciseToSave = customExercise ? customExercise : exercise;
    const newExercise = {
      exercise: exerciseToSave,
      weight: sameWeight ? weight : weights,
      sets,
      reps,
      duration,
      distance,
    };
    setExercises([...exercises, newExercise]);
    // Clear form fields after adding exercise
    setExercise('');
    setCustomExercise('');
    setWeight('');
    setWeights(['']);
    setSets('');
    setReps(['']);
    setDuration('');
    setDistance('');
  };

  const handleLogWorkout = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      try {
        await addDoc(collection(db, 'workouts'), {
          exercises,
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
        localStorage.removeItem('exercises');
        localStorage.removeItem('supplements');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000); // Redirect after 2 seconds

        // Update custom exercises in the profile
        const newCustomExercises = exercises.reduce((acc, ex) => {
          if (!acc[splitDay]) {
            acc[splitDay] = [];
          }
          if (!acc[splitDay].includes(ex.exercise)) {
            acc[splitDay].push(ex.exercise);
          }
          return acc;
        }, { ...customExercises });

        const profileRef = doc(db, 'profiles', user.uid);
        await updateDoc(profileRef, {
          customExercises: newCustomExercises
        });
        setCustomExercises(newCustomExercises);

        // Clear form fields after logging workout
        setExercise('');
        setCustomExercise('');
        setWeight('');
        setWeights(['']);
        setSets('');
        setReps(['']);
        setNutrition('');
        setQuality('');
        setSplitDay('');
        setSupplements([]);
        setExercises([]);
        setDuration('');
        setDistance('');
      } catch (error) {
        console.error(error);
        setErrorMessage(error.message);
        setSuccessMessage('');
      }
    }
  };

  const allSupplements = [...predefinedSupplements, ...customSupplements];
  const filteredExercises = customExercises[splitDay] || [];

  const handleSetsChange = (e) => {
    const value = e.target.value;
    setSets(value);
    const newReps = Array.from({ length: value }, () => '');
    const newWeights = Array.from({ length: value }, () => '');
    setReps(newReps);
    setWeights(newWeights);
  };

  const handleRepsChange = (index, value) => {
    const newReps = [...reps];
    newReps[index] = value;
    setReps(newReps);
  };

  const handleWeightsChange = (index, value) => {
    const newWeights = [...weights];
    newWeights[index] = value;
    setWeights(newWeights);
  };

  const handleRemoveExercise = (index) => {
    const newExercises = exercises.filter((_, i) => i !== index);
    setExercises(newExercises);
  };

  const handleSplitDayChange = (e) => {
    const value = e.target.value;
    setSplitDay(value);
    if (value === 'Cardio') {
      setWeight('');
      setWeights(['']);
      setSets(1);
      setReps(['']);
      setDuration('');
      setDistance('');
    }
  };

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
            onChange={handleSplitDayChange}
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
            {filteredExercises.map((exercise, index) => (
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

        {splitDay === 'Cardio' ? (
          <>
            <Form.Group controlId="formDuration">
              <Form.Label>Duration (minutes)</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="formDistance">
              <Form.Label>Distance (miles)</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter distance"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
            </Form.Group>
          </>
        ) : (
          <>
            <Form.Group controlId="sameWeight">
              <Form.Check
                type="checkbox"
                label="Same weight for all sets"
                checked={sameWeight}
                onChange={(e) => setSameWeight(e.target.checked)}
              />
            </Form.Group>
            {sameWeight ? (
              <Form.Group controlId="formWeight">
                <Form.Label>Weight (lbs)</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                />
              </Form.Group>
            ) : (
              <>
                {weights.map((w, index) => (
                  <Form.Group key={index} controlId={`formWeight${index}`}>
                    <Form.Label>Weight for Set {index + 1} (lbs)</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder={`Enter weight for set ${index + 1}`}
                      value={w}
                      onChange={(e) => handleWeightsChange(index, e.target.value)}
                      required
                    />
                  </Form.Group>
                ))}
              </>
            )}
            <Form.Group controlId="formSets">
              <Form.Label>Sets</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter sets"
                value={sets}
                onChange={handleSetsChange}
                required
              />
            </Form.Group>
            {reps.map((rep, index) => (
              <Form.Group key={index} controlId={`formReps${index}`}>
                <Form.Label>Reps for Set {index + 1}</Form.Label>
                <Form.Control
                  type="number"
                  placeholder={`Reps for Set ${index + 1}`}
                  value={rep}
                  onChange={(e) => handleRepsChange(index, e.target.value)}
                  required
                />
              </Form.Group>
            ))}
          </>
        )}

        <Button onClick={handleAddExercise} style={{ marginTop: '20px' }}>
          Add Exercise
        </Button>
        <div>
          {exercises.map((ex, index) => (
            <div key={index}>
              <Badge
                pill
                bg="info"
                style={{ marginRight: '5px', marginTop: '10px', cursor: 'pointer' }}
                onClick={() => handleRemoveExercise(index)}
              >
                {splitDay === 'Cardio' ? 
                  `${ex.exercise} - ${ex.duration ? `${ex.duration} minutes` : ''} ${ex.distance ? `${ex.distance} miles` : ''}` :
                  `${ex.exercise} - ${ex.weight} lbs - ${ex.sets} sets - ${ex.reps.join(', ')} reps`
                }
              </Badge>
            </div>
          ))}
        </div>
        <Form.Group controlId="formNutrition" style={{ marginTop: '20px' }}>
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
            <option value="Poor">Poor</option>
            <option value="Normal">Normal</option>
            <option value="Great">Great</option>
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
            <Badge key={index} pill bg="info" style={{ marginRight: '5px', marginTop: '10px', cursor: 'pointer' }}>
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
