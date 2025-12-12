import React, { useState, useMemo } from 'react';

/**
 * Payment Method Modal
 * Mock payment selection (Card or Cash) with rewards redemption
 */
export default function PaymentModal({
  total,
  customer,
  cart,
  onPaymentSelect,
  onCancel,
  highContrast,
  getTranslatedText
}) {
  const [selectedRewards, setSelectedRewards] = useState([]);

  // Define available rewards (same as kiosk)
  const rewards = [
    {
      id: 'free_drink',
      name: 'Free Drink',
      description: 'Get any drink for free',
      pointsCost: 100,
      icon: '🥤',
      discount: (items) => {
        const drinks = items.filter(item => item.type === 'Drink' || !item.type);
        if (drinks.length === 0) return 0;
        const mostExpensive = drinks.reduce((max, item) => 
          parseFloat(item.price) > parseFloat(max.price) ? item : max
        );
        return mostExpensive ? parseFloat(mostExpensive.price) : 0;
      }
    },
    {
      id: 'free_topping',
      name: 'Free Topping',
      description: 'Add a free topping to any drink',
      pointsCost: 50,
      icon: '🧋',
      discount: 0.75
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
        const drinks = items.filter(item => item.type === 'Drink' || !item.type);
        if (drinks.length === 0) return 0;
        const cheapest = drinks.reduce((min, item) => 
          parseFloat(item.price) < parseFloat(min.price) ? item : min
        );
        return cheapest ? parseFloat(cheapest.price) : 0;
      }
    }
  ];

  // Calculate total discount from selected rewards
  const rewardDiscount = useMemo(() => {
    let totalDiscount = 0;
    selectedRewards.forEach(rewardId => {
      const reward = rewards.find(r => r.id === rewardId);
      if (reward) {
        if (typeof reward.discount === 'function') {
          totalDiscount += reward.discount(cart, total);
        } else {
          totalDiscount += reward.discount;
        }
      }
    });
    return totalDiscount;
  }, [selectedRewards, cart, total]);

  // Calculate points used
  const pointsUsed = useMemo(() => {
    return selectedRewards.reduce((sum, rewardId) => {
      const reward = rewards.find(r => r.id === rewardId);
      return sum + (reward ? reward.pointsCost : 0);
    }, 0);
  }, [selectedRewards]);

  // Final total after discounts
  const finalTotal = Math.max(0, total - rewardDiscount);

  // Toggle reward selection
  const toggleReward = (rewardId) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return;

    setSelectedRewards(prev => {
      if (prev.includes(rewardId)) {
        // Remove reward
        return prev.filter(id => id !== rewardId);
      } else {
        // Check if customer has enough points
        const newPointsUsed = pointsUsed + reward.pointsCost;
        if (newPointsUsed > customer.loyaltypoints) {
          return prev; // Don't add if not enough points
        }
        // Add reward
        return [...prev, rewardId];
      }
    });
  };

  // Handle payment with rewards
  const handlePayment = (paymentType) => {
    onPaymentSelect(paymentType, {
      selectedRewards,
      rewardDiscount,
      pointsUsed,
      finalTotal
    });
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onCancel}
    >
      <div 
        className={`rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto ${
          highContrast ? 'bg-gray-900 border-4 border-yellow-400' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className={`text-2xl font-bold mb-1 ${
              highContrast ? 'text-yellow-400' : 'text-gray-800'
            }`}>
              💳 {getTranslatedText('Select Payment Method')}
            </h2>
          </div>

          {/* Customer Info Banner (if customer is logged in) */}
          {customer && (
            <div className={`mb-4 p-3 rounded-lg ${
              highContrast ? 'bg-gray-800 border-2 border-yellow-400' : 'bg-blue-50 border-2 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${
                    highContrast ? 'text-yellow-400' : 'text-gray-600'
                  }`}>
                    {getTranslatedText('Customer')}
                  </p>
                  <p className={`text-lg font-bold ${
                    highContrast ? 'text-white' : 'text-gray-800'
                  }`}>
                    {customer.name || customer.phonenumber}
                  </p>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    highContrast ? 'text-white' : 'text-blue-600'
                  }`}>
                    {customer.loyaltypoints - pointsUsed}
                  </div>
                  <div className={`text-xs ${
                    highContrast ? 'text-yellow-400' : 'text-gray-600'
                  }`}>
                    {getTranslatedText('Points Remaining')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rewards Selection */}
          {customer && (
            <div className={`mb-4 p-3 rounded-lg ${
              highContrast ? 'bg-gray-800 border-2 border-yellow-400' : 'bg-purple-50 border-2 border-purple-200'
            }`}>
              <h3 className={`text-sm font-bold mb-2 ${
                highContrast ? 'text-yellow-400' : 'text-gray-800'
              }`}>
                🎁 {getTranslatedText('Available Rewards')}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {rewards.map(reward => {
                  const isSelected = selectedRewards.includes(reward.id);
                  const canAfford = (pointsUsed + reward.pointsCost) <= customer.loyaltypoints;
                  const isDisabled = !isSelected && !canAfford;

                  return (
                    <button
                      key={reward.id}
                      onClick={() => toggleReward(reward.id)}
                      disabled={isDisabled}
                      className={`p-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? highContrast 
                            ? 'bg-yellow-400 text-black border-2 border-yellow-300'
                            : 'bg-purple-600 text-white border-2 border-purple-700'
                          : isDisabled
                            ? highContrast
                              ? 'bg-gray-900 text-gray-600 border-2 border-gray-700 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed'
                            : highContrast
                              ? 'bg-gray-700 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-600'
                              : 'bg-white text-gray-800 border-2 border-purple-300 hover:border-purple-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-1">
                          <span className="text-lg">{reward.icon}</span>
                          <div>
                            <div className="font-semibold text-xs">{getTranslatedText(reward.name)}</div>
                            <div className={`text-[10px] ${
                              isSelected 
                                ? 'text-white' 
                                : isDisabled 
                                  ? 'text-gray-400' 
                                  : highContrast ? 'text-white' : 'text-gray-600'
                            }`}>
                              {getTranslatedText(reward.description)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`font-bold text-xs ${
                            isSelected 
                              ? 'text-white' 
                              : isDisabled 
                                ? 'text-gray-400' 
                                : highContrast ? 'text-yellow-400' : 'text-purple-600'
                          }`}>
                            {reward.pointsCost}
                          </div>
                          {isSelected && (
                            <div className="text-[10px] font-semibold">✓</div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedRewards.length > 0 && (
                <div className={`mt-2 p-2 rounded text-center text-xs font-semibold ${
                  highContrast ? 'bg-yellow-400 text-black' : 'bg-green-100 text-green-700'
                }`}>
                  💰 {getTranslatedText('Total Discount')}: ${rewardDiscount.toFixed(2)}
                </div>
              )}
            </div>
          )}

          {/* Total Display */}
          <div className="text-center mb-4">
            {customer && selectedRewards.length > 0 ? (
              <>
                <p className={`text-lg line-through ${
                  highContrast ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  ${total.toFixed(2)}
                </p>
                <p className={`text-2xl font-bold ${
                  highContrast ? 'text-white' : 'text-green-600'
                }`}>
                  {getTranslatedText('New Total')}: ${finalTotal.toFixed(2)}
                </p>
              </>
            ) : (
              <p className={`text-2xl font-bold ${
                highContrast ? 'text-white' : 'text-green-600'
              }`}>
                {getTranslatedText('Total')}: ${total.toFixed(2)}
              </p>
            )}
          </div>

          {/* Payment Options */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Card Payment */}
            <button
              onClick={() => handlePayment('Card')}
              className={`p-6 rounded-xl shadow-lg transition-all transform hover:scale-105 ${
                highContrast
                  ? 'bg-gray-800 border-4 border-yellow-400 hover:bg-gray-700'
                  : 'bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-300'
              }`}
            >
              <div className="flex flex-col items-center">
                <div className="text-5xl mb-2">💳</div>
                <h3 className={`text-xl font-bold mb-1 ${
                  highContrast ? 'text-yellow-400' : 'text-gray-800'
                }`}>
                  {getTranslatedText('Card')}
                </h3>
                <p className={`text-xs ${
                  highContrast ? 'text-white' : 'text-gray-600'
                }`}>
                  {getTranslatedText('Credit or Debit')}
                </p>
              </div>
            </button>

            {/* Cash Payment */}
            <button
              onClick={() => handlePayment('Cash')}
              className={`p-6 rounded-xl shadow-lg transition-all transform hover:scale-105 ${
                highContrast
                  ? 'bg-gray-800 border-4 border-yellow-400 hover:bg-gray-700'
                  : 'bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-2 border-green-300'
              }`}
            >
              <div className="flex flex-col items-center">
                <div className="text-5xl mb-2">💵</div>
                <h3 className={`text-xl font-bold mb-1 ${
                  highContrast ? 'text-yellow-400' : 'text-gray-800'
                }`}>
                  {getTranslatedText('Cash')}
                </h3>
                <p className={`text-xs ${
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
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              highContrast
                ? 'bg-gray-800 text-yellow-400 border-2 border-yellow-400 hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {getTranslatedText('Cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
