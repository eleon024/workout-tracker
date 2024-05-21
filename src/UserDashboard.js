// src/UserDashboard.js
import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, getDocs, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Modal } from 'react-bootstrap';
import { FaTrashAlt } from 'react-icons/fa';

const UserDashboard = () => {
  const [workouts, setWorkouts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkouts = async () => {
      const user = auth.currentUser;
      if (user) {
        const q = query(
          collection(db, 'workouts'),
          where('uid', '==', user.uid),
          orderBy('timestamp', 'desc') // Order by timestamp descending
        );
        const querySnapshot = await getDocs(q);
        const workoutsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setWorkouts(workoutsData);
      }
    };
    fetchWorkouts();
  }, []);

  const handleTileClick = (id) => {
    navigate(`/workout/${id}`);
  };

  const handleDeleteClick = (workout) => {
    setWorkoutToDelete(workout);
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (workoutToDelete) {
      await deleteDoc(doc(db, 'workouts', workoutToDelete.id));
      setWorkouts(workouts.filter(workout => workout.id !== workoutToDelete.id));
      setShowModal(false);
      setWorkoutToDelete(null);
    }
  };

  return (
    <div className="dashboard">
      {workouts.map(workout => (
        <Card key={workout.id} style={{ margin: '10px' }}>
          <Card.Body style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div onClick={() => handleTileClick(workout.id)} style={{ cursor: 'pointer' }}>
              <Card.Title>{new Date(workout.timestamp.seconds * 1000).toLocaleDateString()}</Card.Title>
            </div>
            <FaTrashAlt
              style={{ cursor: 'pointer' }}
              onClick={() => handleDeleteClick(workout)}
            />
          </Card.Body>
        </Card>
      ))}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this workout?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserDashboard;
