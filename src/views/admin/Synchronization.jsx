import React, { useState, useEffect } from "react";
import { FiSearch, FiSave } from "react-icons/fi";
import { MdDelete, MdAdd } from "react-icons/md";
import { BsToggleOn, BsToggleOff } from "react-icons/bs";
import { FaSpinner } from "react-icons/fa";

const mockData = [
  {
    id: "01",
    name: "CRM 01",
    description: "This is description ...",
    url: "https://url.sample1.com",
    authId: "*********",
    password: "*******",
    enabled: true,
  },
  {
    id: "02",
    name: "CRM 02",
    description: "This is description ...",
    url: "https://url.sample2.com",
    authId: "*********",
    password: "*******",
    enabled: false,
  },
];

const ActionButton = ({ children, onClick, tooltip, color }) => (
  <button
    onClick={onClick}
    className={`relative group mx-1 p-2 rounded-full transition hover:bg-gray-100 focus:outline-none ${color}`}
    tabIndex={0}
  >
    {children}
    {tooltip && (
      <span className="absolute z-10 left-1/2 -translate-x-1/2 -top-8 px-2 py-1 rounded bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition pointer-events-none whitespace-nowrap">
        {tooltip}
      </span>
    )}
  </button>
);

const initialNewEndpoint = {
  id: "",
  name: "",
  description: "",
  url: "",
  authId: "",
  password: "",
  enabled: true,
};

const Synchronization = () => {
  const [data, setData] = useState(mockData);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState(initialNewEndpoint);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleToggle = (idx) => {
    setData((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const handleDelete = (idx) => {
    setData((prev) => prev.filter((_, i) => i !== idx));
  };

  const filteredData = data.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.url.toLowerCase().includes(search.toLowerCase())
  );

  const handleDialogChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewEndpoint((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDialogSave = () => {
    // Validate required fields
    if (!newEndpoint.id || !newEndpoint.name || !newEndpoint.url) {
      setError("ID, CRM Name, and Endpoint URL are required.");
      return;
    }
    setData((prev) => [...prev, newEndpoint]);
    setShowDialog(false);
    setNewEndpoint(initialNewEndpoint);
    setError("");
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen relative">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-8 bg-white/80 rounded-2xl shadow-2xl">
            <FaSpinner className="animate-spin text-4xl text-red-500" />
            <span className="text-lg font-semibold text-gray-700">Loading...</span>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              className="w-full pl-11 pr-16 py-2.5 rounded-full border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 text-gray-700 shadow-sm text-base transition"
              placeholder="Search endpoints"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 select-none">⌘ S</span>
          </div>
          <button
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white font-bold text-base shadow-lg transition-all duration-200 focus:outline-none"
            onClick={() => setShowDialog(true)}
          >
            <MdAdd className="text-2xl" /> Add new endpoint
          </button>
        </div>
        <div className="rounded-2xl shadow-xl border border-gray-100 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">ID</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">CRM Name</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">CRM Description</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Endpoint URL</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Authentication ID</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Password</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredData.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-red-50/60 transition group"
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900">{item.id}</td>
                    <td className="px-4 py-3 text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 text-gray-700">{item.description}</td>
                    <td className="px-4 py-3 text-blue-600 underline break-all max-w-xs">{item.url}</td>
                    <td className="px-4 py-3 text-gray-700">{item.authId}</td>
                    <td className="px-4 py-3 text-gray-700">{item.password}</td>
                    <td className="px-4 py-3 text-center">
                      <ActionButton
                        onClick={() => handleToggle(idx)}
                        tooltip={item.enabled ? "Disable endpoint" : "Enable endpoint"}
                        color=""
                      >
                        {item.enabled ? (
                          <BsToggleOn className="text-2xl text-blue-500 transition" />
                        ) : (
                          <BsToggleOff className="text-2xl text-gray-400 transition" />
                        )}
                      </ActionButton>
                      <ActionButton tooltip="Save changes" color="">
                        <FiSave className="text-2xl text-green-500 transition" />
                      </ActionButton>
                      <ActionButton
                        onClick={() => handleDelete(idx)}
                        tooltip="Delete endpoint"
                        color=""
                      >
                        <MdDelete className="text-2xl text-red-500 transition" />
                      </ActionButton>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400 py-16">
                      <div className="flex flex-col items-center gap-2">
                        <svg width="48" height="48" fill="none" viewBox="0 0 24 24"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Zm-1-5h2v2h-2v-2Zm0-8h2v6h-2V9Z" fill="#e5e7eb"/></svg>
                        <span className="text-lg font-semibold">No endpoints found.</span>
                        <span className="text-sm text-gray-400">Try adjusting your search or add a new endpoint.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dialog for adding new endpoint */}
        {showDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto p-0 animate-fadeIn" onClick={e => e.stopPropagation()}>
              {/* Header with close button */}
              <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50 rounded-t-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <h3 className="text-base font-semibold text-gray-700 flex-1 text-center">Add New Endpoint</h3>
                <button
                  className="text-gray-400 hover:text-red-500 transition duration-200 p-1 rounded-full hover:bg-red-50"
                  onClick={() => { setShowDialog(false); setError(""); }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID <span className="text-red-500">*</span></label>
                    <input name="id" value={newEndpoint.id} onChange={handleDialogChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-200 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CRM Name <span className="text-red-500">*</span></label>
                    <input name="name" value={newEndpoint.name} onChange={handleDialogChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-200 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CRM Description</label>
                    <input name="description" value={newEndpoint.description} onChange={handleDialogChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-200 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL <span className="text-red-500">*</span></label>
                    <input name="url" value={newEndpoint.url} onChange={handleDialogChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-200 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Authentication ID</label>
                    <input name="authId" value={newEndpoint.authId} onChange={handleDialogChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-200 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input name="password" value={newEndpoint.password} onChange={handleDialogChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-200 focus:outline-none" type="password" />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" name="enabled" checked={newEndpoint.enabled} onChange={handleDialogChange} id="enabled" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-200" />
                    <label htmlFor="enabled" className="text-sm text-gray-700">Enable endpoint</label>
                  </div>
                  {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
                  <button
                    className="mt-4 w-full py-2 rounded-lg bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white font-bold text-base shadow-lg transition-all duration-200 focus:outline-none"
                    onClick={handleDialogSave}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Synchronization; 