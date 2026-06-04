

export async function calculateAverageDayStressLevel(stressLevels: any[]) {

    if (!stressLevels || stressLevels.length === 0) {
        return 0;
    }

    let totalStress = 0;
    let count = 0;

    stressLevels.forEach(entry => {
        if (typeof entry.finalStress === 'number') {
            totalStress += entry.finalStress;
            count++;
        }
    })

    if (count === 0) {
        return 0;
    }

    const rawAverage = totalStress / count;
    return Math.round(rawAverage * 10) / 10;


}