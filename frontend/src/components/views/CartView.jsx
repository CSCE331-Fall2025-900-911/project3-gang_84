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
  getTranslatedText,
  customer,
  selectedRewards,
  onRewardToggle
}) {
  // Define available rewards
  const rewards = [
    {
      id: 'free_drink',
      name: 'Free Drink',
      description: 'Get any drink for free',
      pointsCost: 100,
      icon: '🥤',
      discount: (items) => {
        // Find most expensive drink
        const mostExpensive = items.reduce((max, item) => 
          parseFloat(item.price) > parseFloat(max.price) ? item : max
        , items[0]);
        return mostExpensive ? parseFloat(mostExpensive.price) : 0;
      }
    },
    {
      id: 'free_topping',
      name: 'Free Topping',
      description: 'Add a free topping to any drink',
      pointsCost: 50,
      icon: '🧋',
      discount: 0.75 // Fixed discount for topping value
    },
    {
      id: 'discount_20',
      name: '20% Off',
      description: '20% off your entire order',
      pointsCost: 150,
      icon: '💰',
      discount: (items, currentTotal) => currentTotal * 0.20
    },
    {
      id: 'bogo',
      name: 'Buy One Get One',
      description: 'Get the cheapest drink free',
      pointsCost: 75,
      icon: '🎁',
      discount: (items) => {
        // Find cheapest drink
        const cheapest = items.reduce((min, item) => 
          parseFloat(item.price) < parseFloat(min.price) ? item : min
        , items[0]);
        return cheapest ? parseFloat(cheapest.price) : 0;
      }
    }
  ];

  // Calculate total discount from selected rewards
  const calculateRewardDiscount = () => {
    let totalDiscount = 0;
    selectedRewards.forEach(rewardId => {
      const reward = rewards.find(r => r.id === rewardId);
      if (reward) {
        if (typeof reward.discount === 'function') {
          totalDiscount += reward.discount(cartItems, total);
        } else {
          totalDiscount += reward.discount;
        }
      }
    });
    return totalDiscount;
  };

  const rewardDiscount = calculateRewardDiscount();
  const finalTotal = Math.max(0, total - rewardDiscount);

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
                            <span className="font-semibold">{getTranslatedText('Size')}:</span>
                            <span>{getTranslatedText(item.customizations.size)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{getTranslatedText('Sweetness:')}</span>
                            <span>{getTranslatedText(item.customizations.sweetness)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{getTranslatedText('Ice:')}</span>
                            <span>{getTranslatedText(item.customizations.ice)}</span>
                          </div>
                          {item.customizations.toppings.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{getTranslatedText('Toppings:')}</span>
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

            {/* Rewards Section - Only show if customer is logged in */}
            {customer && customer.loyaltyPoints > 0 && (
              <div className={`p-8 rounded-xl shadow-lg mb-8 ${
                highContrast 
                  ? 'bg-gray-900 border-4 border-yellow-400' 
                  : 'bg-gradient-to-br from-purple-50 to-pink-50'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-3xl font-bold ${
                    highContrast ? 'text-yellow-400' : 'text-purple-800'
                  }`}>
                    🎁 {getTranslatedText('Rewards')}
                  </h2>
                  <div className={`px-6 py-3 rounded-full ${
                    highContrast 
                      ? 'bg-yellow-400 text-black border-2 border-yellow-400' 
                      : 'bg-purple-600 text-white'
                  }`}>
                    <span className="font-bold text-xl">{customer.loyaltyPoints} {getTranslatedText('points')}</span>
                  </div>
                </div>
                
                <p className={`text-lg mb-6 ${
                  highContrast ? 'text-white' : 'text-gray-700'
                }`}>
                  {getTranslatedText('Redeem your points for rewards!')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rewards.map(reward => {
                    const canAfford = customer.loyaltyPoints >= reward.pointsCost;
                    const isSelected = selectedRewards.includes(reward.id);
                    const pointsAfterRedemption = customer.loyaltyPoints - 
                      selectedRewards.reduce((sum, id) => {
                        const r = rewards.find(rw => rw.id === id);
                        return sum + (r ? r.pointsCost : 0);
                      }, 0);
                    const canSelect = canAfford && (isSelected || pointsAfterRedemption >= reward.pointsCost);

                    return (
                      <button
                        key={reward.id}
                        onClick={() => canSelect && onRewardToggle(reward.id)}
                        disabled={!canSelect}
                        className={`p-6 rounded-lg text-left transition-all ${
                          isSelected
                            ? highContrast
                              ? 'bg-yellow-400 text-black border-4 border-yellow-500 shadow-xl'
                              : 'bg-green-600 text-white border-4 border-green-700 shadow-xl'
                            : canSelect
                              ? highContrast
                                ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-700'
                                : 'bg-white text-gray-800 border-2 border-purple-300 hover:border-purple-500 hover:shadow-lg'
                              : highContrast
                                ? 'bg-gray-950 text-gray-600 border-2 border-gray-700 opacity-50 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-400 border-2 border-gray-200 opacity-50 cursor-not-allowed'
                        }`}
                        style={{ minHeight: '140px' }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-5xl">{reward.icon}</span>
                          <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                            isSelected
                              ? highContrast ? 'bg-black text-yellow-400' : 'bg-green-800 text-white'
                              : canSelect
                                ? highContrast ? 'bg-yellow-400 text-black' : 'bg-purple-600 text-white'
                                : 'bg-gray-300 text-gray-600'
                          }`}>
                            {reward.pointsCost} pts
                          </div>
                        </div>
                        <h3 className="text-xl font-bold mb-2">
                          {isSelected && '✓ '}{getTranslatedText(reward.name)}
                        </h3>
                        <p className={`text-sm ${
                          isSelected
                            ? highContrast ? 'text-black' : 'text-white'
                            : canSelect
                              ? highContrast ? 'text-gray-300' : 'text-gray-600'
                              : 'text-gray-400'
                        }`}>
                          {getTranslatedText(reward.description)}
                        </p>
                        {!canSelect && !isSelected && (
                          <p className={`text-xs mt-2 font-semibold ${
                            highContrast ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {getTranslatedText('Not enough points')}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Total and Checkout */}
            <div className={`p-8 rounded-xl shadow-lg ${
              highContrast 
                ? 'bg-gray-900 border-4 border-yellow-400' 
                : 'bg-white'
            }`}>
              {/* Subtotal */}
              {rewardDiscount > 0 && (
                <>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-2xl font-semibold ${
                      highContrast ? 'text-white' : 'text-gray-600'
                    }`}>
                      {getTranslatedText('Subtotal')}:
                    </span>
                    <span className={`text-3xl font-bold ${
                      highContrast ? 'text-white' : 'text-gray-800'
                    }`}>
                      ${total.toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Reward Discount */}
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-2xl font-semibold ${
                      highContrast ? 'text-yellow-400' : 'text-green-600'
                    }`}>
                      🎁 {getTranslatedText('Rewards Savings')}:
                    </span>
                    <span className={`text-3xl font-bold ${
                      highContrast ? 'text-yellow-400' : 'text-green-600'
                    }`}>
                      -${rewardDiscount.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className={`border-t-2 pt-4 mt-4 ${
                    highContrast ? 'border-yellow-400' : 'border-gray-300'
                  }`}></div>
                </>
              )}
              
              {/* Final Total */}
              <div className="flex justify-between items-center mb-6">
                <span className={`text-3xl font-bold ${
                  highContrast ? 'text-yellow-400' : 'text-gray-800'
                }`}>
                  {getTranslatedText('Total')}:
                </span>
                <span className={`text-5xl font-bold ${
                  highContrast ? 'text-yellow-400' : 'text-green-600'
                }`}>
                  ${finalTotal.toFixed(2)}
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
