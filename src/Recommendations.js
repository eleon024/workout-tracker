// src/Recommendations.js
import React, { useState, useEffect } from 'react';
import { fetchWorkoutData, analyzeData } from './dataAnalysis';
import { ListGroup } from 'react-bootstrap';

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
      <ListGroup>
        {recommendations.insights.map((insight, index) => (
          <ListGroup.Item key={index}>{insight}</ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
};

export default Recommendations;
