import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, Badge, Button, Alert, Row, Col, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import 'chartjs-adapter-date-fns'; // Import the date adapter

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
  const [error, setError] = useState(null);

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
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          // Fetch profile, last workout, workouts, and metrics in parallel
          const [profileSnap, lastWorkoutSnap, workoutsSnap, metricsSnap] = await Promise.all([
            getDoc(doc(db, 'profiles', user.uid)),
            getDocs(query(collection(db, 'workouts'), where('uid', '==', user.uid), orderBy('timestamp', 'desc'), limit(1))),
            getDocs(query(collection(db, 'workouts'), where('uid', '==', user.uid), orderBy('timestamp', 'desc'))),
            getDocs(query(collection(db, 'profiles', user.uid, 'metrics'), orderBy('timestamp', 'asc')))
          ]);

          // Set profile data
          if (profileSnap.exists()) {
            setProfile(profileSnap.data());
          }

          // Set last workout data
          if (!lastWorkoutSnap.empty) {
            const workoutData = lastWorkoutSnap.docs[0].data();
            setLastWorkout(workoutData);
            setSplitDayExercises(workoutData.exercises || []);
            determineNextSplitDay(workoutData.splitDay);
          }

          // Set workouts data
          const workoutData = workoutsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setWorkouts(workoutData);

          // Set last next split workout data
          if (nextSplitDay) {
            const nextSplitWorkout = workoutData.find(workout => workout.splitDay === nextSplitDay);
            if (nextSplitWorkout) {
              setLastNextSplitWorkout(nextSplitWorkout);
            }
          }

          // Set metrics data
          const metricsData = metricsSnap.docs.map(doc => doc.data());
          setMetrics(metricsData);

          setLoading(false);
        }
      } catch (error) {
        setError(error.message);
      }
    };

    fetchData();
  }, [profile.split, nextSplitDay]);

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

  const determineNextSplitDay = (lastSplitDay) => {
    if (profile.split && splitOptions[profile.split]) {
      const splitDays = splitOptions[profile.split].filter(day => day !== 'Cardio');
      const currentIndex = splitDays.indexOf(lastSplitDay);
      const nextIndex = (currentIndex + 1) % splitDays.length;
      setNextSplitDay(splitDays[nextIndex]);
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

  const chartOptions = {
    animation: false,
  };

  return (
    <div>
      <h1>Welcome back, {profile.firstName || 'User'}!</h1>
      <br></br><h2>Today is likely to be a "{nextSplitDay}" day</h2>
              <Button onClick={() => setConfirmModal(true)} style={{ marginBottom: '20px', marginRight: '10px' }}>Confirm</Button>
              <Button onClick={handleDenyRecommendation} style={{ marginBottom: '20px' }}>Deny</Button>

              
          {lastWorkout && (
            <>

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
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <Row xs={1} md={2} lg={2} className="g-4" style={{ marginTop: '20px' }}>
            <Col>
              <Card>
                <Card.Body>
                  <Card.Title>Weight Over Time</Card.Title>
                  <Line data={generateChartData('Weight', 'weight')} options={chartOptions} />
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card>
                <Card.Body>
                  <Card.Title>BMI Over Time</Card.Title>
                  <Line data={generateChartData('BMI', 'bmi')} options={chartOptions} />
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card>
                <Card.Body>
                  <Card.Title>Body Fat Over Time</Card.Title>
                  <Line data={generateChartData('Body Fat', 'bodyFat')} options={chartOptions} />
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card>
                <Card.Body>
                  <Card.Title>Muscle Mass Over Time</Card.Title>
                  <Line data={generateChartData('Muscle Mass', 'musclemass')} options={chartOptions} />
                </Card.Body>
              </Card>
            </Col>
          </Row>

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

// WORKING V2 BELOW

// import React, { useState, useEffect } from 'react';
// import { db, auth } from './firebase';
// import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
// import { Card, Badge, Button, Alert, Row, Col, Modal } from 'react-bootstrap';
// import { useNavigate } from 'react-router-dom';
// import { FaTrash } from 'react-icons/fa';
// import { Line, Pie, Bar } from 'react-chartjs-2';
// import 'chart.js/auto';
// import 'chartjs-adapter-date-fns';

// const HomePage = () => {
//   const navigate = useNavigate();
//   const [profile, setProfile] = useState({});
//   const [lastWorkout, setLastWorkout] = useState(null);
//   const [lastNextSplitWorkout, setLastNextSplitWorkout] = useState(null);
//   const [nextSplitDay, setNextSplitDay] = useState('');
//   const [splitDayExercises, setSplitDayExercises] = useState([]);
//   const [workouts, setWorkouts] = useState([]);
//   const [metrics, setMetrics] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   const [workoutToDelete, setWorkoutToDelete] = useState(null);
//   const [confirmModal, setConfirmModal] = useState(false);
//   const [error, setError] = useState(null);
//   const [exerciseNames, setExerciseNames] = useState([]);

//   const splitOptions = {
//     'push-pull-legs': ['Push', 'Pull', 'Legs'],
//     'upper-lower': ['Upper', 'Lower'],
//     'full-body': ['Full Body'],
//     'bro-split': ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs'],
//     'body-part': ['Chest and Triceps', 'Back and Biceps', 'Shoulders and Abs', 'Legs'],
//     'push-pull': ['Push', 'Pull'],
//     'hybrid': ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Chest', 'Back', 'Shoulders', 'Arms', 'Chest and Triceps', 'Back and Biceps', 'Shoulders and Abs', 'Legs'],
//   };

//   useEffect(() => {
//     if (auth.currentUser) {
//       fetchData();
//     }
//   }, [auth.currentUser]);

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       const user = auth.currentUser;
//       if (user) {
//         const [profileSnap, lastWorkoutSnap, workoutsSnap, metricsSnap] = await Promise.all([
//           getDoc(doc(db, 'profiles', user.uid)),
//           getDocs(query(collection(db, 'workouts'), where('uid', '==', user.uid), orderBy('timestamp', 'desc'), limit(1))),
//           getDocs(query(collection(db, 'workouts'), where('uid', '==', user.uid), orderBy('timestamp', 'desc'))),
//           getDocs(query(collection(db, 'profiles', user.uid, 'metrics'), orderBy('timestamp', 'asc')))
//         ]);

//         if (profileSnap.exists()) {
//           setProfile(profileSnap.data());
//         }

//         if (!lastWorkoutSnap.empty) {
//           const workoutData = lastWorkoutSnap.docs[0].data();
//           setLastWorkout(workoutData);
//           setSplitDayExercises(workoutData.exercises || []);
//           determineNextSplitDay(workoutData.splitDay);
//         }

//         const workoutData = workoutsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         setWorkouts(workoutData);

//         if (nextSplitDay) {
//           const nextSplitWorkout = workoutData.find(workout => workout.splitDay === nextSplitDay);
//           if (nextSplitWorkout) {
//             setLastNextSplitWorkout(nextSplitWorkout);
//           }
//         }

//         const metricsData = metricsSnap.docs.map(doc => doc.data());
//         setMetrics(metricsData);

//         const exercises = new Set();
//         workoutData.forEach(workout => {
//           workout.exercises.forEach(exercise => {
//             exercises.add(exercise.exercise);
//           });
//         });
//         setExerciseNames(Array.from(exercises));

//         setLoading(false);
//       }
//     } catch (error) {
//       setError(error.message);
//       setLoading(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (workoutToDelete) {
//       await deleteDoc(doc(db, 'workouts', workoutToDelete));
//       setWorkouts(workouts.filter(workout => workout.id !== workoutToDelete));
//       setShowModal(false);
//     }
//   };

//   const confirmDelete = (workoutId, e) => {
//     e.stopPropagation();
//     setWorkoutToDelete(workoutId);
//     setShowModal(true);
//   };

//   const handleConfirmRecommendation = async () => {
//     await updateProfileRecommendations(nextSplitDay, true);
//     setConfirmModal(false);
//   };

//   const handleDenyRecommendation = async () => {
//     await updateProfileRecommendations(nextSplitDay, false);
//     setConfirmModal(false);
//   };

//   const updateProfileRecommendations = async (day, isConfirmed) => {
//     const user = auth.currentUser;
//     if (user) {
//       const profileRef = doc(db, 'profiles', user.uid);
//       const profileSnap = await getDoc(profileRef);
//       if (profileSnap.exists()) {
//         const data = profileSnap.data();
//         const recommendations = data.recommendations || {};
//         recommendations[day] = isConfirmed;
//         await updateDoc(profileRef, { recommendations });
//       }
//     }
//   };

//   const determineNextSplitDay = (lastSplitDay) => {
//     if (profile.split && splitOptions[profile.split]) {
//       const splitDays = splitOptions[profile.split].filter(day => day !== 'Cardio');
//       const currentIndex = splitDays.indexOf(lastSplitDay);
//       const nextIndex = (currentIndex + 1) % splitDays.length;
//       setNextSplitDay(splitDays[nextIndex]);
//     }
//   };

//   const sortedWorkouts = () => {
//     const sorted = workouts.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
//     return sorted;
//   };

//   const generateChartData = (label, dataKey) => {
//     return {
//       labels: metrics.map(metric => new Date(metric.timestamp.seconds * 1000).toLocaleDateString()),
//       datasets: [
//         {
//           label,
//           data: metrics.map(metric => metric[dataKey]),
//           borderColor: 'rgba(75,192,192,1)',
//           backgroundColor: 'rgba(75,192,192,0.2)',
//         },
//       ],
//     };
//   };

//   const getExercisePerformanceData = (exerciseName) => {
//     const exerciseData = workouts.flatMap(workout => 
//       workout.exercises.filter(exercise => exercise.exercise === exerciseName).map(exercise => ({
//         date: new Date(workout.timestamp.seconds * 1000).toLocaleDateString(),
//         weight: exercise.weight,
//         reps: exercise.reps
//       }))
//     );

//     return {
//       labels: exerciseData.map(data => data.date),
//       datasets: [{
//         label: `${exerciseName} Performance`,
//         data: exerciseData.map(data => data.weight),
//         borderColor: 'rgba(153, 102, 255, 1)',
//         backgroundColor: 'rgba(153, 102, 255, 0.2)',
//         fill: false
//       }]
//     };
//   };

//   const getWorkoutQualityData = () => {
//     const qualityCounts = workouts.reduce((acc, workout) => {
//       acc[workout.quality] = (acc[workout.quality] || 0) + 1;
//       return acc;
//     }, {});
//     return {
//       labels: Object.keys(qualityCounts),
//       datasets: [{
//         label: 'Workout Quality Distribution',
//         data: Object.values(qualityCounts),
//         backgroundColor: [
//           'rgba(255, 99, 132, 0.6)',
//           'rgba(54, 162, 235, 0.6)',
//           'rgba(255, 206, 86, 0.6)'
//         ],
//         borderColor: [
//           'rgba(255, 99, 132, 1)',
//           'rgba(54, 162, 235, 1)',
//           'rgba(255, 206, 86, 1)'
//         ],
//         borderWidth: 1
//       }]
//     };
//   };

//   const getSupplementUsageData = () => {
//     const supplements = workouts.flatMap(workout => workout.supplements);
//     const supplementCounts = supplements.reduce((acc, supplement) => {
//       acc[supplement] = (acc[supplement] || 0) + 1;
//       return acc;
//     }, {});
//     return {
//       labels: Object.keys(supplementCounts),
//       datasets: [{
//         label: 'Supplement Usage',
//         data: Object.values(supplementCounts),
//         backgroundColor: 'rgba(255, 159, 64, 0.6)',
//         borderColor: 'rgba(255, 159, 64, 1)',
//         borderWidth: 1
//       }]
//     };
//   };

//   return (
//     <div>
//       <h1>Welcome back, {profile.firstName || 'User'}!</h1>
//       {loading ? (
//         <p>Loading...</p>
//       ) : (
//         <>
//           <Row xs={1} md={2} lg={3} className="g-4" style={{ marginTop: '20px' }}>
//             {exerciseNames.map((exerciseName, index) => (
//               <Col key={index}>
//                 <Card>
//                   <Card.Body>
//                     <Card.Title>{exerciseName} Performance</Card.Title>
//                     <Line data={getExercisePerformanceData(exerciseName)} />
//                   </Card.Body>
//                 </Card>
//               </Col>
//             ))}
//             <Col>
//               <Card>
//                 <Card.Body>
//                   <Card.Title>Workout Quality Distribution</Card.Title>
//                   <Pie data={getWorkoutQualityData()} />
//                 </Card.Body>
//               </Card>
//             </Col>
//             <Col>
//               <Card>
//                 <Card.Body>
//                   <Card.Title>Supplement Usage</Card.Title>
//                   <Bar data={getSupplementUsageData()} />
//                 </Card.Body>
//               </Card>
//             </Col>
//           </Row>
//           {lastWorkout && (
//             <>
//               <h2>Today is likely to be a {nextSplitDay} day</h2>
//               <Button onClick={() => setConfirmModal(true)} style={{ marginBottom: '20px', marginRight: '10px' }}>Confirm</Button>
//               <Button onClick={handleDenyRecommendation} style={{ marginBottom: '20px' }}>Deny</Button>
//               {lastNextSplitWorkout && (
//                 <>
//                   <h3>Last {nextSplitDay} Workout</h3>
//                   <Card>
//                     <Card.Body>
//                       {lastNextSplitWorkout.exercises.map((exercise, index) => (
//                         <Badge key={index} pill bg="info" style={{ marginRight: '5px', marginTop: '10px' }}>
//                           {lastNextSplitWorkout.splitDay === 'Cardio' ? 
//                             `${exercise.exercise} - ${exercise.duration ? `${exercise.duration} minutes` : ''} ${exercise.distance ? `${exercise.distance} miles` : ''}` :
//                             `${exercise.exercise} - ${exercise.weight} lbs - ${exercise.sets} sets - ${exercise.reps.join(', ')} reps`
//                           }
//                         </Badge>
//                       ))}
//                     </Card.Body>
//                   </Card>
//                 </>
//               )}
//               <h3>Last {lastWorkout.splitDay} Workout</h3>
//               <Card>
//                 <Card.Body>
//                   {splitDayExercises.map((exercise, index) => (
//                     <Badge key={index} pill bg="info" style={{ marginRight: '5px', marginTop: '10px' }}>
//                       {lastWorkout.splitDay === 'Cardio' ? 
//                         `${exercise.exercise} - ${exercise.duration ? `${exercise.duration} minutes` : ''} ${exercise.distance ? `${exercise.distance} miles` : ''}` :
//                         `${exercise.exercise} - ${exercise.weight} lbs - ${exercise.sets} sets - ${exercise.reps.join(', ')} reps`
//                       }
//                     </Badge>
//                   ))}
//                 </Card.Body>
//               </Card>
//             </>
//           )}
//           {!lastWorkout && (
//             <p>No workouts logged yet. <Button onClick={() => navigate('/log-workout')}>Log a workout!</Button></p>
//           )}

//           <h2 style={{ marginTop: '40px' }}>Your Workouts</h2>
//           {workouts.length === 0 ? (
//             <Alert variant="info">
//               No workouts logged yet. <Button onClick={() => navigate('/log-workout')}>Log a workout!</Button> Past workouts will be displayed here.
//             </Alert>
//           ) : (
//             <Row xs={1} md={2} lg={3} className="g-4" style={{ marginTop: '20px' }}>
//               {sortedWorkouts().map((workout, index) => (
//                 <Col key={index}>
//                   <Card style={{ position: 'relative' }}>
//                     <Card.Body onClick={() => navigate(`/workout/${workout.id}`)} style={{ cursor: 'pointer' }}>
//                       <Card.Title>
//                         {workout.splitDay} Workout on {new Date(workout.timestamp.seconds * 1000).toLocaleDateString()}
//                       </Card.Title>
//                     </Card.Body>
//                     <FaTrash
//                       onClick={(e) => confirmDelete(workout.id, e)}
//                       style={{
//                         color: 'red',
//                         cursor: 'pointer',
//                         position: 'absolute',
//                         top: '10px',
//                         right: '10px'
//                       }}
//                     />
//                   </Card>
//                 </Col>
//               ))}
//             </Row>
//           )}

//           <Modal show={showModal} onHide={() => setShowModal(false)}>
//             <Modal.Header closeButton>
//               <Modal.Title>Confirm Delete</Modal.Title>
//             </Modal.Header>
//             <Modal.Body>Are you sure you want to delete this workout?</Modal.Body>
//             <Modal.Footer>
//               <Button variant="secondary" onClick={() => setShowModal(false)}>
//                 Cancel
//               </Button>
//               <Button variant="danger" onClick={handleDelete}>
//                 Delete
//               </Button>
//             </Modal.Footer>
//           </Modal>

//           <Modal show={confirmModal} onHide={() => setConfirmModal(false)}>
//             <Modal.Header closeButton>
//               <Modal.Title>Confirm Recommendation</Modal.Title>
//             </Modal.Header>
//             <Modal.Body>Do you agree that today is likely to be a "{nextSplitDay}" day?</Modal.Body>
//             <Modal.Footer>
//               <Button variant="secondary" onClick={handleDenyRecommendation}>
//                 Deny
//               </Button>
//               <Button variant="primary" onClick={handleConfirmRecommendation}>
//                 Confirm
//               </Button>
//             </Modal.Footer>
//           </Modal>
//         </>
//       )}
//       {error && <Alert variant="danger">{error}</Alert>}
//     </div>
//   );
// };

// export default HomePage;


// import React, { useState, useEffect } from 'react';
// import { db, auth } from './firebase';
// import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
// import { Card, Badge, Button, Alert, Row, Col, Modal, Accordion } from 'react-bootstrap';
// import { useNavigate } from 'react-router-dom';
// import { FaTrash } from 'react-icons/fa';
// import { Line, Pie, Bar } from 'react-chartjs-2';
// import 'chart.js/auto';
// import 'chartjs-adapter-date-fns';

// const HomePage = () => {
//   const navigate = useNavigate();
//   const [profile, setProfile] = useState({});
//   const [lastWorkout, setLastWorkout] = useState(null);
//   const [lastNextSplitWorkout, setLastNextSplitWorkout] = useState(null);
//   const [nextSplitDay, setNextSplitDay] = useState('');
//   const [splitDayExercises, setSplitDayExercises] = useState([]);
//   const [workouts, setWorkouts] = useState([]);
//   const [metrics, setMetrics] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   const [workoutToDelete, setWorkoutToDelete] = useState(null);
//   const [confirmModal, setConfirmModal] = useState(false);
//   const [error, setError] = useState(null);
//   const [exerciseNames, setExerciseNames] = useState([]);

//   const splitOptions = {
//     'push-pull-legs': ['Push', 'Pull', 'Legs'],
//     'upper-lower': ['Upper', 'Lower'],
//     'full-body': ['Full Body'],
//     'bro-split': ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs'],
//     'body-part': ['Chest and Triceps', 'Back and Biceps', 'Shoulders and Abs', 'Legs'],
//     'push-pull': ['Push', 'Pull'],
//     'hybrid': ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Chest', 'Back', 'Shoulders', 'Arms', 'Chest and Triceps', 'Back and Biceps', 'Shoulders and Abs', 'Legs'],
//   };

//   useEffect(() => {
//     if (auth.currentUser) {
//       fetchData();
//     }
//   }, [auth.currentUser]);

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       const user = auth.currentUser;
//       if (user) {
//         const [profileSnap, lastWorkoutSnap, workoutsSnap, metricsSnap] = await Promise.all([
//           getDoc(doc(db, 'profiles', user.uid)),
//           getDocs(query(collection(db, 'workouts'), where('uid', '==', user.uid), orderBy('timestamp', 'desc'), limit(1))),
//           getDocs(query(collection(db, 'workouts'), where('uid', '==', user.uid), orderBy('timestamp', 'desc'))),
//           getDocs(query(collection(db, 'profiles', user.uid, 'metrics'), orderBy('timestamp', 'asc')))
//         ]);

//         if (profileSnap.exists()) {
//           setProfile(profileSnap.data());
//         }

//         if (!lastWorkoutSnap.empty) {
//           const workoutData = lastWorkoutSnap.docs[0].data();
//           setLastWorkout(workoutData);
//           setSplitDayExercises(workoutData.exercises || []);
//           determineNextSplitDay(workoutData.splitDay);
//         }

//         const workoutData = workoutsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         setWorkouts(workoutData);

//         if (nextSplitDay) {
//           const nextSplitWorkout = workoutData.find(workout => workout.splitDay === nextSplitDay);
//           if (nextSplitWorkout) {
//             setLastNextSplitWorkout(nextSplitWorkout);
//           }
//         }

//         const metricsData = metricsSnap.docs.map(doc => doc.data());
//         setMetrics(metricsData);

//         const exercises = new Set();
//         workoutData.forEach(workout => {
//           workout.exercises.forEach(exercise => {
//             exercises.add(exercise.exercise);
//           });
//         });
//         setExerciseNames(Array.from(exercises));

//         setLoading(false);
//       }
//     } catch (error) {
//       setError(error.message);
//       setLoading(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (workoutToDelete) {
//       await deleteDoc(doc(db, 'workouts', workoutToDelete));
//       setWorkouts(workouts.filter(workout => workout.id !== workoutToDelete));
//       setShowModal(false);
//     }
//   };

//   const confirmDelete = (workoutId, e) => {
//     e.stopPropagation();
//     setWorkoutToDelete(workoutId);
//     setShowModal(true);
//   };

//   const handleConfirmRecommendation = async () => {
//     await updateProfileRecommendations(nextSplitDay, true);
//     setConfirmModal(false);
//   };

//   const handleDenyRecommendation = async () => {
//     await updateProfileRecommendations(nextSplitDay, false);
//     setConfirmModal(false);
//   };

//   const updateProfileRecommendations = async (day, isConfirmed) => {
//     const user = auth.currentUser;
//     if (user) {
//       const profileRef = doc(db, 'profiles', user.uid);
//       const profileSnap = await getDoc(profileRef);
//       if (profileSnap.exists()) {
//         const data = profileSnap.data();
//         const recommendations = data.recommendations || {};
//         recommendations[day] = isConfirmed;
//         await updateDoc(profileRef, { recommendations });
//       }
//     }
//   };

//   const determineNextSplitDay = (lastSplitDay) => {
//     if (profile.split && splitOptions[profile.split]) {
//       const splitDays = splitOptions[profile.split].filter(day => day !== 'Cardio');
//       const currentIndex = splitDays.indexOf(lastSplitDay);
//       const nextIndex = (currentIndex + 1) % splitDays.length;
//       setNextSplitDay(splitDays[nextIndex]);
//     }
//   };

//   const sortedWorkouts = () => {
//     const sorted = workouts.sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);
//     return sorted;
//   };

//   const generateChartData = (label, dataKey) => {
//     return {
//       labels: metrics.map(metric => new Date(metric.timestamp.seconds * 1000).toLocaleDateString()).sort(),
//       datasets: [
//         {
//           label,
//           data: metrics.map(metric => metric[dataKey]),
//           borderColor: 'rgba(75,192,192,1)',
//           backgroundColor: 'rgba(75,192,192,0.2)',
//         },
//       ],
//     };
//   };

//   const getExercisePerformanceData = (exerciseName) => {
//     const exerciseData = workouts.flatMap(workout => 
//       workout.exercises.filter(exercise => exercise.exercise === exerciseName).map(exercise => ({
//         date: new Date(workout.timestamp.seconds * 1000).toLocaleDateString(),
//         weight: exercise.weight,
//         reps: exercise.reps
//       }))
//     ).sort((a, b) => new Date(a.date) - new Date(b.date));

//     return {
//       labels: exerciseData.map(data => data.date),
//       datasets: [{
//         label: `${exerciseName} Performance`,
//         data: exerciseData.map(data => data.weight),
//         borderColor: 'rgba(153, 102, 255, 1)',
//         backgroundColor: 'rgba(153, 102, 255, 0.2)',
//         fill: false
//       }]
//     };
//   };

//   const getWorkoutQualityData = () => {
//     const qualityCounts = workouts.reduce((acc, workout) => {
//       acc[workout.quality] = (acc[workout.quality] || 0) + 1;
//       return acc;
//     }, {});
//     return {
//       labels: Object.keys(qualityCounts),
//       datasets: [{
//         label: 'Workout Quality Distribution',
//         data: Object.values(qualityCounts),
//         backgroundColor: [
//           'rgba(255, 99, 132, 0.6)',
//           'rgba(54, 162, 235, 0.6)',
//           'rgba(255, 206, 86, 0.6)'
//         ],
//         borderColor: [
//           'rgba(255, 99, 132, 1)',
//           'rgba(54, 162, 235, 1)',
//           'rgba(255, 206, 86, 1)'
//         ],
//         borderWidth: 1
//       }]
//     };
//   };

//   const getSupplementUsageData = () => {
//     const supplements = workouts.flatMap(workout => workout.supplements);
//     const supplementCounts = supplements.reduce((acc, supplement) => {
//       acc[supplement] = (acc[supplement] || 0) + 1;
//       return acc;
//     }, {});
//     return {
//       labels: Object.keys(supplementCounts),
//       datasets: [{
//         label: 'Supplement Usage',
//         data: Object.values(supplementCounts),
//         backgroundColor: 'rgba(255, 159, 64, 0.6)',
//         borderColor: 'rgba(255, 159, 64, 1)',
//         borderWidth: 1
//       }]
//     };
//   };

//   return (
//     <div>
//       <h1>Welcome back, {profile.firstName || 'User'}!</h1>
//       {loading ? (
//         <p>Loading...</p>
//       ) : (
//         <>
//           <Row xs={1} md={2} lg={3} className="g-4" style={{ marginTop: '20px' }}>
//             {exerciseNames.map((exerciseName, index) => (
//               <Col key={index}>
//                 <Accordion>
//                   <Accordion.Item eventKey={index}>
//                     <Accordion.Header>{exerciseName} Performance</Accordion.Header>
//                     <Accordion.Body>
//                       <Line data={getExercisePerformanceData(exerciseName)} />
//                     </Accordion.Body>
//                   </Accordion.Item>
//                 </Accordion>
//               </Col>
//             ))}
//             <Col>
//               <Card>
//                 <Card.Body>
//                   <Card.Title>Workout Quality Distribution</Card.Title>
//                   <Pie data={getWorkoutQualityData()} />
//                 </Card.Body>
//               </Card>
//             </Col>
//             <Col>
//               <Card>
//                 <Card.Body>
//                   <Card.Title>Supplement Usage</Card.Title>
//                   <Bar data={getSupplementUsageData()} />
//                 </Card.Body>
//               </Card>
//             </Col>
//           </Row>
//           {lastWorkout && (
//             <>
//               <h2>Today is likely to be a {nextSplitDay} day</h2>
//               <Button onClick={() => setConfirmModal(true)} style={{ marginBottom: '20px', marginRight: '10px' }}>Confirm</Button>
//               <Button onClick={handleDenyRecommendation} style={{ marginBottom: '20px' }}>Deny</Button>
//               {lastNextSplitWorkout && (
//                 <>
//                   <h3>Last {nextSplitDay} Workout</h3>
//                   <Card>
//                     <Card.Body>
//                       {lastNextSplitWorkout.exercises.map((exercise, index) => (
//                         <Badge key={index} pill bg="info" style={{ marginRight: '5px', marginTop: '10px' }}>
//                           {lastNextSplitWorkout.splitDay === 'Cardio' ? 
//                             `${exercise.exercise} - ${exercise.duration ? `${exercise.duration} minutes` : ''} ${exercise.distance ? `${exercise.distance} miles` : ''}` :
//                             `${exercise.exercise} - ${exercise.weight} lbs - ${exercise.sets} sets - ${exercise.reps.join(', ')} reps`
//                           }
//                         </Badge>
//                       ))}
//                     </Card.Body>
//                   </Card>
//                 </>
//               )}
//               <h3>Last {lastWorkout.splitDay} Workout</h3>
//               <Card>
//                 <Card.Body>
//                   {splitDayExercises.map((exercise, index) => (
//                     <Badge key={index} pill bg="info" style={{ marginRight: '5px', marginTop: '10px' }}>
//                       {lastWorkout.splitDay === 'Cardio' ? 
//                         `${exercise.exercise} - ${exercise.duration ? `${exercise.duration} minutes` : ''} ${exercise.distance ? `${exercise.distance} miles` : ''}` :
//                         `${exercise.exercise} - ${exercise.weight} lbs - ${exercise.sets} sets - ${exercise.reps.join(', ')} reps`
//                       }
//                     </Badge>
//                   ))}
//                 </Card.Body>
//               </Card>
//             </>
//           )}
//           {!lastWorkout && (
//             <p>No workouts logged yet. <Button onClick={() => navigate('/log-workout')}>Log a workout!</Button></p>
//           )}

//           <h2 style={{ marginTop: '40px' }}>Your Workouts</h2>
//           {workouts.length === 0 ? (
//             <Alert variant="info">
//               No workouts logged yet. <Button onClick={() => navigate('/log-workout')}>Log a workout!</Button> Past workouts will be displayed here.
//             </Alert>
//           ) : (
//             <Row xs={1} md={2} lg={3} className="g-4" style={{ marginTop: '20px' }}>
//               {sortedWorkouts().map((workout, index) => (
//                 <Col key={index}>
//                   <Card style={{ position: 'relative' }}>
//                     <Card.Body onClick={() => navigate(`/workout/${workout.id}`)} style={{ cursor: 'pointer' }}>
//                       <Card.Title>
//                         {workout.splitDay} Workout on {new Date(workout.timestamp.seconds * 1000).toLocaleDateString()}
//                       </Card.Title>
//                     </Card.Body>
//                     <FaTrash
//                       onClick={(e) => confirmDelete(workout.id, e)}
//                       style={{
//                         color: 'red',
//                         cursor: 'pointer',
//                         position: 'absolute',
//                         top: '10px',
//                         right: '10px'
//                       }}
//                     />
//                   </Card>
//                 </Col>
//               ))}
//             </Row>
//           )}

//           <Modal show={showModal} onHide={() => setShowModal(false)}>
//             <Modal.Header closeButton>
//               <Modal.Title>Confirm Delete</Modal.Title>
//             </Modal.Header>
//             <Modal.Body>Are you sure you want to delete this workout?</Modal.Body>
//             <Modal.Footer>
//               <Button variant="secondary" onClick={() => setShowModal(false)}>
//                 Cancel
//               </Button>
//               <Button variant="danger" onClick={handleDelete}>
//                 Delete
//               </Button>
//             </Modal.Footer>
//           </Modal>

//           <Modal show={confirmModal} onHide={() => setConfirmModal(false)}>
//             <Modal.Header closeButton>
//               <Modal.Title>Confirm Recommendation</Modal.Title>
//             </Modal.Header>
//             <Modal.Body>Do you agree that today is likely to be a {nextSplitDay} day?</Modal.Body>
//             <Modal.Footer>
//               <Button variant="secondary" onClick={handleDenyRecommendation}>
//                 Deny
//               </Button>
//               <Button variant="primary" onClick={handleConfirmRecommendation}>
//                 Confirm
//               </Button>
//             </Modal.Footer>
//           </Modal>
//         </>
//       )}
//       {error && <Alert variant="danger">{error}</Alert>}
//     </div>
//   );
// };

// export default HomePage;
