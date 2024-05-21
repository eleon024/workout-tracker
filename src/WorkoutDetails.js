import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button } from 'react-bootstrap';

const WorkoutDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
      <Button variant="secondary" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
        Back
      </Button>
      <h2>Workout Details</h2>
      <p><strong>Date:</strong> {new Date(workout.timestamp.seconds * 1000).toLocaleDateString()}</p>
      <Row xs={1} md={2} lg={3} className="g-4">
        {workout.exercises.map((exercise, index) => (
          <Col key={index}>
            <Card>
              <Card.Body>
                <Card.Title>{exercise.exercise}</Card.Title>
                {exercise.weight && (
                  <Card.Text><strong>Weight:</strong> {exercise.weight} lbs</Card.Text>
                )}
                {exercise.sets && (
                  <Card.Text><strong>Sets:</strong> {exercise.sets}</Card.Text>
                )}
                {exercise.reps && exercise.reps.length > 0 && (
                  <Card.Text><strong>Reps:</strong> {exercise.reps.join(', ')}</Card.Text>
                )}
                {exercise.duration && (
                  <Card.Text><strong>Duration:</strong> {exercise.duration} minutes</Card.Text>
                )}
                {exercise.distance && (
                  <Card.Text><strong>Distance:</strong> {exercise.distance} km</Card.Text>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      <Row className="g-4" style={{ marginTop: '20px' }}>
        <Col>
          <Card>
            <Card.Body>
              <Card.Text><strong>Nutrition:</strong> {workout.nutrition}</Card.Text>
              <Card.Text><strong>Quality:</strong> {workout.quality}</Card.Text>
              <Card.Text><strong>Split Day:</strong> {workout.splitDay}</Card.Text>
              <Card.Text><strong>Supplements:</strong> {workout.supplements.join(', ')}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default WorkoutDetails;
