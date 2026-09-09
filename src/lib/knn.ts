export function normalize(data: any[], features: string[]) {
  const stats = features.reduce((acc, feat) => {
    const values = data.map(d => parseFloat(d[feat] || 0));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length) || 1;
    acc[feat] = { mean, std };
    return acc;
  }, {} as Record<string, { mean: number; std: number }>);

  return stats;
}

export function predictMagnitude(
  trainData: any[],
  input: Record<string, number>,
  features: string[],
  k: number = 5
) {
  const stats = normalize(trainData, features);

  // Calculate distance for all points
  const distances = trainData.map(row => {
    let distSq = 0;
    for (const feat of features) {
      const rowVal = parseFloat(row[feat] || 0);
      const inputVal = input[feat] || 0;
      
      const normRow = (rowVal - stats[feat].mean) / stats[feat].std;
      const normInput = (inputVal - stats[feat].mean) / stats[feat].std;
      
      distSq += Math.pow(normRow - normInput, 2);
    }
    return {
      distance: Math.sqrt(distSq),
      mag: parseFloat(row['mag'] || 0)
    };
  });

  // Sort by distance
  distances.sort((a, b) => a.distance - b.distance);

  // Average the top k
  const topK = distances.slice(0, k);
  const avgMag = topK.reduce((sum, item) => sum + item.mag, 0) / k;

  return avgMag;
}
