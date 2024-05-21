import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Button, Alert, Card, Row, Col, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState(null);

  useEffect(() => {
    const fetchWorkouts = async () => {
      const user = auth.currentUser;
      if (user) {
        const workoutsRef = collection(db, 'workouts');
        const q = query(workoutsRef, where('uid', '==', user.uid), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        const workoutData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWorkouts(workoutData);
        setLoading(false);
      }
    };
    fetchWorkouts();
  }, []);

  const handleDelete = async () => {
    if (workoutToDelete) {
      await deleteDoc(doc(db, 'workouts', workoutToDelete));
      setWorkouts(workouts.filter(workout => workout.id !== workoutToDelete));
      setShowModal(false);
    }
  };

  const confirmDelete = (workoutId) => {
    setWorkoutToDelete(workoutId);
    setShowModal(true);
  };

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : workouts.length === 0 ? (
        <Alert variant="info">
          No workouts logged yet. <Button onClick={() => navigate('/log-workout')}>Log a workout!</Button> Past workouts will be displayed here.
        </Alert>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {workouts.map((workout, index) => (
            <Col key={index}>
              <Card style={{ position: 'relative' }}>
                <Card.Body onClick={() => navigate(`/workout/${workout.id}`)} style={{ cursor: 'pointer' }}>
                  <Card.Title>Workout on {new Date(workout.timestamp.seconds * 1000).toLocaleDateString()}</Card.Title>
                </Card.Body>
                <FaTrash
                  onClick={() => confirmDelete(workout.id)}
                  style={{
                    color: 'red',
                    cursor: 'pointer',
                    position: 'absolute',
                    top: '10px',
                    right: '10px'
                  }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this workout?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserDashboard;
