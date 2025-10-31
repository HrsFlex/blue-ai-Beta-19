import React from 'react';
import Navbar from '../../components/Navbar/Navbar';
import HealthDashboard from '../../components/HealthDashboard/HealthDashboard';

const Dashboard = () => {
  return (
    <div className="flex">
      <Navbar />
      <div className="flex-1 overflow-y-auto">
        <HealthDashboard />
      </div>
    </div>
  );
};

export default Dashboard;