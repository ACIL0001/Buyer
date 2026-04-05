"use client";
import React, { useReducer, useState, useEffect } from "react";

// Reducer function to manage quantity state
function quantityReducer(state, action) {
  switch (action.type) {
    case "INCREMENT":
      return { quantity: state.quantity + action.payload };
    case "DECREMENT":
      return {
        quantity: Math.max(0, state.quantity - action.payload), // Allow 0 for display purposes
      };
    case "SET":
      return { quantity: action.payload >= 0 ? action.payload : 0 }; // Allow 0 for display purposes
    default:
      return state;
  }
}

// Function to format price with currency symbol - supports both integers and decimals
const formatPrice = (price) => {
  const num = Number(price);
  if (isNaN(num)) return '0';
  
  // If it's a whole number, format without decimals
  if (num % 1 === 0) {
    return num.toLocaleString();
  } else {
    // If it has decimals, show up to 2 decimal places
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  }
};

// Function to parse formatted price back to number - supports both integers and decimals
const parseFormattedPrice = (formattedPrice) => {
  // Remove commas and parse as number
  const cleanValue = formattedPrice.replace(/,/g, '');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

function HandleQuantity({ initialValue = 1, startingPrice = 0, placeholder = "", maxValue = Infinity, minValue = 0 }) {
  // Parse the initial value - it might be a formatted string or a number
  const parseInitialValue = (value) => {
    if (typeof value === 'string') {
      return parseFormattedPrice(value);
    }
    return Number(value);
  };

  const initialNumericValue = parseInitialValue(initialValue);

  // Dynamic increment/decrement based on starting price
  const getIncrementValue = () => {
    return 100;
  };

  // Initialize state with the parsed numeric value
  const [state1, dispatch1] = useReducer(quantityReducer, {
    quantity: initialNumericValue,
  });

  // State for the display value (formatted)
  const [displayValue, setDisplayValue] = useState(formatPrice(initialNumericValue));

  // Update display value when quantity changes
  useEffect(() => {
    setDisplayValue(formatPrice(state1.quantity));
  }, [state1.quantity]);

  // Update when initialValue prop changes (for reactive updates)
  useEffect(() => {
    const newNumericValue = parseInitialValue(initialValue);
    if (newNumericValue !== state1.quantity && newNumericValue > 0) {
      dispatch1({ type: "SET", payload: newNumericValue });
      setDisplayValue(formatPrice(newNumericValue));
    }
  }, [initialValue]);

  // Debug log to show increment value
  useEffect(() => {
    console.log('🔧 HandleQuantity initialized:', {
      initialValue: initialValue,
      initialNumericValue: initialNumericValue,
      startingPrice: startingPrice,
      maxValue: maxValue,
      minValue: minValue,
      incrementValue: getIncrementValue()
    });
  }, []);

  const increment1 = () => {
    // Add dynamic increment based on starting price
    const incrementAmount = getIncrementValue();
    const newValue = Math.min(maxValue, state1.quantity + incrementAmount);
    
    if (newValue === state1.quantity) return; // Already at max

    console.log('🔼 Increment clicked:', {
      currentValue: state1.quantity,
      incrementAmount: incrementAmount,
      newValue: newValue
    });
    dispatch1({ type: "SET", payload: newValue });
  };

  const decrement1 = () => {
    // Subtract dynamic increment from current value, but don't go below minValue
    const incrementAmount = getIncrementValue();
    const newValue = Math.max(minValue, state1.quantity - incrementAmount);
    
    if (newValue === state1.quantity) return; // Already at min

    console.log('🔽 Decrement clicked:', {
      currentValue: state1.quantity,
      incrementAmount: incrementAmount,
      newValue: newValue
    });
    dispatch1({ type: "SET", payload: newValue });
  };

  const handleInputChange1 = (e) => {
    const inputValue = e.target.value;
    
    // Allow digits, dots, and commas (for thousands separator)
    // Remove everything except digits, dots, and commas
    const cleanValue = inputValue.replace(/[^\d.,]/g, '');
    
    // Handle multiple dots - only allow one dot
    const dotCount = (cleanValue.match(/\./g) || []).length;
    const processedValue = dotCount > 1 
      ? cleanValue.replace(/\./g, '').replace(/(\d+)(\d{3})/, '$1.$2')
      : cleanValue;
    
    // If the input is empty, allow it and set state to 0
    if (processedValue === '') {
      setDisplayValue('');
      dispatch1({ type: "SET", payload: 0 });
      return;
    }
    
    // Parse the value - support both integers and decimals
    const numericValue = parseFormattedPrice(processedValue);
    
    // Update display with the processed value (preserve user's typing)
    setDisplayValue(processedValue);
    
    // Update state with numeric value
    dispatch1({ type: "SET", payload: numericValue });
  };

  const handleInputBlur = () => {
    // If the input is empty or 0, keep it empty for better UX
    if (state1.quantity === 0) {
      setDisplayValue('');
    } else {
      // Ensure the display value is properly formatted when user leaves the input
      setDisplayValue(formatPrice(state1.quantity));
    }
  };

  const handleInputKeyDown = (e) => {
    // No special handling needed since we removed ",00" protection
    // Users can now freely edit the input
  };

  return (
    <div className="quantity-counter-v2">
      <div className="input-with-currency">
        <input
          name="quantity"
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleInputChange1}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="quantity__input_v2"
          placeholder={placeholder || formatPrice(initialNumericValue)}
        />
        <span className="currency-suffix">DA</span>
      </div>
      <div className="stepper-arrows">
        <button
          className="stepper-arrow up"
          onClick={(e) => {
            e.preventDefault();
            increment1();
          }}
          aria-label="Increase"
        >
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          className="stepper-arrow down"
          onClick={(e) => {
            e.preventDefault();
            decrement1();
          }}
          aria-label="Decrease"
        >
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default HandleQuantity;
