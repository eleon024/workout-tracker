import React, { useState, useEffect } from 'react';
import { fetchWorkoutData, analyzeData } from './dataAnalysis';

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState({
    bestTime: '',
    bestNutrition: '',
    insights: []
  });

  useEffect(() => {
    const getRecommendations = async () => {
      const workouts = await fetchWorkoutData();
      const analysis = analyzeData(workouts);
      setRecommendations(analysis);
    };
    getRecommendations();
  }, []);

  return (
    <div>
      <h2>Recommendations</h2>
      <p>{recommendations.bestTime}</p>
      <p>{recommendations.bestNutrition}</p>
      <ul>
        {recommendations.insights.map((insight, index) => (
          <li key={index}>{insight}</li>
        ))}
      </ul>
    </div>
  );
};

export default Recommendations;
