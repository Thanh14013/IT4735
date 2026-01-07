import React, { useState, useEffect } from 'react';
import { Play, Square, Info, Sun, Snowflake, CloudRain, Flame, Wind, Activity } from 'lucide-react';
import { startSimulation, stopSimulation, getSimulationStatus } from '../../api/simulation';
import clsx from 'clsx';

interface ScenarioCardProps {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  activeId: string;
  onSelect: (id: string) => void;
  color: string;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ id, name, description, icon: Icon, activeId, onSelect, color }) => {
  const isActive = activeId === id;
  
  return (
    <button
      onClick={() => onSelect(id)}
      className={clsx(
        "relative p-6 rounded-xl border-2 text-left transition-all duration-200 w-full hover:shadow-md",
        isActive 
          ? `border-${color}-500 bg-${color}-50` 
          : "border-gray-200 bg-white hover:border-gray-300"
      )}
    >
      <div className={clsx("p-3 rounded-full inline-block mb-4", isActive ? `bg-${color}-100` : "bg-gray-100")}>
        <Icon size={24} className={clsx(isActive ? `text-${color}-600` : "text-gray-500")} />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">{name}</h3>
      <p className="text-sm text-gray-500">{description}</p>
      
      {isActive && (
        <div className="absolute top-4 right-4 animate-pulse">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
            Active
          </span>
        </div>
      )}
    </button>
  );
};

const SimulationPage = () => {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const status = await getSimulationStatus();
      if (status.is_active) {
        setActiveScenario(status.current_scenario);
      } else {
        setActiveScenario(null);
      }
    } catch (err) {
      console.error("Failed to fetch simulation status", err);
    }
  };

  const handleStart = async (scenario: string) => {
    try {
      setLoading(true);
      setError(null);
      await startSimulation(scenario);
      setActiveScenario(scenario);
    } catch (err) {
      setError("Failed to start simulation");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      setLoading(true);
      setError(null);
      await stopSimulation();
      setActiveScenario(null);
    } catch (err) {
      setError("Failed to stop simulation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">System Simulation</h1>
        <p className="text-gray-600">
          Override real sensor data with simulated scenarios to test system responses.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2">
          <Info size={18} />
          {error}
        </div>
      )}

      {/* Active Status Banner */}
      <div className={clsx(
        "p-6 rounded-xl border mb-8 flex items-center justify-between",
        activeScenario ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-gray-200"
      )}>
        <div className="flex items-center gap-4">
          <div className={clsx(
            "p-3 rounded-full",
            activeScenario ? "bg-indigo-100 text-indigo-600" : "bg-gray-200 text-gray-500"
          )}>
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {activeScenario ? "Simulation Running" : "System Normal"}
            </h2>
            <p className="text-gray-600">
              {activeScenario 
                ? `Injecting fake data for "${activeScenario}" scenario.` 
                : "Receiving real data from sensors."}
            </p>
          </div>
        </div>
        
        {activeScenario && (
          <button
            onClick={handleStop}
            disabled={loading}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Square size={18} />
            Stop Simulation
          </button>
        )}
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ScenarioCard
          id="normal"
          name="Normal Day"
          description="Standard comfort range. Temp 25-30°C, Good Air Quality."
          icon={Sun}
          color="green"
          activeId={activeScenario || ''}
          onSelect={handleStart}
        />
        
        <ScenarioCard
          id="hot"
          name="Heat Wave"
          description="High Temperature (>35°C). Should trigger Fan."
          icon={Sun}
          color="orange"
          activeId={activeScenario || ''}
          onSelect={handleStart}
        />
        
        <ScenarioCard
          id="cold"
          name="Cold Snap"
          description="Low Temperature (<15°C). Low Humidity."
          icon={Snowflake}
          color="blue"
          activeId={activeScenario || ''}
          onSelect={handleStart}
        />
        
        <ScenarioCard
          id="raining"
          name="Heavy Rain"
          description="High Humidity (>90%). Moderrate Temp."
          icon={CloudRain}
          color="cyan"
          activeId={activeScenario || ''}
          onSelect={handleStart}
        />
        
        <ScenarioCard
          id="polluted"
          name="Pollution Spike"
          description="High PM2.5 (>150). Poor Air Quality."
          icon={Wind}
          color="gray"
          activeId={activeScenario || ''}
          onSelect={handleStart}
        />
        
        <ScenarioCard
          id="fire"
          name="Fire Emergency"
          description="Extreme Heat (>45°C) & Gas/Smoke Detected. Should trigger Alarm."
          icon={Flame}
          color="red"
          activeId={activeScenario || ''}
          onSelect={handleStart}
        />
      </div>
    </div>
  );
};

export default SimulationPage;
