import React from 'react';

/**
 * Add More Items Modal (Upsell)
 * Shows 3 random drinks not in cart for upselling
 */
export default function AddMoreItemsModal({
  recommendedDrinks,
  onAddDrink,
  onContinue,
  onClose,
  highContrast,
  getTranslatedText
}) {
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className={`rounded-2xl shadow-2xl max-w-5xl w-full mx-4 p-8 max-h-[90vh] overflow-y-auto ${
          highContrast ? 'bg-gray-900 border-4 border-yellow-400' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className={`text-4xl font-bold mb-3 ${
            highContrast ? 'text-yellow-400' : 'text-gray-800'
          }`}>
            🎉 {getTranslatedText('Add More Items?')}
          </h2>
          <p className={`text-xl ${
            highContrast ? 'text-white' : 'text-gray-600'
          }`}>
            {getTranslatedText('Check out these popular drinks!')}
          </p>
        </div>

        {/* Recommended Drinks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {recommendedDrinks.map((drink) => (
            <div
              key={drink.menuitemid}
              className={`flex flex-col items-center p-6 rounded-xl shadow-lg transition-all transform hover:scale-105 ${
                highContrast 
                  ? 'bg-gray-800 border-4 border-yellow-400' 
                  : 'bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200'
              }`}
            >
              <div className={`w-32 h-32 rounded-full mb-4 flex items-center justify-center ${
                highContrast ? 'bg-gray-700' : 'bg-white'
              }`}>
                <span className="text-6xl">🥤</span>
              </div>
              
              <h3 className={`text-xl font-bold text-center mb-2 ${
                highContrast ? 'text-yellow-400' : 'text-gray-800'
              }`}>
                {getTranslatedText(drink.name)}
              </h3>
              
              <p className={`text-2xl font-bold mb-4 ${
                highContrast ? 'text-white' : 'text-green-600'
              }`}>
                ${parseFloat(drink.price).toFixed(2)}
              </p>
              
              <button
                onClick={() => onAddDrink(drink)}
                className={`w-full py-3 rounded-lg font-bold transition-colors ${
                  highContrast
                    ? 'bg-yellow-400 text-black border-2 border-yellow-400 hover:bg-yellow-300'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                style={{ minHeight: '50px' }}
              >
                ➕ {getTranslatedText('Add to Order')}
              </button>
            </div>
          ))}
        </div>

        {/* Continue to Checkout Button */}
        <div className="space-y-4">
          <button
            onClick={onContinue}
            className={`w-full py-6 rounded-xl font-bold text-2xl shadow-lg transition-colors ${
              highContrast
                ? 'bg-yellow-400 text-black border-4 border-yellow-400 hover:bg-yellow-300'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            style={{ minHeight: '80px' }}
          >
            {getTranslatedText('Continue to Checkout')} →
          </button>
          
          <button
            onClick={onClose}
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
    </div>
  );
}
