import React, { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { db, auth } from './firebase';
import { doc, setDoc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';

const ManageProfile = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [split, setSplit] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [bmi, setBmi] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [musclemass, setMuscleMass] = useState('');
  const [customExercises, setCustomExercises] = useState({});
  const [customSupplements, setCustomSupplements] = useState([]);
  const [excludedDays, setExcludedDays] = useState({ Cardio: false, Swimming: false });  
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const profileRef = doc(db, 'profiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setSplit(data.split || '');
          setAge(data.age || '');
          setGender(data.gender || '');
          setWeight(data.weight || '');
          if (data.height) {
            const [ft, inch] = data.height.split("' ");
            setHeightFt(ft || '');
            setHeightIn(inch?.replace('"', '') || '');
          }
          setBmi(data.bmi || '');
          setBodyFat(data.bodyFat || '');
          setMuscleMass(data.musclemass || "");
          setCustomExercises(data.customExercises || {});
          setExcludedDays(data.excludedDays || { Cardio: false, Swimming: false });
          setCustomSupplements(data.customSupplements || []);
        }
      }
    };
    fetchProfile();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      try {
        const profileRef = doc(db, 'profiles', user.uid);
        await setDoc(profileRef, {
          firstName,
          lastName,
          split,
          age,
          gender,
          weight,
          height: `${heightFt}' ${heightIn}"`,
          bmi,
          bodyFat,
          musclemass,
          customExercises,  
          customSupplements,  
          excludedDays,      
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }, { merge: true });

        // Save weight, BMI, body fat, and muscle mass updates to the metrics sub-collection
        const metricsRef = collection(profileRef, 'metrics');
        const timestamp = Timestamp.now();
        await addDoc(metricsRef, {
          weight,
          bmi,
          bodyFat,
          musclemass,
          timestamp
        });

        setSuccessMessage('Profile updated successfully!');
        setErrorMessage('');
      } catch (error) {
        console.error(error);
        setErrorMessage(error.message);
        setSuccessMessage('');
      }
    }
  };

  return (
    <>
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      <Form onSubmit={handleProfileSave}>
        <Form.Group controlId="formFirstName">
          <Form.Label>First Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter your first name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="formLastName">
          <Form.Label>Last Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter your last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="formSplit">
          <Form.Label>Workout Split</Form.Label>
          <Form.Control
            as="select"
            value={split}
            onChange={(e) => setSplit(e.target.value)}
          >
            <option value="">Select Split</option>
            <option value="push-pull-legs">Push/Pull/Legs - Push (chest, shoulders, triceps), Pull (back, biceps), Legs (quads, hamstrings, calves)</option>
            <option value="upper-lower">Upper/Lower - Upper body (chest, back, shoulders, arms), Lower body (quads, hamstrings, glutes, calves)</option>
            <option value="full-body">Full Body - Each workout targets the entire body, typically performed 2-3 times per week</option>
            <option value="bro-split">Bro Split - Day 1: Chest, Day 2: Back, Day 3: Shoulders, Day 4: Arms, Day 5: Legs</option>
            <option value="body-part">Body Part Split - Day 1: Chest and Triceps, Day 2: Back and Biceps, Day 3: Shoulders and Abs, Day 4: Legs</option>
            <option value="push-pull">Push/Pull - Push (upper body pushing exercises, lower body exercises), Pull (upper body pulling exercises, core/abs)</option>
            <option value="hybrid">Hybrid Split - Combination of different splits based on individual preferences and goals</option>
          </Form.Control>
        </Form.Group>
        <Form.Group controlId="formAge">
          <Form.Label>Age</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter your age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="formGender">
          <Form.Label>Gender</Form.Label>
          <Form.Control
            as="select"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Form.Control>
        </Form.Group>
        <Form.Group controlId="formWeight">
          <Form.Label>Weight (lbs)</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter your weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="formHeight">
          <Form.Label>Height</Form.Label>
          <div style={{ display: 'flex' }}>
            <Form.Control
              type="number"
              placeholder="ft"
              value={heightFt}
              onChange={(e) => setHeightFt(e.target.value)}
              style={{ marginRight: '10px' }}
            />
            <Form.Control
              type="number"
              placeholder="in"
              value={heightIn}
              onChange={(e) => setHeightIn(e.target.value)}
            />
          </div>
        </Form.Group>
        <Form.Group controlId="formBmi">
          <Form.Label>BMI</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter your BMI"
            value={bmi}
            onChange={(e) => setBmi(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="formBodyFat">
          <Form.Label>Body Fat Percentage (%)</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter your body fat percentage"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="formMuscleMass">
          <Form.Label>Muscle Mass (lbs)</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter your muscle mass"
            value={musclemass}
            onChange={(e) => setMuscleMass(e.target.value)}
          />
        </Form.Group>

        {/* Example: Excluded Days (checkboxes) */}
        <Form.Group controlId="formExcludedDays" style={{ marginTop: '20px' }}>
          <Form.Label>Exclude Days</Form.Label>
          <div>
            <Form.Check
              type="checkbox"
              label="Exclude Cardio"
              checked={excludedDays.Cardio}
              onChange={(e) =>
                setExcludedDays({ ...excludedDays, Cardio: e.target.checked })
              }
            />
            <Form.Check
              type="checkbox"
              label="Exclude Swimming"
              checked={excludedDays.Swimming}
              onChange={(e) =>
                setExcludedDays({ ...excludedDays, Swimming: e.target.checked })
              }
            />
          </div>
        </Form.Group>

        <Button variant="primary" type="submit">
          Save Profile
        </Button>
      </Form>
    </>
  );
};

export default ManageProfile;
