import { db, auth } from './firebase';

export const fetchWorkoutData = async () => {
  const user = auth.currentUser;
  if (user) {
    const snapshot = await db.collection('workouts')
                             .where('uid', '==', user.uid)
                             .orderBy('timestamp')
                             .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  return [];
};

export const analyzeData = (workouts) => {
  const recommendations = {
    bestTime: '',
    bestNutrition: '',
    insights: []
  };

  if (workouts.length === 0) return recommendations;

  const timeMap = {};
  const nutritionMap = {};

  workouts.forEach(workout => {
    const time = new Date(workout.timestamp.seconds * 1000).getHours();
    const nutrition = workout.nutrition || 'Unknown';

    timeMap[time] = (timeMap[time] || 0) + 1;
    nutritionMap[nutrition] = (nutritionMap[nutrition] || 0) + 1;
  });

  const bestTime = Object.keys(timeMap).reduce((a, b) => timeMap[a] > timeMap[b] ? a : b);
  const bestNutrition = Object.keys(nutritionMap).reduce((a, b) => nutritionMap[a] > nutritionMap[b] ? a : b);

  recommendations.bestTime = `Best workout time: ${bestTime}:00`;
  recommendations.bestNutrition = `Best pre-workout nutrition: ${bestNutrition}`;
  recommendations.insights.push(`You tend to perform better in the ${bestTime}:00 hour after consuming ${bestNutrition}.`);

  return recommendations;
};
