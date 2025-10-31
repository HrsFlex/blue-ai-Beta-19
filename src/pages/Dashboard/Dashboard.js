import React from 'react';
import Navbar from '../../components/Navbar/Navbar';
import HealthDashboard from '../../components/HealthDashboard/HealthDashboard';
import ScreenshotProcessor from '../../components/ScreenshotProcessor/ScreenshotProcessor';
import WorkflowVisualizer from '../../components/WorkflowVisualizer/WorkflowVisualizer';

const Dashboard = () => {
  return (
    <div className="flex">
      <Navbar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8">
          <HealthDashboard />

          {/* MCP Components Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ScreenshotProcessor />
            <WorkflowVisualizer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;