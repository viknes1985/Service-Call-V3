import React, { useState, useEffect } from 'react';
import { Search, Plus, User, LogIn, LogOut, ChevronRight, MapPin, Clock, Phone, Camera, X, Filter, ChevronLeft, Trash2, Wrench, PhoneCall, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BottomNav from './components/BottomNav';
import { Category, Service, UserProfile } from './types';
import { CATEGORIES, STATES, MALAYSIA_STATES } from './constants';

export default function App() {
  const [activeTab, setActiveTab] = useState<'find' | 'home' | 'profile'>('home');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [topCategories, setTopCategories] = useState<{ category: string; count: number; thumbnails: string[] }[]>([]);
  const [userServices, setUserServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Find Tab Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterTown, setFilterTown] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    fetchServices();
    fetchTopCategories();
    // Check local storage for user session
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (user && activeTab === 'profile') {
      fetchUserServices();
    }
  }, [user, activeTab]);

  const fetchServices = async (filters: any = {}) => {
    setIsLoading(true);
    const params = new URLSearchParams(filters);
    const res = await fetch(`/api/services?${params.toString()}`);
    const data = await res.json();
    setServices(data);
    setIsLoading(false);
  };

  const fetchUserServices = async () => {
    if (!user) return;
    const res = await fetch(`/api/services?createdBy=${user.id}`);
    const data = await res.json();
    setUserServices(data);
  };

 const fetchTopCategories = async () => {
  try {
    const response = await fetch('/api/top-categories');
    const data = await response.json();
    if (Array.isArray(data)) {
      setTopCategories(data);
    }
  } catch (error) {
    console.error("Error fetching top categories:", error);
  }
};

  const handleSearch = () => {
    const filters = {
      state: filterState,
      town: filterTown,
      category: filterCategory,
      search: searchQuery,
      currentUserId: user?.id
    };
    fetchServices(filters);
  };

  const handleSaveRating = async (serviceId: string, rating: number) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/services/${serviceId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, rating })
      });
      if (res.ok) {
        fetchServices({
          state: filterState,
          town: filterTown,
          category: filterCategory,
          search: searchQuery,
          currentUserId: user.id
        });
        fetchTopCategories();
      }
    } catch (err) {
      console.error('Rating error:', err);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setActiveTab('home');
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete || !user) return;
    
    try {
      const res = await fetch(`/api/services/${serviceToDelete.id}?userId=${user.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setServiceToDelete(null);
        fetchServices();
        fetchTopCategories();
        if (activeTab === 'profile') fetchUserServices();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete service');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete service');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 sticky top-0 z-40 shadow-md flex items-center justify-center relative">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded-xl shadow-sm">
            <img src="https://img.icons8.com/color/96/000000/service.png" className="w-8 h-8" alt="Icon" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Service Call</h1>
        </div>
        {user && (
          <button 
            onClick={handleLogout}
            className="absolute right-4 p-2 hover:bg-blue-700 rounded-full transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        )}
      </header>

      <main className="p-4 max-w-md mx-auto">
        {user && (
          <div className="mb-4 animate-in fade-in slide-in-from-left-4 duration-500">
            <h2 className="text-lg font-bold text-gray-800">Hi {user.firstName}</h2>
          </div>
        )}
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center w-full">
                <p className="text-xs sm:text-sm font-medium text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">
                  Your Local Services, One Simple Search
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setIsNewServiceOpen(true)}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex flex-col items-center gap-3 hover:bg-blue-50 transition-colors"
                >
                  <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                    <Plus size={28} />
                  </div>
                  <span className="font-semibold text-gray-800">New Service</span>
                </button>
                <button
                  onClick={() => setActiveTab('find')}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex flex-col items-center gap-3 hover:bg-blue-50 transition-colors"
                >
                  <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                    <Search size={28} />
                  </div>
                  <span className="font-semibold text-gray-800">Find Service</span>
                </button>
              </div>

              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Top Categories</h2>
                <div className="grid grid-cols-2 gap-4">
                  {topCategories.length > 0 ? (
                    topCategories.map((cat, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setFilterCategory(cat.category);
                          setActiveTab('find');
                          fetchServices({ category: cat.category });
                        }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
                      >
                        <div className="aspect-square grid grid-cols-2 gap-0.5 bg-gray-100 p-0.5">
                          {[0, 1, 2, 3].map(i => (
                            <div key={i} className="bg-white overflow-hidden">
                              {cat.thumbnails && cat.thumbnails[i] ? (
                                <img src={cat.thumbnails[i]} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-200">
                                  <Camera size={12} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="p-3 flex justify-between items-center">
                          <div className="flex flex-col overflow-hidden">
                            <span className="font-bold text-sm text-gray-800 truncate">{cat.category}</span>
                            <span className="text-[10px] text-gray-400">{cat.count} services</span>
                          </div>
                          <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8 text-gray-400 italic">No services added yet</div>
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'find' && (
            <motion.div
              key="find"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="text-center w-full">
                <p className="text-xs sm:text-sm font-medium text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">
                  Need a Service? Find It Here Fast
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm space-y-3 border border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search services..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="bg-gray-50 p-2 rounded-lg text-sm outline-none border-none focus:ring-1 focus:ring-blue-500"
                    value={filterState}
                    onChange={(e) => {
                      setFilterState(e.target.value);
                      setFilterTown('');
                    }}
                  >
                    <option value="">All States</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select
                    className="bg-gray-50 p-2 rounded-lg text-sm outline-none border-none focus:ring-1 focus:ring-blue-500"
                    value={filterTown}
                    onChange={(e) => setFilterTown(e.target.value)}
                    disabled={!filterState}
                  >
                    <option value="">All Towns</option>
                    {filterState && MALAYSIA_STATES[filterState].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                
                <select
                  className="w-full bg-gray-50 p-2 rounded-lg text-sm outline-none border-none focus:ring-1 focus:ring-blue-500"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <button
                  onClick={handleSearch}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                >
                  Find
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {isLoading ? (
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className="bg-gray-200 animate-pulse h-32 rounded-xl"></div>
                  ))
                ) : services.length > 0 ? (
                  services.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      {service.ratingCount > 0 && (
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-lg shadow-sm flex items-center gap-1 z-10 border border-gray-100">
                          <Star size={10} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-[10px] font-bold text-gray-700">{(service.avgRating || 0).toFixed(1)}</span>
                          <span className="text-[8px] text-gray-400">({service.ratingCount})</span>
                        </div>
                      )}
                      <div className="h-20 bg-gray-100 rounded-lg overflow-hidden">
                        {service.photoUrls && service.photoUrls.length > 0 ? (
                          <img src={service.photoUrls[0]} alt={service.providerName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Camera size={24} />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{service.category}</span>
                        <h3 className="text-sm font-bold text-gray-900 truncate">{service.providerName}</h3>
                        <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                          <Clock size={10} />
                          <span>{service.operatingHours}</span>
                        </div>
                        {service.creatorName && (
                          <div className="flex items-center gap-1 text-gray-400 text-[10px] mt-1">
                            <User size={10} />
                            <span className="truncate">By {service.creatorName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-12 text-gray-400">
                    No services found matching your criteria.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {user ? (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm text-center space-y-4">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto">
                      <User size={40} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{user.firstName} {user.lastName}</h2>
                      <p className="text-gray-500">{user.email}</p>
                      <p className="text-gray-500">{user.mobileNumber}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 text-red-500 font-semibold py-2"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </div>

                  <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">My Services</h3>
                    <div className="space-y-3">
                      {userServices.length > 0 ? (
                        userServices.map(service => (
                          <div key={service.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                                {service.photoUrls && service.photoUrls.length > 0 ? (
                                  <img src={service.photoUrls[0]} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <Camera size={20} />
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 text-sm">{service.providerName}</h4>
                                <p className="text-xs text-blue-600 font-medium">{service.category}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setServiceToEdit(service);
                                  setIsNewServiceOpen(true);
                                }}
                                className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setServiceToDelete(service)}
                                className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                          You haven't added any services yet.
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              ) : (
                <AuthScreen onLogin={(u) => {
                  setUser(u);
                  localStorage.setItem('user', JSON.stringify(u));
                }} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* New Service Modal */}
      <AnimatePresence>
        {isNewServiceOpen && (
          <NewServiceModal
            user={user}
            serviceToEdit={serviceToEdit}
            onClose={() => {
              setIsNewServiceOpen(false);
              setServiceToEdit(null);
            }}
            onSuccess={() => {
              setIsNewServiceOpen(false);
              setServiceToEdit(null);
              fetchServices();
              fetchTopCategories();
              if (activeTab === 'profile') fetchUserServices();
            }}
          />
        )}
      </AnimatePresence>

      {/* Service Detail Modal */}
      <AnimatePresence>
        {selectedService && (
          <ServiceDetailModal
            service={selectedService}
            user={user}
            onClose={() => setSelectedService(null)}
            onRate={(rating) => handleSaveRating(selectedService.id, rating)}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {serviceToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm text-center space-y-4 shadow-2xl">
              <div className="bg-red-100 p-3 rounded-full text-red-600 w-fit mx-auto">
                <Trash2 size={24} />
              </div>
              <h2 className="text-lg font-bold">Delete Service?</h2>
              <p className="text-gray-500 text-sm">Are you sure you want to remove "{serviceToDelete.providerName}"? This action cannot be undone.</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setServiceToDelete(null)}
                  className="w-full bg-gray-100 text-gray-600 py-2 rounded-xl font-bold"
                >
                  No, Cancel
                </button>
                <button
                  onClick={handleDeleteService}
                  className="w-full bg-red-600 text-white py-2 rounded-xl font-bold"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AuthScreen({ onLogin }: { onLogin: (user: UserProfile) => void }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'verify' | 'reset'>('login');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    code: '',
    newPassword: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (mode === 'login' || mode === 'signup') {
      if (mode === 'signup' && formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data);
      } else {
        console.error('Auth error:', data);
        setError(data.error || 'Something went wrong');
      }
    } else if (mode === 'forgot') {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setMode('verify');
      } else {
        setError(data.error || 'Failed to send reset code');
      }
    } else if (mode === 'verify') {
      const res = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: formData.code })
      });
      const data = await res.json();
      if (res.ok) {
        setMode('reset');
      } else {
        setError(data.error || 'Invalid code');
      }
    } else if (mode === 'reset') {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          code: formData.code, 
          newPassword: formData.newPassword 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Password reset successful! Please login.');
        setMode('login');
      } else {
        setError(data.error || 'Failed to reset password');
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">
      {(mode === 'login' || mode === 'signup') && (
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${mode === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
          >
            Login
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${mode === 'signup' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
          >
            Sign Up
          </button>
        </div>
      )}

      {mode === 'forgot' && <h2 className="text-lg font-bold text-center">Forgot Password</h2>}
      {mode === 'verify' && <h2 className="text-lg font-bold text-center">Verify Code</h2>}
      {mode === 'reset' && <h2 className="text-lg font-bold text-center">Reset Password</h2>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="First Name"
              required
              className="w-full bg-gray-50 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            <input
              type="text"
              placeholder="Last Name"
              required
              className="w-full bg-gray-50 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>
        )}

        {(mode === 'login' || mode === 'signup' || mode === 'forgot' || mode === 'verify' || mode === 'reset') && (
          <input
            type="email"
            placeholder="Email Address"
            required
            disabled={mode === 'verify' || mode === 'reset'}
            className="w-full bg-gray-50 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        )}

        {mode === 'signup' && (
          <input
            type="tel"
            placeholder="Mobile Number"
            required
            className="w-full bg-gray-50 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500"
            value={formData.mobileNumber}
            onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
          />
        )}

        {(mode === 'login' || mode === 'signup') && (
          <input
            type="password"
            placeholder="Password"
            required
            className="w-full bg-gray-50 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        )}

        {mode === 'signup' && (
          <input
            type="password"
            placeholder="Confirm Password"
            required
            className="w-full bg-gray-50 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          />
        )}

        {(mode === 'verify' || mode === 'reset') && (
          <input
            type="text"
            placeholder="6-Digit Code"
            required
            maxLength={6}
            disabled={mode === 'reset'}
            className="w-full bg-gray-50 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500 text-center font-mono tracking-widest disabled:opacity-50"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          />
        )}

        {mode === 'reset' && (
          <input
            type="password"
            placeholder="New Password"
            required
            className="w-full bg-gray-50 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500"
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
          />
        )}

        {error && <p className="text-red-500 text-xs text-center">{error}</p>}
        {message && <p className="text-blue-600 text-xs text-center">{message}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform"
        >
          {mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign Up' : mode === 'forgot' ? 'Send Code' : mode === 'verify' ? 'Verify Code' : 'Reset Password'}
        </button>

        {mode === 'login' && (
          <button
            type="button"
            onClick={() => setMode('forgot')}
            className="w-full text-center text-xs text-blue-600 font-medium hover:underline"
          >
            Forgot Password?
          </button>
        )}

        {(mode === 'forgot' || mode === 'verify' || mode === 'reset') && (
          <button
            type="button"
            onClick={() => setMode('login')}
            className="w-full text-center text-xs text-gray-400 font-medium hover:underline"
          >
            Back to Login
          </button>
        )}
      </form>
    </div>
  );
}

const TIMES = [
  "12:00 AM", "12:30 AM", "1:00 AM", "1:30 AM", "2:00 AM", "2:30 AM", "3:00 AM", "3:30 AM",
  "4:00 AM", "4:30 AM", "5:00 AM", "5:30 AM", "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM",
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM",
  "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"
];

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const compressImage = (base64Str: string, targetSize = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > targetSize) {
          height *= targetSize / width;
          width = targetSize;
        }
      } else {
        if (height > targetSize) {
          width *= targetSize / height;
          height = targetSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
};

function NewServiceModal({ user, serviceToEdit, onClose, onSuccess }: { user: UserProfile | null, serviceToEdit?: Service | null, onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    state: serviceToEdit?.state || '',
    town: serviceToEdit?.town || '',
    category: serviceToEdit?.category || '',
    providerName: serviceToEdit?.providerName || '',
    description: serviceToEdit?.description || '',
    contactNumber: serviceToEdit?.contactNumber || '',
  });
  
  const [photoUrls, setPhotoUrls] = useState<string[]>(serviceToEdit?.photoUrls || []);
  const [timeFrom, setTimeFrom] = useState('9:00 AM');
  const [timeTo, setTimeTo] = useState('6:00 PM');
  const [selectedDays, setSelectedDays] = useState<string[]>(['MON', 'TUE', 'WED', 'THU', 'FRI']);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (serviceToEdit?.operatingHours) {
      const match = serviceToEdit.operatingHours.match(/(.*) - (.*) \((.*)\)/);
      if (match) {
        setTimeFrom(match[1]);
        setTimeTo(match[2]);
        setSelectedDays(match[3].split(', '));
      }
    }
  }, [serviceToEdit]);

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <div className="bg-white p-6 rounded-2xl w-full max-w-sm text-center space-y-4">
          <div className="bg-amber-100 p-3 rounded-full text-amber-600 w-fit mx-auto">
            <LogIn size={24} />
          </div>
          <h2 className="text-lg font-bold">Login Required</h2>
          <p className="text-gray-500 text-sm">Please login to your account to register a new service.</p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 rounded-xl font-bold"
          >
            Got it
          </button>
        </div>
      </motion.div>
    );
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (photoUrls.length + files.length > 4) {
      setError('You can only upload up to 4 photos');
      return;
    }

    setIsCompressing(true);
    setError('');
    
    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      // Compress if needed (or always compress to ensure < 500KB)
      const compressed = await compressImage(base64);
      newUrls.push(compressed);
    }

    setPhotoUrls(prev => [...prev, ...newUrls]);
    setIsCompressing(false);
  };

  const removePhoto = (index: number) => {
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const isEveryday = selectedDays.length === 7;
  const toggleEveryday = () => {
    if (isEveryday) {
      setSelectedDays([]);
    } else {
      setSelectedDays(DAYS);
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (selectedDays.length === 0) {
    setError('Please select at least one day');
    return;
  }

  setIsUploading(true);
  setError('');

  const operatingHours = `${timeFrom} - ${timeTo} (${selectedDays.join(', ')})`;
  const method = serviceToEdit ? 'PUT' : 'POST';
  const url = serviceToEdit ? `/api/services/${serviceToEdit.id}` : '/api/services';
  
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      // The photoUrls being sent here are the Base64 strings from compressImage
      body: JSON.stringify({ ...formData, operatingHours, photoUrls, createdBy: user.id })
    });
    
    const data = await res.json(); // Capture the response data

    if (res.ok) {
      setIsUploading(false);
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } else {
      setIsUploading(false);
      // If the ImgBB upload failed on the server, it will return the error here
      setError(data.error || 'Failed to save service');
    }
  } catch (err) {
    setIsUploading(false);
    setError('Network error: Could not reach server');
  }
};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">{serviceToEdit ? 'Edit Service' : 'Register New Service'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">State</label>
              <select
                required
                className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value, town: '' })}
              >
                <option value="">Select State</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Town</label>
              <select
                required
                className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.town}
                onChange={e => setFormData({ ...formData, town: e.target.value })}
                disabled={!formData.state}
              >
                <option value="">Select Town</option>
                {formData.state && MALAYSIA_STATES[formData.state].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">Category</label>
            <select
              required
              className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">Select Category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">Provider Name</label>
            <input
              type="text"
              required
              placeholder="Company or Personal Name"
              className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.providerName}
              onChange={e => setFormData({ ...formData, providerName: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">Description</label>
            <textarea
              required
              maxLength={500}
              placeholder="Describe your services (max 500 characters)"
              className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 min-h-[100px] resize-none"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
            <div className="text-[10px] text-right text-gray-400">
              {formData.description.length}/500
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">Contact Number</label>
            <input
              type="tel"
              required
              placeholder="012-3456789"
              className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.contactNumber}
              onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">Operating Hours</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400">From</span>
                <select
                  className="w-full p-2 bg-gray-50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  value={timeFrom}
                  onChange={e => setTimeFrom(e.target.value)}
                >
                  {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400">To</span>
                <select
                  className="w-full p-2 bg-gray-50 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  value={timeTo}
                  onChange={e => setTimeTo(e.target.value)}
                >
                  {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Days Available</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEveryday}
                    onChange={toggleEveryday}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-xs font-medium text-gray-600">Everyday</span>
                </label>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {DAYS.map(day => (
                  <label
                    key={day}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
                      selectedDays.includes(day)
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(day)}
                      onChange={() => toggleDay(day)}
                      className="w-3 h-3 accent-blue-600"
                    />
                    <span className="text-[10px] font-bold">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">Photos (Max 4)</label>
            <div className="grid grid-cols-4 gap-2">
              {photoUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group">
                  <img src={url} className="w-full h-full object-cover" alt="" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {photoUrls.length < 4 && (
                <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors">
                  <Plus size={20} />
                  <span className="text-[8px] font-bold uppercase mt-1">Add</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isCompressing}
                  />
                </label>
              )}
            </div>
            {isCompressing && <p className="text-[10px] text-blue-600 animate-pulse">Compressing photos...</p>}
          </div>

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          {showSuccess && <p className="text-blue-600 text-xs text-center font-bold">Service successfully added to the system</p>}

          <button
            type="submit"
            disabled={isUploading || showSuccess}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 mt-4 disabled:opacity-50"
          >
            {isUploading ? 'Uploading to server...' : 'Save Service'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function ServiceDetailModal({ service, user, onClose, onRate }: { service: Service, user: UserProfile | null, onClose: () => void, onRate: (rating: number) => Promise<void> | void }) {
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [rating, setRating] = useState(service.userRating || 0);
  const [hasChanged, setHasChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const photos = service.photoUrls && service.photoUrls.length > 0 ? service.photoUrls : [];

  const handleClose = () => {
    if (hasChanged) {
      if (window.confirm("Do you want to save your rating before closing?")) {
        onRate(rating);
      }
    }
    onClose();
  };

  const handleRate = (val: number) => {
    setRating(val);
    setHasChanged(true);
    setShowSuccess(false);
  };

  const handleSaveRating = async () => {
    setIsSaving(true);
    await onRate(rating);
    setIsSaving(false);
    setHasChanged(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const nextPhoto = () => {
    if (photos.length > 1) {
      setCurrentPhotoIdx((prev) => (prev + 1) % photos.length);
    }
  };

  const prevPhoto = () => {
    if (photos.length > 1) {
      setCurrentPhotoIdx((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="relative h-64 bg-gray-100 group flex-shrink-0">
          {photos.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.img
                key={currentPhotoIdx}
                src={photos[currentPhotoIdx]}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full object-cover"
                alt=""
              />
            </AnimatePresence>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Camera size={48} />
            </div>
          )}

          {photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/50 hover:bg-white/80 rounded-full text-gray-800 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/50 hover:bg-white/80 rounded-full text-gray-800 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPhotoIdx(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      idx === currentPhotoIdx ? 'bg-blue-600 w-4' : 'bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-full text-gray-800 shadow-sm"
          >
            <X size={20} />
          </button>
          <div className="absolute bottom-4 left-4">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
              {service.category}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{service.providerName}</h2>
              <div className="flex items-center gap-1 text-gray-400 mt-1">
                <MapPin size={14} />
                <span className="text-sm">{service.town}, {service.state}</span>
              </div>
            </div>
            {service.ratingCount > 0 && (
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <Star size={16} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-lg font-bold">{(service.avgRating || 0).toFixed(1)}</span>
                </div>
                <span className="text-[10px] text-gray-400">{service.ratingCount} ratings</span>
              </div>
            )}
          </div>

          {user && (
            <div className="bg-blue-50 p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider">Rate this service</h3>
                {hasChanged && (
                  <button 
                    onClick={handleSaveRating}
                    disabled={isSaving}
                    className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded-full font-bold disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Now'}
                  </button>
                )}
              </div>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleRate(val)}
                    className="transition-transform active:scale-90"
                  >
                    <Star 
                      size={32} 
                      className={`${val <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                    />
                  </button>
                ))}
              </div>
              {showSuccess && (
                <p className="text-xs text-blue-600 font-bold text-center mt-2">
                  Rating successfully captured. Thanks.
                </p>
              )}
            </div>
          )}

          {service.description && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {service.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
              <div className="flex items-center gap-2 text-blue-600">
                <Clock size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Hours</span>
              </div>
              <p className="text-sm font-medium text-gray-700">{service.operatingHours}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
              <div className="flex items-center gap-2 text-blue-600">
                <Phone size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Contact</span>
              </div>
              <p className="text-sm font-medium text-gray-700">{service.contactNumber}</p>
            </div>
          </div>

          <a
            href={`tel:${service.contactNumber}`}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-transform"
          >
            <Phone size={20} />
            Call Provider
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
