import React, { useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';

/**
 * Customer Authentication Modal
 * Handles login, signup, and guest continuation for customer rewards
 */
export default function CustomerAuthModal({ onClose, onAuthenticated, onGuest, currentCustomer }) {
  const [view, setView] = useState('initial'); // 'initial', 'login', 'login-pin', 'signup', 'setpin'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Login form state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [customerNeedsPin, setCustomerNeedsPin] = useState(false); // Track if customer exists but needs PIN
  
  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPin, setSignupPin] = useState('');
  const [signupPinConfirm, setSignupPinConfirm] = useState('');
  
  // Set PIN form state (for accounts created by cashier)
  const [setPinPhone, setSetPinPhone] = useState('');
  const [setPinNew, setSetPinNew] = useState('');
  const [setPinConfirm, setSetPinConfirm] = useState('');

  // Format phone number as user types (XXX-XXX-XXXX)
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  // Step 1: Check if phone number exists and if PIN is required
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanPhone = loginPhone.replace(/\D/g, '');
      
      if (cleanPhone.length !== 10) {
        setError('Please enter a valid 10-digit phone number');
        setLoading(false);
        return;
      }

      // Check if customer exists and has PIN
      const response = await fetch(`${API_ENDPOINTS.customerCheck}/${cleanPhone}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!data.exists) {
        // Account doesn't exist
        setError('Phone number not found. Please sign up or try a different number.');
      } else if (!data.hasPin) {
        // Account exists but needs PIN setup
        setSetPinPhone(cleanPhone);
        setCustomerNeedsPin(true);
        setView('setpin');
        setError('');
      } else {
        // Account exists with PIN, show PIN input
        setView('login-pin');
        setError('');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
      console.error('Phone check error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle login with PIN
  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🔐 Frontend: handlePinSubmit called');
    console.log('  Phone:', loginPhone);
    console.log('  PIN:', loginPin, 'Type:', typeof loginPin);

    try {
      const cleanPhone = loginPhone.replace(/\D/g, '');
      console.log('  Clean phone:', cleanPhone);

      if (loginPin.length !== 4) {
        setError('PIN must be 4 digits');
        setLoading(false);
        return;
      }

      console.log('  Sending request to:', API_ENDPOINTS.customerLogin);
      const response = await fetch(API_ENDPOINTS.customerLogin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: cleanPhone,
          pin: loginPin 
        }),
      });

      console.log('  Response status:', response.status);
      console.log('  Response status:', response.status);

      const data = await response.json();
      console.log('  Response data:', data);

      if (response.ok) {
        console.log('  ✅ Login successful!');
        onAuthenticated(data.customer);
      } else {
        console.log('  ❌ Login failed:', data.error);
        setError(data.error || 'Incorrect PIN. Please try again.');
      }
    } catch (err) {
      console.log('  ❌ Exception:', err);
      setError('Unable to connect to server. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle setting PIN for cashier-created accounts
  const handleSetPin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (setPinNew.length !== 4 || !/^\d{4}$/.test(setPinNew)) {
        setError('PIN must be exactly 4 digits');
        setLoading(false);
        return;
      }

      if (setPinNew !== setPinConfirm) {
        setError('PINs do not match');
        setLoading(false);
        return;
      }

      const response = await fetch(API_ENDPOINTS.customerSetPin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: setPinPhone,
          pin: setPinNew 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // PIN set successfully, log them in
        onAuthenticated(data.customer);
      } else {
        setError(data.error || 'Failed to set PIN. Please try again.');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
      console.error('Set PIN error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!signupName.trim()) {
        setError('Please enter your name');
        setLoading(false);
        return;
      }

      const cleanPhone = signupPhone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        setError('Please enter a valid 10-digit phone number');
        setLoading(false);
        return;
      }

      if (signupPin.length !== 4 || !/^\d{4}$/.test(signupPin)) {
        setError('PIN must be exactly 4 digits');
        setLoading(false);
        return;
      }

      if (signupPin !== signupPinConfirm) {
        setError('PINs do not match');
        setLoading(false);
        return;
      }

      const response = await fetch(API_ENDPOINTS.customerSignup, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: signupName.trim(),
          phoneNumber: cleanPhone,
          pin: signupPin 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onAuthenticated(data.customer);
      } else {
        setError(data.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial view - choose action
  const renderInitialView = () => {
    // If user is already logged in, show different options
    if (currentCustomer) {
      return (
        <div className="text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">👤</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Switch Account</h2>
            <p className="text-gray-600 text-lg mb-2">
              Currently logged in as:
            </p>
            <p className="text-xl font-semibold text-green-600">
              {currentCustomer.name}
            </p>
            <p className="text-sm text-gray-500">
              🎁 {currentCustomer.loyaltyPoints} points
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <button
              onClick={() => setView('login')}
              className="w-full bg-green-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-green-700 transition-colors shadow-md text-lg"
              style={{ minHeight: '60px' }}
            >
              Log In to Different Account
            </button>
            
            <button
              onClick={() => setView('signup')}
              className="w-full bg-white text-green-600 border-2 border-green-600 font-semibold py-4 px-6 rounded-lg hover:bg-green-50 transition-colors shadow-md text-lg"
              style={{ minHeight: '60px' }}
            >
              Create New Account
            </button>
            
            <button
              onClick={onGuest}
              className="w-full bg-red-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-red-700 transition-colors shadow-md text-lg"
              style={{ minHeight: '60px' }}
            >
              Log Out (Continue as Guest)
            </button>
          </div>

          <p className="text-sm text-gray-500">
            Logging out will remove your rewards tracking for this session
          </p>
        </div>
      );
    }

    // If not logged in, show normal options
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎁</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Earn Rewards!</h2>
          <p className="text-gray-600 text-lg">
            Sign up or log in to earn points with every purchase
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <button
            onClick={() => setView('login')}
            className="w-full bg-green-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-green-700 transition-colors shadow-md text-lg"
            style={{ minHeight: '60px' }}
          >
            Log In to Account
          </button>
          
          <button
            onClick={() => setView('signup')}
            className="w-full bg-white text-green-600 border-2 border-green-600 font-semibold py-4 px-6 rounded-lg hover:bg-green-50 transition-colors shadow-md text-lg"
            style={{ minHeight: '60px' }}
          >
            Create New Account
          </button>
          
          <button
            onClick={onGuest}
            className="w-full bg-gray-200 text-gray-700 font-semibold py-4 px-6 rounded-lg hover:bg-gray-300 transition-colors shadow-md text-lg"
            style={{ minHeight: '60px' }}
          >
            Continue as Guest
          </button>
        </div>

        <p className="text-sm text-gray-500">
          You can always sign up later to start earning rewards!
        </p>
      </div>
    );
  };

  // Login view
  // Step 1: Phone number entry
  const renderLoginView = () => (
    <div>
      <button
        onClick={() => {
          setView('initial');
          setError('');
          setLoginPhone('');
        }}
        className="mb-4 text-green-600 hover:text-green-700 font-semibold flex items-center"
      >
        ← Back
      </button>

      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Log In</h2>
        <p className="text-gray-600">Enter your phone number</p>
      </div>

      <form onSubmit={handlePhoneSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-gray-700 font-semibold mb-2 text-lg">
            Phone Number
          </label>
          <input
            type="tel"
            value={loginPhone}
            onChange={(e) => setLoginPhone(formatPhoneNumber(e.target.value))}
            placeholder="XXX-XXX-XXXX"
            className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none text-lg"
            style={{ minHeight: '60px' }}
            maxLength="12"
            required
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-green-700 transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
          style={{ minHeight: '60px' }}
        >
          {loading ? 'Checking...' : 'Continue'}
        </button>

        <p className="text-center text-gray-600">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => {
              setView('signup');
              setError('');
            }}
            className="text-green-600 hover:text-green-700 font-semibold"
          >
            Sign Up
          </button>
        </p>
      </form>
    </div>
  );

  // Step 2: PIN entry (after phone number verified)
  const renderLoginPinView = () => (
    <div>
      <button
        onClick={() => {
          setView('login');
          setError('');
          setLoginPin('');
        }}
        className="mb-4 text-green-600 hover:text-green-700 font-semibold flex items-center"
      >
        ← Back
      </button>

      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Enter PIN</h2>
        <p className="text-gray-600">
          Phone: <span className="font-semibold">{loginPhone}</span>
        </p>
      </div>

      <form onSubmit={handlePinSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-gray-700 font-semibold mb-2 text-lg">
            4-Digit PIN
          </label>
          <input
            type="password"
            inputMode="numeric"
            value={loginPin}
            onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none text-lg text-center tracking-widest"
            style={{ minHeight: '60px' }}
            maxLength="4"
            required
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-green-700 transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
          style={{ minHeight: '60px' }}
        >
          {loading ? 'Logging In...' : 'Log In'}
        </button>
      </form>
    </div>
  );

  // Signup view
  const renderSignupView = () => (
    <div>
      <button
        onClick={() => {
          setView('initial');
          setError('');
        }}
        className="mb-4 text-green-600 hover:text-green-700 font-semibold flex items-center"
      >
        ← Back
      </button>

      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h2>
        <p className="text-gray-600">Join our rewards program!</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-gray-700 font-semibold mb-2 text-lg">
            Full Name
          </label>
          <input
            type="text"
            value={signupName}
            onChange={(e) => setSignupName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none text-lg"
            style={{ minHeight: '60px' }}
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2 text-lg">
            Phone Number
          </label>
          <input
            type="tel"
            value={signupPhone}
            onChange={(e) => setSignupPhone(formatPhoneNumber(e.target.value))}
            placeholder="XXX-XXX-XXXX"
            className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none text-lg"
            style={{ minHeight: '60px' }}
            maxLength="12"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2 text-lg">
            Create 4-Digit PIN
          </label>
          <input
            type="password"
            inputMode="numeric"
            value={signupPin}
            onChange={(e) => setSignupPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none text-lg text-center tracking-widest"
            style={{ minHeight: '60px' }}
            maxLength="4"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2 text-lg">
            Confirm PIN
          </label>
          <input
            type="password"
            inputMode="numeric"
            value={signupPinConfirm}
            onChange={(e) => setSignupPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none text-lg text-center tracking-widest"
            style={{ minHeight: '60px' }}
            maxLength="4"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-green-700 transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
          style={{ minHeight: '60px' }}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <p className="text-center text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => {
              setView('login');
              setError('');
            }}
            className="text-green-600 hover:text-green-700 font-semibold"
          >
            Log In
          </button>
        </p>
      </form>
    </div>
  );

  // Set PIN view (for accounts created by cashier)
  const renderSetPinView = () => (
    <div>
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🔐</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Set Up Your PIN</h2>
        <p className="text-gray-600">
          Your account was created by a cashier. Please set up a 4-digit PIN to secure your account.
        </p>
      </div>

      <form onSubmit={handleSetPin} className="space-y-4">
        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-gray-700 font-semibold mb-2 text-lg">
            Create 4-Digit PIN
          </label>
          <input
            type="password"
            inputMode="numeric"
            value={setPinNew}
            onChange={(e) => setSetPinNew(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none text-lg text-center tracking-widest"
            style={{ minHeight: '60px' }}
            maxLength="4"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2 text-lg">
            Confirm PIN
          </label>
          <input
            type="password"
            inputMode="numeric"
            value={setPinConfirm}
            onChange={(e) => setSetPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none text-lg text-center tracking-widest"
            style={{ minHeight: '60px' }}
            maxLength="4"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 px-6 rounded-lg font-bold text-lg shadow-lg transition-colors ${
            loading
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
          style={{ minHeight: '60px' }}
        >
          {loading ? 'Setting PIN...' : 'Set PIN & Continue'}
        </button>
      </form>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="float-right text-gray-400 hover:text-gray-600 text-2xl font-bold"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          ✕
        </button>
        <div className="clear-both"></div>

        {view === 'initial' && renderInitialView()}
        {view === 'login' && renderLoginView()}
        {view === 'login-pin' && renderLoginPinView()}
        {view === 'signup' && renderSignupView()}
        {view === 'setpin' && renderSetPinView()}
      </div>
    </div>
  );
}
