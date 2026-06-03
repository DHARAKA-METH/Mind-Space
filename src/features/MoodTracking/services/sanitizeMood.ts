export const sanitizeMoodData = (data:any) => {
  return {
    mood: data.mood?.trim().toLowerCase(),
    note: data.note?.trim(),
    selfStress: Number(data.selfStress)
  };
};