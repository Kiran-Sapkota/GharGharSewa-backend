/** Shared catalog used by seed and kept in sync with the client service list. */
const SERVICE_CATEGORIES = [
  {
    name: "electrician",
    label: "Electrician",
    description: "Wiring, lighting, and electrical repairs",
    icon: "⚡",
  },
  {
    name: "plumber",
    label: "Plumber",
    description: "Pipe leaks, taps, toilets, and water fittings",
    icon: "🔧",
  },
  {
    name: "cleaner",
    label: "Cleaner",
    description: "Home and office deep cleaning services",
    icon: "🧹",
  },
  {
    name: "carpenter",
    label: "Carpenter",
    description: "Furniture, doors, windows, and woodwork",
    icon: "🪚",
  },
  {
    name: "appliance repair",
    label: "Appliance Repair",
    description: "Washing machine, fridge, TV, and appliance fixes",
    icon: "🔌",
  },
  {
    name: "painter",
    label: "Painter",
    description: "Interior and exterior painting services",
    icon: "🎨",
  },
];

const serviceDescriptionMap = {
  electrician: [
    "Wiring and rewiring of home electrical systems",
    "Fan and light installation",
  ],
  plumber: [
    "Pipe leakage repair and replacement",
    "Tap and shower installation",
  ],
  cleaner: [
    "Full house deep cleaning",
    "Kitchen and bathroom sanitization",
  ],
  carpenter: [
    "Furniture repair and polishing",
    "Door and window frame fitting",
  ],
  "appliance repair": [
    "Washing machine repair",
    "Refrigerator gas refilling",
  ],
  painter: [
    "Interior wall painting",
    "Exterior house painting",
  ],
};

const cities = [
  { name: "Kathmandu", lat: 27.7172, lng: 85.324 },
  { name: "Lalitpur", lat: 27.6644, lng: 85.3188 },
  { name: "Bhaktapur", lat: 27.671, lng: 85.4298 },
  { name: "Pokhara", lat: 28.2096, lng: 83.9856 },
  { name: "Butwal", lat: 27.7006, lng: 83.4532 },
];

const streetNames = [
  "Maharajgunj",
  "Baneshwor",
  "Thamel",
  "Baluwatar",
  "Pulchowk",
  "Lazimpat",
];

module.exports = {
  SERVICE_CATEGORIES,
  serviceDescriptionMap,
  cities,
  streetNames,
};
