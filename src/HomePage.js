import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, Badge, Button, Alert, Row, Col, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const HomePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});
  const [lastWorkout, setLastWorkout] = useState(null);
  const [lastNextSplitWorkout, setLastNextSplitWorkout] = useState(null);
  const [nextSplitDay, setNextSplitDay] = useState('');
  const [splitDayExercises, setSplitDayExercises] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);

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
        }
      }
    };

    const fetchLastWorkout = async () => {
      const user = auth.currentUser;
      if (user) {
        const workoutsRef = collection(db, 'workouts');
        const q = query(workoutsRef, where('uid', '==', user.uid), orderBy('timestamp', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const workoutData = querySnapshot.docs[0].data();
          setLastWorkout(workoutData);
          setSplitDayExercises(workoutData.exercises || []);
          determineNextSplitDay(workoutData.splitDay);
        }
      }
    };

    const fetchWorkouts = async () => {
      const user = auth.currentUser;
      if (user) {
        const workoutsRef = collection(db, 'workouts');
        const q = query(workoutsRef, where('uid', '==', user.uid), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        const workoutData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWorkouts(workoutData);
        setLoading(false);

        if (nextSplitDay) {
          const nextSplitWorkout = workoutData.find(workout => workout.splitDay === nextSplitDay);
          if (nextSplitWorkout) {
            setLastNextSplitWorkout(nextSplitWorkout);
          }
        }
      }
    };

    const fetchMetrics = async () => {
      const user = auth.currentUser;
      if (user) {
        const metricsRef = collection(db, 'profiles', user.uid, 'metrics');
        const q = query(metricsRef, orderBy('timestamp', 'asc'));
        const querySnapshot = await getDocs(q);
        const metricsData = querySnapshot.docs.map(doc => doc.data());
        setMetrics(metricsData);
        setLoading(false);
      }
    };

    const determineNextSplitDay = (lastSplitDay) => {
      if (profile.split && splitOptions[profile.split]) {
        const splitDays = splitOptions[profile.split].filter(day => day !== 'Cardio');
        const currentIndex = splitDays.indexOf(lastSplitDay);
        const nextIndex = (currentIndex + 1) % splitDays.length;
        setNextSplitDay(splitDays[nextIndex]);
      }
    };

    fetchProfile();
    fetchLastWorkout();
    fetchWorkouts();
    fetchMetrics();
  }, [profile.split, splitOptions, nextSplitDay]);

  const handleDelete = async () => {
    if (workoutToDelete) {
      await deleteDoc(doc(db, 'workouts', workoutToDelete));
      setWorkouts(workouts.filter(workout => workout.id !== workoutToDelete));
      setShowModal(false);
    }
  };

  const confirmDelete = (workoutId, e) => {
    e.stopPropagation();
    setWorkoutToDelete(workoutId);
    setShowModal(true);
  };

  const handleConfirmRecommendation = async () => {
    await updateProfileRecommendations(nextSplitDay, true);
    setConfirmModal(false);
  };

  const handleDenyRecommendation = async () => {
    await updateProfileRecommendations(nextSplitDay, false);
    setConfirmModal(false);
  };

  const updateProfileRecommendations = async (day, isConfirmed) => {
    const user = auth.currentUser;
    if (user) {
      const profileRef = doc(db, 'profiles', user.uid);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        const recommendations = data.recommendations || {};
        recommendations[day] = isConfirmed;
        await updateDoc(profileRef, { recommendations });
      }
    }
  };

  const sortedWorkouts = () => {
    const sorted = workouts.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
    return sorted;
  };

  const generateChartData = (label, dataKey) => {
    return {
      labels: metrics.map(metric => new Date(metric.timestamp.seconds * 1000).toLocaleDateString()),
      datasets: [
        {
          label,
          data: metrics.map(metric => metric[dataKey]),
          borderColor: 'rgba(75,192,192,1)',
          backgroundColor: 'rgba(75,192,192,0.2)',
        },
      ],
    };
  };

  return (
    <div>
      <h1>Welcome back, {profile.firstName || 'User'}!</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <Row xs={1} md={2} lg={3} className="g-4" style={{ marginTop: '20px' }}>
            <Col>
              <Card>
                <Card.Body>
                  <Card.Title>Weight Over Time</Card.Title>
                  <Line data={generateChartData('Weight', 'weight')} />
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card>
                <Card.Body>
                  <Card.Title>BMI Over Time</Card.Title>
                  <Line data={generateChartData('BMI', 'bmi')} />
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card>
                <Card.Body>
                  <Card.Title>Body Fat Over Time</Card.Title>
                  <Line data={generateChartData('Body Fat', 'bodyFat')} />
                </Card.Body>
              </Card>
            </Col>
          </Row>
          {lastWorkout && (
            <>
              <br></br><h2>Today is likely to be a "{nextSplitDay}" day</h2>
              <Button onClick={() => setConfirmModal(true)} style={{ marginBottom: '20px', marginRight: '10px' }}>Confirm</Button>
              <Button onClick={handleDenyRecommendation} style={{ marginBottom: '20px' }}>Deny</Button>
              {lastNextSplitWorkout && (
                <>
                  <br></br><h3>Last {nextSplitDay} Workout</h3>
                  <Card>
                    <Card.Body>
                      {lastNextSplitWorkout.exercises.map((exercise, index) => (
                        <Badge key={index} pill bg="info" style={{ marginRight: '5px', marginTop: '10px' }}>
                          {lastNextSplitWorkout.splitDay === 'Cardio' ? 
                            `${exercise.exercise} - ${exercise.duration ? `${exercise.duration} minutes` : ''} ${exercise.distance ? `${exercise.distance} miles` : ''}` :
                            `${exercise.exercise} - ${exercise.weight} lbs - ${exercise.sets} sets - ${exercise.reps.join(', ')} reps`
                          }
                        </Badge>
                      ))}
                    </Card.Body>
                  </Card>
                </>
              )}
              <br></br><h3>Last {lastWorkout.splitDay} Workout</h3>
              <Card>
                <Card.Body>
                  {splitDayExercises.map((exercise, index) => (
                    <Badge key={index} pill bg="info" style={{ marginRight: '5px', marginTop: '10px' }}>
                      {lastWorkout.splitDay === 'Cardio' ? 
                        `${exercise.exercise} - ${exercise.duration ? `${exercise.duration} minutes` : ''} ${exercise.distance ? `${exercise.distance} miles` : ''}` :
                        `${exercise.exercise} - ${exercise.weight} lbs - ${exercise.sets} sets - ${exercise.reps.join(', ')} reps`
                      }
                    </Badge>
                  ))}
                </Card.Body>
              </Card>
            </>
          )}
          {!lastWorkout && (
            <p>No workouts logged yet. <Button onClick={() => navigate('/log-workout')}>Log a workout!</Button></p>
          )}

          <h2 style={{ marginTop: '40px' }}>Your Workouts</h2>
          {workouts.length === 0 ? (
            <Alert variant="info">
              No workouts logged yet. <Button onClick={() => navigate('/log-workout')}>Log a workout!</Button> Past workouts will be displayed here.
            </Alert>
          ) : (
            <Row xs={1} md={2} lg={3} className="g-4" style={{ marginTop: '20px' }}>
              {sortedWorkouts().map((workout, index) => (
                <Col key={index}>
                  <Card style={{ position: 'relative' }}>
                    <Card.Body onClick={() => navigate(`/workout/${workout.id}`)} style={{ cursor: 'pointer' }}>
                      <Card.Title>
                        {workout.splitDay} Workout on {new Date(workout.timestamp.seconds * 1000).toLocaleDateString()}
                      </Card.Title>
                    </Card.Body>
                    <FaTrash
                      onClick={(e) => confirmDelete(workout.id, e)}
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

          <Modal show={confirmModal} onHide={() => setConfirmModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Confirm Recommendation</Modal.Title>
            </Modal.Header>
            <Modal.Body>Do you agree that today is likely to be a "{nextSplitDay}" day?</Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleDenyRecommendation}>
                Deny
              </Button>
              <Button variant="primary" onClick={handleConfirmRecommendation}>
                Confirm
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
};

export default HomePage;
