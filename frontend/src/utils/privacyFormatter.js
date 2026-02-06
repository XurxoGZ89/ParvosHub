import usePrivacyStore from '../stores/privacyStore';

export const useFormattedAmount = (amount) => {
  const { hiddenNumbers } = usePrivacyStore();
  
  if (hiddenNumbers) {
    return '•••';
  }
  
  return amount;
};

export const formatAmount = (amount, hiddenNumbers) => {
  if (hiddenNumbers) {
    return '•••';
  }
  
  // Cuando está visible, devolver con 2 decimales
  return parseFloat(amount).toFixed(2);
};

// Hook que retorna ambas funciones de forma simple
export const usePrivacyFormatter = () => {
  const { hiddenNumbers } = usePrivacyStore();
  
  return (amount) => formatAmount(amount, hiddenNumbers);
};
