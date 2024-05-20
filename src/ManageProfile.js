// src/ManageProfile.js
import React, { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { db, auth } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const supplementsList = [
  { name: 'Creatine', dosage: 5 },
  { name: 'BCAAs', dosage: 5 },
  { name: 'Protein', dosage: 30 },
  { name: 'Beta-alanine', dosage: 5 },
  { name: 'Caffeine', dosage: 200 },
  { name: 'Glutamine', dosage: 5 },
  { name: 'Pre-Workout', dosage: 10 },
  { name: 'Post-Workout', dosage: 30 },
];

const generateSupplementOptions = () => {
  let options = [];
  supplementsList.forEach(supplement => {
    for (let i = -10; i <= 10; i += 5) {
      const dosage = supplement.dosage + i;
      if (dosage > 0) {
        options.push(`${supplement.name} - ${dosage}g`);
      }
    }
  });
  return options;
};

const ManageProfile = () => {
  const [split, setSplit] = useState('');
  const [supplements, setSupplements] = useState([]);
  const [amount, setAmount] = useState('');
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
          setSplit(data.split || '');
          setSupplements(data.supplements ? data.supplements.split(',') : []);
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
          split,
          supplements: supplements.join(','),
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

  const supplementOptions = generateSupplementOptions();

  return (
    <>
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      <Form onSubmit={handleProfileSave}>
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
        <Form.Group controlId="formSupplements">
          <Form.Label>Supplements</Form.Label>
          <Form.Control
            as="select"
            multiple
            value={supplements}
            onChange={(e) => setSupplements(Array.from(e.target.selectedOptions, option => option.value))}
          >
            {supplementOptions.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </Form.Control>
        </Form.Group>
        <Button variant="primary" type="submit">
          Save Profile
        </Button>
      </Form>
    </>
  );
};

export default ManageProfile;
