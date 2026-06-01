const textToVector = (text) => {
  const words = text.toLowerCase().split(/\s+/);
  const vector = {};

  words.forEach((word) => {
    vector[word] = (vector[word] || 0) + 1;
  });

  return vector;
};

const cosineSimilarity = (text1, text2) => {
  const vector1 = textToVector(text1);
  const vector2 = textToVector(text2);

  const allWords = new Set([
    ...Object.keys(vector1),
    ...Object.keys(vector2),
  ]);

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  allWords.forEach((word) => {
    const value1 = vector1[word] || 0;
    const value2 = vector2[word] || 0;

    dotProduct += value1 * value2;
    magnitude1 += value1 * value1;
    magnitude2 += value2 * value2;
  });

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
};

module.exports = cosineSimilarity;