const cosineSimilarity = require("../src/utils/cosineSimilarity");

describe("Cosine Similarity", () => {
  it("should return 1 for identical strings", () => {
    const similarity = cosineSimilarity("need electrician for fixing light", "need electrician for fixing light");
    expect(similarity).toBeGreaterThan(0.99); // handling float precision
  });

  it("should return 0 for completely different strings", () => {
    const similarity = cosineSimilarity("plumber pipe fix", "electrician wire repair");
    expect(similarity).toBe(0);
  });

  it("should handle partial matches correctly", () => {
    const sim1 = cosineSimilarity("need plumber", "plumber for fixing pipe");
    expect(sim1).toBeGreaterThan(0);
    expect(sim1).toBeLessThan(1);
  });

  it("should handle different cases (case-insensitive)", () => {
    const similarity = cosineSimilarity("ELECTRICIAN", "electrician");
    expect(similarity).toBeGreaterThan(0.99);
  });
});
