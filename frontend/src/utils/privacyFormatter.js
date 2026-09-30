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
  
  // Cuando está visible: formato español con 2 decimales y separador de miles (2.293,75)
  const num = parseFloat(amount);
  if (isNaN(num)) return '0,00';
  const [entero, decimales] = Math.abs(num).toFixed(2).split('.');
  const conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${num < 0 && Number(Math.abs(num).toFixed(2)) !== 0 ? '-' : ''}${conMiles},${decimales}`;
};

// Hook que retorna ambas funciones de forma simple
export const usePrivacyFormatter = () => {
  const { hiddenNumbers } = usePrivacyStore();
  
  return (amount) => formatAmount(amount, hiddenNumbers);
};
