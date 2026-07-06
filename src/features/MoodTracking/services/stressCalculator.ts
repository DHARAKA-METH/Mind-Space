export function calculateStress(
  userStress:any,
  aiStress:any,
  faceStressLevel:any,
  historyAverage:any
) {

  const result =
    userStress * 0.3 +
    aiStress * 0.3 +
    faceStressLevel * 0.3 +
    historyAverage * 0.1;
  return Number(result.toFixed(1));
}