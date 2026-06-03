export function calculateStress(
  userStress:any,
  aiStress:any,
  historyAverage:any
) {

  const result =
    userStress * 0.3 +
    aiStress * 0.5 +
    historyAverage * 0.2;

  return Number(result.toFixed(1));
}