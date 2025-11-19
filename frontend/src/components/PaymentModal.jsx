import React from 'react';

/**
 * Payment Method Modal
 * Mock payment selection (Card or Cash)
 */
export default function PaymentModal({
  total,
  onPaymentSelect,
  onCancel,
  highContrast,
  getTranslatedText
}) {
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onCancel}
    >
      <div 
        className={`rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-8 ${
          highContrast ? 'bg-gray-900 border-4 border-yellow-400' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className={`text-4xl font-bold mb-3 ${
            highContrast ? 'text-yellow-400' : 'text-gray-800'
          }`}>
            💳 {getTranslatedText('Select Payment Method')}
          </h2>
          <p className={`text-3xl font-bold ${
            highContrast ? 'text-white' : 'text-green-600'
          }`}>
            {getTranslatedText('Total')}: ${total.toFixed(2)}
          </p>
        </div>

        {/* Payment Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Card Payment */}
          <button
            onClick={() => onPaymentSelect('Card')}
            className={`p-8 rounded-xl shadow-lg transition-all transform hover:scale-105 ${
              highContrast
                ? 'bg-gray-800 border-4 border-yellow-400 hover:bg-gray-700'
                : 'bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-300'
            }`}
            style={{ minHeight: '200px' }}
          >
            <div className="flex flex-col items-center">
              <div className="text-7xl mb-4">💳</div>
              <h3 className={`text-2xl font-bold mb-2 ${
                highContrast ? 'text-yellow-400' : 'text-gray-800'
              }`}>
                {getTranslatedText('Card')}
              </h3>
              <p className={`text-sm ${
                highContrast ? 'text-white' : 'text-gray-600'
              }`}>
                {getTranslatedText('Credit or Debit')}
              </p>
            </div>
          </button>

          {/* Cash Payment */}
          <button
            onClick={() => onPaymentSelect('Cash')}
            className={`p-8 rounded-xl shadow-lg transition-all transform hover:scale-105 ${
              highContrast
                ? 'bg-gray-800 border-4 border-yellow-400 hover:bg-gray-700'
                : 'bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-2 border-green-300'
            }`}
            style={{ minHeight: '200px' }}
          >
            <div className="flex flex-col items-center">
              <div className="text-7xl mb-4">💵</div>
              <h3 className={`text-2xl font-bold mb-2 ${
                highContrast ? 'text-yellow-400' : 'text-gray-800'
              }`}>
                {getTranslatedText('Cash')}
              </h3>
              <p className={`text-sm ${
                highContrast ? 'text-white' : 'text-gray-600'
              }`}>
                {getTranslatedText('Pay at counter')}
              </p>
            </div>
          </button>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className={`w-full py-4 rounded-lg font-semibold transition-colors ${
            highContrast
              ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          style={{ minHeight: '60px' }}
        >
          {getTranslatedText('Cancel')}
        </button>
      </div>
    </div>
  );
}
