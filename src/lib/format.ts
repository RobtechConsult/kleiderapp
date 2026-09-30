/** "49,90 €" */
export const formatPrice = (euros: number) => `${euros.toFixed(2).replace('.', ',')} €`;
