// src/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from './firebase';

const PrivateRoute = ({ children }) => {
  return auth.currentUser ? children : <Navigate to="/sign-in" />;
};

export default PrivateRoute;
