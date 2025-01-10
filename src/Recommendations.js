// src/Recommendations.js
import React, { useState, useEffect } from 'react';
import { Badge, Spinner, Alert } from 'react-bootstrap';
import { db, auth } from './firebase';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';

async function fetchWorkoutData() {
  // Example: Retrieve all workouts for the current user.
  const user = auth.currentUser;
  if (!user) return [];
  try {
    const workoutsRef = collection(db, 'workouts');
    const q = query(workoutsRef, where('uid', '==', user.uid), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching workouts:", error);
    return [];
  }
}

async function fetchProfileData() {
  const user = auth.currentUser;
  if (!user) return null;
  const profileSnap = await getDoc(doc(db, 'profiles', user.uid));
  return profileSnap.exists() ? profileSnap.data() : null;
}

async function fetchChatGPT(prompt) {
  const response = await fetch('https://us-central1-workout-tracker-9d1ec.cloudfunctions.net/chatCompletion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  const data = await response.json();
  return data.completion;
}

const Recommendations = () => {
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePlanClick = async (planType) => {
    setLoading(true);
    setErrorMessage('');
    try {
      // Fetch necessary data
      const workouts = await fetchWorkoutData();
      const profile = await fetchProfileData();

      // Construct a summary from profile and workouts
      const workoutSummary = workouts.slice(0, 5).map(w => ({
        splitDay: w.splitDay,
        exercises: w.exercises,
        quality: w.quality
      }));
      const summary = `User Profile: ${JSON.stringify(profile)}. Recent Workouts: ${JSON.stringify(workoutSummary)}.`;

      // Build prompt based on plan type
      let prompt = '';
      if (planType === 'pre-workout') {
        prompt = `${summary} Based on this data, recommend a pre-workout plan: what to eat and which supplements to take and when.`;
      } else if (planType === 'workout') {
        prompt = `${summary} Based on this data, suggest a workout plan for today with exercise order, sets, and reps to maximize gains and minimize fatigue.`;
      } else if (planType === 'post-workout') {
        prompt = `${summary} Based on this data, provide a post-workout plan: what to eat and which supplements to take.`;
      }

      // Fetch AI recommendation from ChatGPT
      const recommendation = await fetchChatGPT(prompt);
      setAiRecommendation(recommendation);
    } catch (error) {
      console.error(error);
      setErrorMessage('Failed to fetch recommendation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Recommendations</h2>
      {/* Pills/Badges for plan types */}
      <Badge
        pill
        bg="primary"
        style={{ cursor: 'pointer', marginRight: '10px' }}
        onClick={() => handlePlanClick('pre-workout')}
      >
        Pre-Workout Plan
      </Badge>
      <Badge
        pill
        bg="secondary"
        style={{ cursor: 'pointer', marginRight: '10px' }}
        onClick={() => handlePlanClick('workout')}
      >
        Workout Plan
      </Badge>
      <Badge
        pill
        bg="success"
        style={{ cursor: 'pointer' }}
        onClick={() => handlePlanClick('post-workout')}
      >
        Post-Workout Plan
      </Badge>

      {/* Loading spinner */}
      {loading && <Spinner animation="border" />}

      {/* Error Message */}
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {/* Display AI Recommendation */}
      {aiRecommendation && (
        <div style={{ marginTop: '20px' }}>
          <h4>AI Recommendation:</h4>
          <p>{aiRecommendation}</p>
        </div>
      )}
    </div>
  );
};

export default Recommendations;
