import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import { getToken, logout } from './lib/auth';
import { checkHealth, getProtectedData } from './lib/api';

function Dashboard() {
  const [health, setHealth] = useState(null);
  const [protectedData, setProtectedData] = useState(null);

  useEffect(() => {
    checkHealth().then(setHealth).catch(console.error);
    getProtectedData().then(setProtectedData).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dromane.ai Dashboard</h1>
          <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">AI Backend Status</h2>
            <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-auto">
              {JSON.stringify(health, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Protected Data (JWT Verified)</h2>
            <pre className="bg-gray-800 text-blue-400 p-4 rounded overflow-auto">
              {JSON.stringify(protectedData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const isAuthenticated = !!getToken();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
        <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
