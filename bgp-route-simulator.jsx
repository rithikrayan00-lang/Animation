import React, { useState } from 'react';
import { Plus, Trash2, Edit2, CheckCircle, AlertCircle, Network, TrendingDown } from 'lucide-react';

export default function BGPRouteSelector() {
  // Initial sample routes
  const initialRoutes = [
    {
      id: 1,
      name: 'Route A',
      localPref: 100,
      asPath: '100 200 500',
      origin: 'IGP',
      med: 50,
      routerId: '1.1.1.1'
    },
    {
      id: 2,
      name: 'Route B',
      localPref: 150,
      asPath: '100 300 400 500',
      origin: 'IGP',
      med: 20,
      routerId: '2.2.2.2'
    },
    {
      id: 3,
      name: 'Route C',
      localPref: 100,
      asPath: '100 200 400 500',
      origin: 'EGP',
      med: 10,
      routerId: '3.3.3.3'
    }
  ];

  const [routes, setRoutes] = useState(initialRoutes);
  const [simulationResult, setSimulationResult] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    localPref: 100,
    asPath: '',
    origin: 'IGP',
    med: 0,
    routerId: ''
  });

  // Helper function to convert router ID to numeric for comparison
  const routerIdToNumber = (id) => {
    try {
      const parts = id.split('.').map(Number);
      if (parts.length !== 4 || parts.some(p => p < 0 || p > 255)) return 0;
      return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
    } catch {
      return 0;
    }
  };

  // Helper function to get origin priority
  const getOriginPriority = (origin) => {
    const priorities = { 'IGP': 0, 'EGP': 1, 'INCOMPLETE': 2 };
    return priorities[origin] || 2;
  };

  // Main BGP selection algorithm
  const runBGPSimulation = () => {
    if (routes.length === 0) {
      alert('Please add at least one route');
      return;
    }

    // Create a copy of routes with additional computed properties
    const routesWithComparison = routes.map(route => ({
      ...route,
      asPathLength: route.asPath.trim().split(/\s+/).filter(s => s).length,
      originPriority: getOriginPriority(route.origin),
      routerIdNumeric: routerIdToNumber(route.routerId)
    }));

    // Sort by BGP decision order
    const sorted = [...routesWithComparison].sort((a, b) => {
      // 1. Highest Local Preference
      if (a.localPref !== b.localPref) {
        return b.localPref - a.localPref;
      }

      // 2. Shortest AS Path
      if (a.asPathLength !== b.asPathLength) {
        return a.asPathLength - b.asPathLength;
      }

      // 3. Lowest Origin Type
      if (a.originPriority !== b.originPriority) {
        return a.originPriority - b.originPriority;
      }

      // 4. Lowest MED
      if (a.med !== b.med) {
        return a.med - b.med;
      }

      // 5. Lowest Router ID
      return a.routerIdNumeric - b.routerIdNumeric;
    });

    const winner = sorted[0];
    const losers = sorted.slice(1);

    // Determine the reason for selection
    let reason = '';
    let criterion = '';

    if (routes.length === 1) {
      reason = 'This is the only available route.';
      criterion = 'Sole Route';
    } else {
      // Check which attribute was the deciding factor
      const allSameLocalPref = routes.every(r => r.localPref === routes[0].localPref);
      if (!allSameLocalPref) {
        reason = `${winner.name} had the highest Local Preference at ${winner.localPref}.`;
        criterion = 'Highest Local Preference';
      } else {
        const allSameAsPath = routes.every(r => r.asPath === routes[0].asPath);
        if (!allSameAsPath) {
          reason = `${winner.name} had the shortest AS Path with only ${winner.asPathLength} hop(s).`;
          criterion = 'Shortest AS Path';
        } else {
          const allSameOrigin = routes.every(r => r.origin === routes[0].origin);
          if (!allSameOrigin) {
            reason = `${winner.name} had the best Origin Type: ${winner.origin}.`;
            criterion = 'Lowest Origin Type';
          } else {
            const allSameMED = routes.every(r => r.med === routes[0].med);
            if (!allSameMED) {
              reason = `${winner.name} had the lowest MED value at ${winner.med}.`;
              criterion = 'Lowest MED';
            } else {
              reason = `${winner.name} was selected as the final tie-breaker with the lowest Router ID: ${winner.routerId}.`;
              criterion = 'Lowest Router ID';
            }
          }
        }
      }
    }

    setSimulationResult({
      winner,
      losers,
      reason,
      criterion
    });
  };

  // Add/Update route
  const handleSaveRoute = () => {
    if (!formData.name.trim() || !formData.asPath.trim() || !formData.routerId.trim()) {
      alert('Please fill in all fields');
      return;
    }

    if (editingId) {
      setRoutes(routes.map(r => r.id === editingId ? { ...formData, id: editingId } : r));
      setEditingId(null);
    } else {
      setRoutes([...routes, { ...formData, id: Date.now() }]);
    }

    setFormData({
      name: '',
      localPref: 100,
      asPath: '',
      origin: 'IGP',
      med: 0,
      routerId: ''
    });
    setShowForm(false);
    setSimulationResult(null);
  };

  // Delete route
  const handleDeleteRoute = (id) => {
    setRoutes(routes.filter(r => r.id !== id));
    setSimulationResult(null);
  };

  // Edit route
  const handleEditRoute = (route) => {
    setFormData(route);
    setEditingId(route.id);
    setShowForm(true);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({
      name: '',
      localPref: 100,
      asPath: '',
      origin: 'IGP',
      med: 0,
      routerId: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-4 md:p-8">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12 relative z-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-xl shadow-lg shadow-blue-500/20">
            <Network className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              BGP Route Selection Simulator
            </h1>
            <p className="text-slate-400 text-sm md:text-base mt-1">
              Simulate Border Gateway Protocol decisions based on routing attributes
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Input Section */}
        <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/20 to-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl shadow-slate-950/50">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="w-1.5 h-8 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></span>
              Route Configuration
            </h2>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/50 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add New Route
              </button>
            )}
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <div className="bg-slate-900/60 backdrop-blur rounded-xl p-6 mb-8 border border-slate-700/50 shadow-inner">
              <h3 className="text-lg font-semibold mb-5 text-slate-100">{editingId ? 'Edit Route' : 'Add New Route'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Route Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Route A"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-100 placeholder-slate-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Local Preference</label>
                  <input
                    type="number"
                    value={formData.localPref}
                    onChange={(e) => setFormData({ ...formData, localPref: parseInt(e.target.value) || 0 })}
                    placeholder="100"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-100 placeholder-slate-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">AS Path (Space-Separated)</label>
                  <input
                    type="text"
                    value={formData.asPath}
                    onChange={(e) => setFormData({ ...formData, asPath: e.target.value })}
                    placeholder="e.g., 100 200 500"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-100 placeholder-slate-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Origin Type</label>
                  <select
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-100 transition-all duration-200"
                  >
                    <option>IGP</option>
                    <option>EGP</option>
                    <option>INCOMPLETE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">MED (Multi-Exit Discriminator)</label>
                  <input
                    type="number"
                    value={formData.med}
                    onChange={(e) => setFormData({ ...formData, med: parseInt(e.target.value) || 0 })}
                    placeholder="50"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-100 placeholder-slate-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Router ID (IP Address)</label>
                  <input
                    type="text"
                    value={formData.routerId}
                    onChange={(e) => setFormData({ ...formData, routerId: e.target.value })}
                    placeholder="e.g., 1.1.1.1"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-100 placeholder-slate-500 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveRoute}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {editingId ? 'Update Route' : 'Add Route'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-all duration-200 border border-slate-600/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Routes Table */}
          {routes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-slate-900/50">
                    <th className="px-4 py-4 text-left font-semibold text-slate-300">Route</th>
                    <th className="px-4 py-4 text-left font-semibold text-slate-300">Local Pref</th>
                    <th className="px-4 py-4 text-left font-semibold text-slate-300">AS Path</th>
                    <th className="px-4 py-4 text-left font-semibold text-slate-300">Origin</th>
                    <th className="px-4 py-4 text-left font-semibold text-slate-300">MED</th>
                    <th className="px-4 py-4 text-left font-semibold text-slate-300">Router ID</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((route) => (
                    <tr key={route.id} className="border-b border-slate-700/30 hover:bg-slate-800/40 transition-colors duration-200">
                      <td className="px-4 py-4 font-semibold text-slate-100 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        {route.name}
                      </td>
                      <td className="px-4 py-4 text-slate-300 font-medium">{route.localPref}</td>
                      <td className="px-4 py-4 text-slate-400 font-mono text-xs bg-slate-900/30 px-3 py-1 rounded w-fit">{route.asPath}</td>
                      <td className="px-4 py-4 text-slate-300">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          route.origin === 'IGP' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                          route.origin === 'EGP' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                          'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {route.origin}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-300 font-medium">{route.med}</td>
                      <td className="px-4 py-4 text-slate-400 font-mono text-sm">{route.routerId}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditRoute(route)}
                            className="p-2 hover:bg-slate-700/50 rounded-lg transition-all duration-200 text-blue-400 hover:text-blue-300 hover:shadow-lg hover:shadow-blue-500/20"
                            title="Edit route"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoute(route.id)}
                            className="p-2 hover:bg-slate-700/50 rounded-lg transition-all duration-200 text-red-400 hover:text-red-300 hover:shadow-lg hover:shadow-red-500/20"
                            title="Delete route"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <Network className="w-16 h-16 text-slate-700 mx-auto mb-4 opacity-50" />
              <p className="text-slate-400 text-lg">No routes yet. Add your first route to begin the simulation.</p>
            </div>
          )}
        </div>

        {/* Simulation Button */}
        {routes.length > 0 && (
          <div className="flex justify-center">
            <button
              onClick={runBGPSimulation}
              className="group relative px-8 md:px-12 py-4 md:py-5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-2xl hover:shadow-emerald-500/50 transform hover:scale-105 border border-emerald-400/30"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6" />
                Run BGP Simulation
              </div>
              <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        )}

        {/* Results Section */}
        {simulationResult && (
          <div className="space-y-6 animate-fadeIn">
            {/* Winner Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950/80 via-teal-900/60 to-emerald-950/80 border border-emerald-600/50 rounded-2xl p-8 shadow-2xl shadow-emerald-500/20">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
              
              <div className="flex items-start gap-4 relative z-10">
                <div className="p-4 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl shadow-lg shadow-emerald-500/30">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-3xl font-bold text-emerald-300">🏆 Winner: {simulationResult.winner.name}</h3>
                  </div>
                  <div className="mb-6">
                    <p className="text-emerald-200 text-lg leading-relaxed bg-emerald-900/30 p-4 rounded-lg border border-emerald-700/50">
                      ✓ {simulationResult.reason}
                    </p>
                    <p className="text-emerald-400 text-sm font-semibold mt-3 uppercase tracking-wide">Decision Criterion: {simulationResult.criterion}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
                    <div className="bg-emerald-900/50 border border-emerald-600/50 rounded-xl p-4 hover:border-emerald-500 transition-all duration-200">
                      <p className="text-emerald-400 text-xs font-bold mb-1 uppercase">Local Pref</p>
                      <p className="text-emerald-100 text-2xl font-bold">{simulationResult.winner.localPref}</p>
                    </div>
                    <div className="bg-emerald-900/50 border border-emerald-600/50 rounded-xl p-4 hover:border-emerald-500 transition-all duration-200">
                      <p className="text-emerald-400 text-xs font-bold mb-1 uppercase">AS Path</p>
                      <p className="text-emerald-100 text-2xl font-bold">{simulationResult.winner.asPath.trim().split(/\s+/).filter(s => s).length}</p>
                      <p className="text-emerald-500 text-xs mt-1">hop(s)</p>
                    </div>
                    <div className="bg-emerald-900/50 border border-emerald-600/50 rounded-xl p-4 hover:border-emerald-500 transition-all duration-200">
                      <p className="text-emerald-400 text-xs font-bold mb-1 uppercase">Origin</p>
                      <p className="text-emerald-100 text-2xl font-bold">{simulationResult.winner.origin}</p>
                    </div>
                    <div className="bg-emerald-900/50 border border-emerald-600/50 rounded-xl p-4 hover:border-emerald-500 transition-all duration-200">
                      <p className="text-emerald-400 text-xs font-bold mb-1 uppercase">MED</p>
                      <p className="text-emerald-100 text-2xl font-bold">{simulationResult.winner.med}</p>
                    </div>
                    <div className="bg-emerald-900/50 border border-emerald-600/50 rounded-xl p-4 hover:border-emerald-500 transition-all duration-200">
                      <p className="text-emerald-400 text-xs font-bold mb-1 uppercase">Router ID</p>
                      <p className="text-emerald-100 text-sm font-bold font-mono">{simulationResult.winner.routerId}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rejected Routes */}
            {simulationResult.losers.length > 0 && (
              <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/20 to-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl shadow-slate-950/50">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-red-400 to-orange-400 rounded-full"></span>
                  Rejected Routes (Not Selected)
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700/50 bg-slate-900/50">
                        <th className="px-4 py-4 text-left font-semibold text-slate-300">Route</th>
                        <th className="px-4 py-4 text-left font-semibold text-slate-300">Local Pref</th>
                        <th className="px-4 py-4 text-left font-semibold text-slate-300">AS Path</th>
                        <th className="px-4 py-4 text-left font-semibold text-slate-300">Origin</th>
                        <th className="px-4 py-4 text-left font-semibold text-slate-300">MED</th>
                        <th className="px-4 py-4 text-left font-semibold text-slate-300">Router ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulationResult.losers.map((route) => (
                        <tr key={route.id} className="border-b border-slate-700/30 hover:bg-slate-800/40 transition-colors duration-200 opacity-75">
                          <td className="px-4 py-4 font-semibold text-slate-400 flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-orange-400" />
                            {route.name}
                          </td>
                          <td className="px-4 py-4 text-slate-400">{route.localPref}</td>
                          <td className="px-4 py-4 text-slate-500 font-mono text-xs bg-slate-900/30 px-3 py-1 rounded w-fit">{route.asPath}</td>
                          <td className="px-4 py-4 text-slate-400">
                            <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                              route.origin === 'IGP' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                              route.origin === 'EGP' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                              'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {route.origin}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-400">{route.med}</td>
                          <td className="px-4 py-4 text-slate-500 font-mono text-sm">{route.routerId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BGP Decision Process Info */}
            <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/20 to-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl shadow-slate-950/50">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full"></span>
                BGP Decision Process (Priority Order)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { step: 1, name: 'Local Preference', desc: 'Highest value wins', icon: '📊' },
                  { step: 2, name: 'AS Path Length', desc: 'Shortest path wins', icon: '🛤️' },
                  { step: 3, name: 'Origin Type', desc: 'IGP > EGP > INCOMPLETE', icon: '🔀' },
                  { step: 4, name: 'Multi-Exit Discriminator', desc: 'Lowest MED wins', icon: '📉' },
                  { step: 5, name: 'Router ID', desc: 'Lowest IP address wins', icon: '🆔' }
                ].map((item) => (
                  <div key={item.step} className="bg-slate-900/40 border border-slate-700/30 rounded-lg p-4 hover:border-slate-600/50 transition-all duration-200">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">
                        {item.step}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">{item.name}</p>
                        <p className="text-slate-400 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
