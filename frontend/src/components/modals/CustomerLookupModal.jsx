import React, { useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';

/**
 * Customer Lookup Modal
 * Allows cashier to look up customer by phone number for rewards
 */
export default function CustomerLookupModal({
  onContinue,
  onSkip,
  highContrast,
  getTranslatedText
}) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');

  // Format phone number as user types (XXX-XXX-XXXX)
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setError(''); // Clear error when user types
  };

  const handleLookup = async () => {
    // Remove formatting for validation
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    console.log('🔍 Customer Lookup Debug:');
    console.log('  Original phone:', phoneNumber);
    console.log('  Clean phone:', cleanPhone);
    
    if (!cleanPhone) {
      setError('Please enter a phone number');
      return;
    }

    if (cleanPhone.length !== 10) {
      setError('Phone number must be 10 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = `${API_ENDPOINTS.customers}/phone/${cleanPhone}`;
      console.log('  Calling API:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('  Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('  Error response:', errorData);
        
        if (response.status === 404) {
          setError('Customer not found.');
          setShowCreateForm(true); // Show create form when customer not found
        } else {
          setError(`Error: ${errorData.error || 'Failed to lookup customer'}`);
        }
        setLoading(false);
        return;
      }

      const customerData = await response.json();
      console.log('  Customer found:', customerData);
      setCustomer(customerData);
      setError('');
    } catch (err) {
      console.error('❌ Customer lookup error:', err);
      setError('Failed to lookup customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithCustomer = () => {
    onContinue(customer);
  };

  const handleSkipCustomer = () => {
    onSkip();
  };

  const handleCreateCustomer = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    if (!newCustomerName.trim()) {
      setError('Please enter customer name');
      return;
    }

    if (cleanPhone.length !== 10) {
      setError('Phone number must be 10 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(API_ENDPOINTS.customerSignup, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustomerName.trim(),
          phoneNumber: cleanPhone,
          pin: null // No PIN required for cashier-created accounts
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to create customer account');
        setLoading(false);
        return;
      }

      const result = await response.json();
      console.log('✅ Customer created:', result);
      
      // Now look up the newly created customer
      const lookupResponse = await fetch(`${API_ENDPOINTS.customers}/phone/${cleanPhone}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (lookupResponse.ok) {
        const customerData = await lookupResponse.json();
        setCustomer(customerData);
        setShowCreateForm(false);
        setError('');
      }
    } catch (err) {
      console.error('❌ Customer creation error:', err);
      setError('Failed to create customer account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: highContrast ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.5)' }}
    >
      <div 
        className={`rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 ${
          highContrast ? 'bg-gray-900 border-4 border-yellow-400' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className={`text-2xl font-bold mb-1 ${
            highContrast ? 'text-yellow-400' : 'text-gray-800'
          }`}>
            🔍 {getTranslatedText('Customer Lookup')}
          </h2>
          <p className={`text-xs ${
            highContrast ? 'text-white' : 'text-gray-600'
          }`}>
            {getTranslatedText('Enter phone number to apply rewards')}
          </p>
        </div>

        {/* Customer Not Found Yet */}
        {!customer && !showCreateForm && (
          <>
            {/* Phone Number Input */}
            <div className="mb-3">
              <label className={`block text-xs font-semibold mb-1 ${
                highContrast ? 'text-yellow-400' : 'text-gray-700'
              }`}>
                {getTranslatedText('Phone Number')}
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="555-123-4567"
                maxLength="12"
                className={`w-full px-3 py-2 rounded-lg border-2 text-base ${
                  highContrast
                    ? 'bg-gray-800 border-yellow-400 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLookup();
                  }
                }}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className={`mb-3 p-2 rounded-lg ${
                highContrast ? 'bg-red-900 text-yellow-400' : 'bg-red-100 text-red-700'
              }`}>
                <p className="text-xs">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleLookup}
                disabled={loading}
                className={`w-full py-2.5 rounded-lg font-bold text-base transition-colors ${
                  loading
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : highContrast
                      ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? getTranslatedText('Looking up...') : getTranslatedText('Lookup Customer')}
              </button>

              <button
                onClick={handleSkipCustomer}
                disabled={loading}
                className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                  highContrast
                    ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {getTranslatedText('Skip')} - {getTranslatedText('Continue Without Customer')}
              </button>
            </div>
          </>
        )}

        {/* Create Customer Form */}
        {!customer && showCreateForm && (
          <>
            <div className={`mb-3 p-2 rounded-lg ${
              highContrast ? 'bg-gray-800 border-2 border-yellow-400' : 'bg-blue-50 border-2 border-blue-300'
            }`}>
              <p className={`text-xs ${highContrast ? 'text-white' : 'text-blue-700'}`}>
                📝 {getTranslatedText('Customer not found. Create a new account?')}
              </p>
            </div>

            {/* Phone Number (Display Only) */}
            <div className="mb-3">
              <label className={`block text-xs font-semibold mb-1 ${
                highContrast ? 'text-yellow-400' : 'text-gray-700'
              }`}>
                {getTranslatedText('Phone Number')}
              </label>
              <input
                type="tel"
                value={phoneNumber}
                disabled
                className={`w-full px-3 py-2 rounded-lg border-2 text-base ${
                  highContrast
                    ? 'bg-gray-800 border-gray-600 text-gray-400'
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
              />
            </div>

            {/* Customer Name Input */}
            <div className="mb-3">
              <label className={`block text-xs font-semibold mb-1 ${
                highContrast ? 'text-yellow-400' : 'text-gray-700'
              }`}>
                {getTranslatedText('Customer Name')}
              </label>
              <input
                type="text"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className={`w-full px-3 py-2 rounded-lg border-2 text-base ${
                  highContrast
                    ? 'bg-gray-800 border-yellow-400 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateCustomer();
                  }
                }}
                autoFocus
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className={`mb-3 p-2 rounded-lg ${
                highContrast ? 'bg-red-900 text-yellow-400' : 'bg-red-100 text-red-700'
              }`}>
                <p className="text-xs">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleCreateCustomer}
                disabled={loading}
                className={`w-full py-2.5 rounded-lg font-bold text-base transition-colors ${
                  loading
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : highContrast
                      ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                      : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {loading ? getTranslatedText('Creating...') : getTranslatedText('Create Account')}
              </button>

              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewCustomerName('');
                  setError('');
                }}
                disabled={loading}
                className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                  highContrast
                    ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {getTranslatedText('Back to Lookup')}
              </button>

              <button
                onClick={handleSkipCustomer}
                disabled={loading}
                className={`w-full py-2 rounded-lg font-semibold text-xs transition-colors ${
                  highContrast
                    ? 'bg-gray-800 text-yellow-400 border border-yellow-400 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {getTranslatedText('Skip')}
              </button>
            </div>
          </>
        )}

        {/* Customer Found */}
        {customer && (
          <>
            {/* Customer Info Card */}
            <div className={`mb-4 p-3 rounded-lg ${
              highContrast ? 'bg-gray-800 border-2 border-yellow-400' : 'bg-green-50 border-2 border-green-300'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className={`text-lg font-bold ${
                    highContrast ? 'text-yellow-400' : 'text-gray-800'
                  }`}>
                    {customer.name || 'Customer'}
                  </h3>
                  <p className={`text-xs ${
                    highContrast ? 'text-white' : 'text-gray-600'
                  }`}>
                    {customer.phonenumber}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    highContrast ? 'text-white' : 'text-green-600'
                  }`}>
                    {customer.loyaltypoints || 0}
                  </div>
                  <div className={`text-xs ${
                    highContrast ? 'text-yellow-400' : 'text-gray-600'
                  }`}>
                    {getTranslatedText('Points')}
                  </div>
                </div>
              </div>

              {/* Rewards Info */}
              <div className={`text-xs p-2 rounded ${
                highContrast ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'
              }`}>
                <p>
                  💰 {getTranslatedText('100 points')} = {getTranslatedText('Free drink')}
                </p>
                {customer.loyaltypoints >= 100 && (
                  <p className={`mt-1 font-bold ${
                    highContrast ? 'text-yellow-400' : 'text-green-600'
                  }`}>
                    ✅ {getTranslatedText('Customer has enough points for a reward!')}
                  </p>
                )}
              </div>
            </div>

            {/* Continue Button */}
            <div className="space-y-2">
              <button
                onClick={handleContinueWithCustomer}
                className={`w-full py-3 rounded-lg font-bold text-base transition-colors ${
                  highContrast
                    ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {getTranslatedText('Continue to Payment')}
              </button>

              <button
                onClick={() => {
                  setCustomer(null);
                  setPhoneNumber('');
                  setError('');
                }}
                className={`w-full py-2 rounded-lg font-semibold text-xs transition-colors ${
                  highContrast
                    ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {getTranslatedText('Try Different Number')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
