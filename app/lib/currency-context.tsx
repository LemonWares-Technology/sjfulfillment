"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Currency = 'NGN' | 'USD' | 'EUR';

interface CurrencyContextProps {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextProps | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('NGN');

  useEffect(() => {
    // Load currency from localStorage if available
    const stored = localStorage.getItem('selectedCurrency');
    if (stored === 'NGN' || stored === 'USD' || stored === 'EUR') {
      setCurrency(stored);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedCurrency', currency);
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within a CurrencyProvider');
  return context;
};
