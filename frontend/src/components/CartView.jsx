import React from 'react';

/**
 * Full-screen Cart View
 * Shows all items in cart before checkout
 */
export default function CartView({ 
  cartItems, 
  total, 
  onCheckout, 
  onBack, 
  highContrast, 
  getTranslatedText 
}) {
  return (
    <div className={`min-h-screen ${highContrast ? 'bg-black' : 'bg-lime-50'}`}>
      {/* Header */}
      <div className={`shadow-md ${highContrast ? 'bg-gray-900 border-b-4 border-yellow-400' : 'bg-white'}`}>
        <div className="px-8 py-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
              highContrast
                ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            style={{ minHeight: '50px' }}
          >
            ← {getTranslatedText('Back to Menu')}
          </button>
          <h1 className={`text-4xl font-bold ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
            🛒 {getTranslatedText('Your Cart')}
          </h1>
          <div style={{ width: '150px' }}></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Cart Items */}
      <div className="max-w-4xl mx-auto p-8">
        {cartItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className={`text-3xl font-bold mb-4 ${highContrast ? 'text-yellow-400' : 'text-gray-800'}`}>
              {getTranslatedText('Your cart is empty')}
            </h2>
            <p className={`text-xl mb-8 ${highContrast ? 'text-white' : 'text-gray-600'}`}>
              {getTranslatedText('Add some drinks to get started!')}
            </p>
            <button
              onClick={onBack}
              className={`px-8 py-4 rounded-lg font-bold text-xl transition-colors ${
                highContrast
                  ? 'bg-yellow-400 text-black border-4 border-yellow-400 hover:bg-yellow-300'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              style={{ minHeight: '60px' }}
            >
              {getTranslatedText('Browse Menu')}
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items List */}
            <div className="space-y-4 mb-8">
              {cartItems.map((item, index) => (
                <div
                  key={`${item.menuitemid}-${index}`}
                  className={`p-6 rounded-xl shadow-lg ${
                    highContrast 
                      ? 'bg-gray-900 border-4 border-yellow-400' 
                      : 'bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className={`text-2xl font-bold mb-2 ${
                        highContrast ? 'text-yellow-400' : 'text-gray-800'
                      }`}>
                        {getTranslatedText(item.name)}
                      </h3>
                      
                      {item.customizations && (
                        <div className={`space-y-1 mb-3 ${
                          highContrast ? 'text-white' : 'text-gray-600'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{getTranslatedText('Sweetness')}:</span>
                            <span>{getTranslatedText(item.customizations.sweetness)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{getTranslatedText('Ice')}:</span>
                            <span>{getTranslatedText(item.customizations.ice)}</span>
                          </div>
                          {item.customizations.toppings.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{getTranslatedText('Toppings')}:</span>
                              <span>{item.customizations.toppings.map(t => getTranslatedText(t)).join(', ')}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className={`text-lg ${
                        highContrast ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {getTranslatedText('Quantity')}: {item.quantity}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-sm ${
                        highContrast ? 'text-white' : 'text-gray-600'
                      }`}>
                        ${parseFloat(item.price).toFixed(2)} {getTranslatedText('each')}
                      </div>
                      <div className={`text-3xl font-bold ${
                        highContrast ? 'text-yellow-400' : 'text-green-600'
                      }`}>
                        ${(item.quantity * parseFloat(item.price)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total and Checkout */}
            <div className={`p-8 rounded-xl shadow-lg ${
              highContrast 
                ? 'bg-gray-900 border-4 border-yellow-400' 
                : 'bg-white'
            }`}>
              <div className="flex justify-between items-center mb-6">
                <span className={`text-3xl font-bold ${
                  highContrast ? 'text-yellow-400' : 'text-gray-800'
                }`}>
                  {getTranslatedText('Total')}:
                </span>
                <span className={`text-5xl font-bold ${
                  highContrast ? 'text-yellow-400' : 'text-green-600'
                }`}>
                  ${total.toFixed(2)}
                </span>
              </div>
              
              <button
                onClick={onCheckout}
                className={`w-full py-6 rounded-lg text-2xl font-bold shadow-lg transition-colors ${
                  highContrast
                    ? 'bg-yellow-400 text-black border-4 border-yellow-400 hover:bg-yellow-300'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                style={{ minHeight: '80px' }}
              >
                {getTranslatedText('Proceed to Checkout')} →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
