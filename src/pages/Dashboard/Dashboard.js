import React from 'react';
import Navbar from '../../components/Navbar/Navbar';
import HealthDashboard from '../../components/HealthDashboard/HealthDashboard';
import ScreenshotProcessor from '../../components/ScreenshotProcessor/ScreenshotProcessor';
import WorkflowVisualizer from '../../components/WorkflowVisualizer/WorkflowVisualizer';

const Dashboard = () => {
  return (
    <div className="flex">
      <Navbar />
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-4 lg:p-6 space-y-6">
          {/* Main Health Dashboard */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <HealthDashboard />
          </div>

          {/* MCP Components - More organized layout */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                🤖 AI Health Analysis Tools
              </h2>
              <span className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
                Powered by AI Vision Analysis
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <ScreenshotProcessor />
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <WorkflowVisualizer />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;