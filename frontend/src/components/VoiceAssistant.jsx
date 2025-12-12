import React, { useState, useEffect, useRef } from 'react';

/**
 * Voice Assistant Component
 * Allows users to add items to cart and checkout using voice commands
 */
export default function VoiceAssistant({
  drinks,
  toppings,
  sweetnessOptions,
  iceOptions,
  sizeOptions,
  onAddToCart,
  onCheckout,
  cart = [], // Add cart prop
  currentView, // Add currentView prop
  onNavigateToCart, // Add navigation prop
  highContrast,
  getTranslatedText
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [fullTranscript, setFullTranscript] = useState(''); // Track full conversation
  const [feedback, setFeedback] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const fullTranscriptRef = useRef(''); // Keep track of full transcript

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Changed to continuous mode
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 3; // Get multiple alternatives for better accuracy

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece + ' ';
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        // Update current transcript
        setTranscript(interimTranscript || finalTranscript);

        // If we got a final result, append to full transcript and process
        if (finalTranscript) {
          const updatedFullTranscript = fullTranscriptRef.current + finalTranscript;
          fullTranscriptRef.current = updatedFullTranscript;
          setFullTranscript(updatedFullTranscript);
          processCommand(finalTranscript.trim());
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'no-speech') {
          // Don't stop listening on no-speech in continuous mode
          setFeedback("Listening... (say a command)");
        } else if (event.error === 'not-allowed') {
          setIsListening(false);
          setFeedback('Microphone access denied. Please enable it in your browser settings.');
        } else if (event.error === 'network') {
          setFeedback('Network error. Retrying...');
          // Auto-retry in continuous mode
          setTimeout(() => {
            if (isListening && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.log('Already started');
              }
            }
          }, 1000);
        } else if (event.error === 'aborted') {
          // Don't show error for aborted in continuous mode
          console.log('Recognition aborted, will restart if still listening');
        } else {
          setFeedback(`Error: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        // Auto-restart if still in listening mode (for continuous listening)
        if (isListening) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.log('Recognition restart error:', error);
            setIsListening(false);
          }
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isListening]); // Added isListening as dependency

  const startListening = () => {
    if (!recognitionRef.current) {
      setFeedback('Voice recognition is not supported in your browser.');
      return;
    }

    try {
      setTranscript('');
      setFullTranscript('');
      fullTranscriptRef.current = '';
      setFeedback('Listening... speak your commands!');
      setIsListening(true);
      setIsExpanded(true);
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      setIsListening(false);
      setFeedback('Failed to start voice recognition. Please try again.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setFeedback('Stopped listening.');
  };

  const processCommand = (command) => {
    const lowerCommand = command.toLowerCase();
    console.log('Processing command:', lowerCommand);

    // Checkout commands
    if (lowerCommand.includes('checkout') || lowerCommand.includes('check out')) {
      if (!cart || cart.length === 0) {
        setFeedback('Your cart is empty. Add some drinks first!');
        return;
      }
      
      setFeedback('Proceeding to checkout... ✓');
      
      // Stop listening before checkout
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      
      setTimeout(() => {
        try {
          // Navigate to cart first if not already there
          if (currentView !== 'cart' && onNavigateToCart) {
            onNavigateToCart();
          }
          
          // Small delay to ensure view is updated, then trigger checkout
          setTimeout(() => {
            onCheckout();
            setFeedback('Opening checkout...');
            // Close the voice assistant panel
            setTimeout(() => {
              setIsExpanded(false);
            }, 1000);
          }, currentView !== 'cart' ? 300 : 0);
        } catch (error) {
          console.error('Checkout error:', error);
          setFeedback('Error opening checkout. Please try manually.');
        }
      }, 500);
      return;
    }

    // Add to cart command
    if (lowerCommand.includes('add')) {
      const drink = findDrink(lowerCommand);
      
      if (!drink) {
        setFeedback("Sorry, I couldn't find that drink. Please try again or tap to order manually.");
        return;
      }

      // Extract customizations
      const size = extractSize(lowerCommand);
      const sweetness = extractSweetness(lowerCommand);
      const ice = extractIce(lowerCommand);
      const extractedToppings = extractToppings(lowerCommand);

      const customizedDrink = {
        ...drink,
        customizations: {
          size: size || sizeOptions[0]?.name || 'Medium',
          sweetness: sweetness || sweetnessOptions[0]?.name || 'Regular',
          ice: ice || iceOptions[0]?.name || 'Regular',
          toppings: extractedToppings
        }
      };

      onAddToCart(customizedDrink);
      
      let customizationText = '';
      if (size || sweetness || ice || extractedToppings.length > 0) {
        const parts = [];
        if (size) parts.push(size);
        if (sweetness) parts.push(sweetness + ' sweetness');
        if (ice) parts.push(ice + ' ice');
        if (extractedToppings.length > 0) parts.push(`with ${extractedToppings.join(', ')}`);
        customizationText = ` (${parts.join(', ')})`;
      }
      
      setFeedback(`Added ${drink.name}${customizationText} to cart! ✓`);
      
      // Clear feedback after 3 seconds but keep listening
      timeoutRef.current = setTimeout(() => {
        setFeedback('Listening... add more items or say "checkout"');
      }, 3000);
      return;
    }

    // Clear cart
    if (lowerCommand.includes('clear cart') || lowerCommand.includes('empty cart')) {
      setFeedback('Cart cleared! ✓');
      // Note: You'd need to add onClearCart prop if you want this feature
      return;
    }

    // If no command matched
    setFeedback("Sorry, I didn't understand that command. Try saying 'add [drink name]' or 'checkout'.");
  };

  const findDrink = (command) => {
    // Find drink by matching name
    return drinks.find(drink => 
      command.includes(drink.name.toLowerCase())
    );
  };

  const extractSize = (command) => {
    const sizes = ['small', 'medium', 'large', 'extra large'];
    for (const size of sizes) {
      if (command.includes(size)) {
        // Find matching size option
        const sizeOption = sizeOptions.find(s => 
          s.name.toLowerCase().includes(size)
        );
        return sizeOption?.name || size.charAt(0).toUpperCase() + size.slice(1);
      }
    }
    return null;
  };

  const extractSweetness = (command) => {
    const sweetnessKeywords = {
      'no sugar': 'No Sugar (0%)',
      'zero sugar': 'No Sugar (0%)',
      'light sugar': 'Light (25%)',
      'light sweetness': 'Light (25%)',
      'half sugar': 'Half (50%)',
      'half sweetness': 'Half (50%)',
      'less sugar': 'Less (75%)',
      'less sweetness': 'Less (75%)',
      'regular sweetness': 'Normal (100%)',
      'normal sweetness': 'Normal (100%)',
      'extra sugar': 'Extra Sugar (125%)',
      'extra sweet': 'Extra Sugar (125%)'
    };

    for (const [keyword, value] of Object.entries(sweetnessKeywords)) {
      if (command.includes(keyword)) {
        return value;
      }
    }
    return null;
  };

  const extractIce = (command) => {
    if (command.includes('no ice') || command.includes('zero ice')) {
      return 'No Ice';
    } else if (command.includes('light ice') || command.includes('less ice')) {
      return 'Less';
    } else if (command.includes('regular ice') || command.includes('normal ice')) {
      return 'Regular';
    }
    return null;
  };

  const extractToppings = (command) => {
    const foundToppings = [];
    for (const topping of toppings) {
      if (command.includes(topping.name.toLowerCase())) {
        foundToppings.push(topping.name);
      }
    }
    return foundToppings;
  };

  if (!isExpanded) {
    // Minimized button
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl transition-all transform hover:scale-110 z-50 ${
          highContrast
            ? 'bg-yellow-400 text-black hover:bg-yellow-300'
            : 'bg-gradient-to-br from-purple-600 to-purple-800 text-white hover:from-purple-700 hover:to-purple-900'
        }`}
        title="Voice Assistant"
      >
        <div className="flex items-center justify-center">
          <span className="text-3xl">🎤</span>
        </div>
      </button>
    );
  }

  // Expanded view
  return (
    <div className={`fixed bottom-6 right-6 rounded-2xl shadow-2xl z-50 ${
      highContrast ? 'bg-gray-900 border-4 border-yellow-400' : 'bg-white'
    }`} style={{ width: '380px', maxHeight: '500px' }}>
      {/* Header */}
      <div className={`p-4 rounded-t-2xl ${
        highContrast ? 'bg-gray-800 border-b-4 border-yellow-400' : 'bg-gradient-to-r from-purple-600 to-purple-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎤</span>
            <h3 className={`text-lg font-bold ${
              highContrast ? 'text-yellow-400' : 'text-white'
            }`}>
              Voice Assistant
            </h3>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className={`p-2 rounded-lg transition-colors ${
              highContrast
                ? 'text-yellow-400 hover:bg-gray-700'
                : 'text-white hover:bg-purple-700'
            }`}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Instructions */}
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          highContrast ? 'bg-gray-800 text-white' : 'bg-purple-50 text-gray-700'
        }`}>
          <p className="font-semibold mb-2">🎤 Voice Commands:</p>
          <ul className="space-y-1 text-xs">
            <li>• "Add coconut milk tea with light ice"</li>
            <li>• "Add large taro milk tea with boba"</li>
            <li>• "Add medium matcha with no sugar"</li>
            <li>• "Checkout" (when ready to pay)</li>
          </ul>
          <p className="text-xs mt-2 italic">
            💡 Tip: Click "Start Listening" and speak multiple commands. Click "Stop" when done.
          </p>
        </div>

        {/* Transcript Display */}
        {(transcript || fullTranscript) && (
          <div className={`mb-3 p-3 rounded-lg ${
            highContrast ? 'bg-gray-800 border-2 border-yellow-400' : 'bg-gray-100'
          }`}>
            {transcript && (
              <>
                <p className={`text-sm font-semibold mb-1 ${
                  highContrast ? 'text-yellow-400' : 'text-gray-600'
                }`}>
                  You're saying:
                </p>
                <p className={`text-base mb-2 ${
                  highContrast ? 'text-white' : 'text-gray-800'
                }`}>
                  "{transcript}"
                </p>
              </>
            )}
            {fullTranscript && (
              <>
                <p className={`text-xs font-semibold mb-1 ${
                  highContrast ? 'text-yellow-400' : 'text-gray-500'
                }`}>
                  Full transcript:
                </p>
                <p className={`text-xs ${
                  highContrast ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {fullTranscript}
                </p>
              </>
            )}
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className={`mb-3 p-3 rounded-lg ${
            feedback.includes('✓')
              ? highContrast
                ? 'bg-green-900 border-2 border-green-500'
                : 'bg-green-100 text-green-800'
              : feedback.includes('Sorry') || feedback.includes('error')
                ? highContrast
                  ? 'bg-red-900 border-2 border-red-500'
                  : 'bg-red-100 text-red-800'
                : highContrast
                  ? 'bg-gray-800 border-2 border-blue-500'
                  : 'bg-blue-100 text-blue-800'
          }`}>
            <p className={`text-sm ${
              highContrast ? 'text-white' : ''
            }`}>
              {feedback}
            </p>
          </div>
        )}

        {/* Microphone Button */}
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={!recognitionRef.current}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            isListening
              ? highContrast
                ? 'bg-red-700 text-white hover:bg-red-600 animate-pulse'
                : 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
              : highContrast
                ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                : 'bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:from-purple-700 hover:to-purple-900'
          } ${!recognitionRef.current ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isListening ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-3 h-3 bg-white rounded-full animate-ping"></span>
              🛑 Stop Listening
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              🎤 Start Listening
            </span>
          )}
        </button>

        {!recognitionRef.current && (
          <p className="text-xs text-center mt-2 text-red-500">
            Voice recognition not supported in this browser
          </p>
        )}
      </div>
    </div>
  );
}