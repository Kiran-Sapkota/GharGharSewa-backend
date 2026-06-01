const calculateDistance = require("../src/utils/haversine");

describe("Haversine Distance Calculator", () => {
  it("should calculate distance between two identical points as 0", () => {
    const distance = calculateDistance(27.7172, 85.3240, 27.7172, 85.3240);
    expect(distance).toBe(0);
  });

  it("should calculate the distance between Kathmandu and Pokhara correctly", () => {
    const lat1 = 27.7172; // Kathmandu
    const lon1 = 85.3240;
    const lat2 = 28.2096; // Pokhara
    const lon2 = 83.9856;
    
    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    // Approximate distance is ~140-150km depending on exact coordinates
    expect(distance).toBeGreaterThan(140);
    expect(distance).toBeLessThan(150);
  });

  it("should handle negative coordinates correctly", () => {
    const distance = calculateDistance(0, 0, -10, -10);
    expect(distance).toBeGreaterThan(0);
  });
});
