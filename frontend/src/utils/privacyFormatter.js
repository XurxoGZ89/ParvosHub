import usePrivacyStore from '../stores/privacyStore';

export const useFormattedAmount = (amount) => {
  const { hiddenNumbers } = usePrivacyStore();
  
  if (hiddenNumbers) {
    // Contar los dígitos del número para saber cuántos puntos mostrar
    const numStr = Math.abs(parseFloat(amount)).toString().replace('.', '');
    const dotCount = numStr.length;
    return '•'.repeat(Math.max(3, Math.min(dotCount, 10)));
  }
  
  return amount;
};

export const formatAmount = (amount, hiddenNumbers) => {
  if (hiddenNumbers) {
    const numStr = Math.abs(parseFloat(amount)).toString().replace('.', '');
    const dotCount = numStr.length;
    return '•'.repeat(Math.max(3, Math.min(dotCount, 10)));
  }
  
  // Cuando está visible, devolver con 2 decimales
  return parseFloat(amount).toFixed(2);
};

// Hook que retorna ambas funciones de forma simple
export const usePrivacyFormatter = () => {
  const { hiddenNumbers } = usePrivacyStore();
  
  return (amount) => formatAmount(amount, hiddenNumbers);
};
