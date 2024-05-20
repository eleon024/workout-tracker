// src/ManageProfile.js
import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { db, auth } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const ManageProfile = () => {
  const [split, setSplit] = useState('');
  const [supplements, setSupplements] = useState('');
  const [amount, setAmount] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      try {
        const profileRef = doc(db, 'profiles', user.uid);
        await setDoc(profileRef, {
          split,
          supplements,
          amount,
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
        <Form.Group controlId="formSplit">
          <Form.Label>Workout Split</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter your workout split (e.g., push, pull, legs)"
            value={split}
            onChange={(e) => setSplit(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="formSupplements">
          <Form.Label>Supplements</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter supplements used"
            value={supplements}
            onChange={(e) => setSupplements(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="formAmount">
          <Form.Label>Amount</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter amount of supplements"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          Save Profile
        </Button>
      </Form>
    </>
  );
};

export default ManageProfile;
