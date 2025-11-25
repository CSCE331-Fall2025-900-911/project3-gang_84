import React from 'react';

/**
 * Thank You Screen shows after successful order placement
 */
export default function ThankYouScreen({
  orderNumber,
  customerName,
  onNewOrder,
  highContrast,
  getTranslatedText
}) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${
      highContrast ? 'bg-black' : 'bg-lime-50'
    }`}>
      <div className="text-center px-8 max-w-3xl">
        {/* Success Animation */}
        <div className="mb-8 animate-bounce">
          <span className="text-9xl">✅</span>
        </div>

        {/* Thank You Message */}
        <h1 className={`text-6xl font-bold mb-6 ${
          highContrast ? 'text-yellow-400' : 'text-green-600'
        }`}>
          {getTranslatedText('Thank You')}
          {customerName && `, ${customerName}`}!
        </h1>

        <p className={`text-3xl mb-4 ${
          highContrast ? 'text-white' : 'text-gray-800'
        }`}>
          {getTranslatedText('Your order has been placed successfully!')}
        </p>

        {/* Order Number */}
        <div className={`inline-block px-8 py-4 rounded-xl mb-8 ${
          highContrast 
            ? 'bg-gray-900 border-4 border-yellow-400' 
            : 'bg-white shadow-lg'
        }`}>
          <p className={`text-xl mb-2 ${
            highContrast ? 'text-white' : 'text-gray-600'
          }`}>
            {getTranslatedText('Order Number')}
          </p>
          <p className={`text-5xl font-bold ${
            highContrast ? 'text-yellow-400' : 'text-green-600'
          }`}>
            #{orderNumber}
          </p>
        </div>

        <p className={`text-2xl mb-12 ${
          highContrast ? 'text-white' : 'text-gray-700'
        }`}>
          {getTranslatedText('Please wait for your order to be prepared')}
        </p>

        {/* New Order Button */}
        <button
          onClick={onNewOrder}
          className={`px-12 py-6 rounded-xl font-bold text-2xl shadow-lg transition-all transform hover:scale-105 ${
            highContrast
              ? 'bg-yellow-400 text-black border-4 border-yellow-400 hover:bg-yellow-300'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
          style={{ minHeight: '80px' }}
        >
          {getTranslatedText('Place New Order')} →
        </button>
      </div>
    </div>
  );
}
