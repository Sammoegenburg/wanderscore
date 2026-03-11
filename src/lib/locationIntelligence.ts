/**
 * Location Intelligence
 *
 * Detects cultural context and environment from GPS coordinates using:
 * - Nominatim reverse geocoding (neighborhood names)
 * - Overpass API (nearby POIs: restaurants, temples, parks, water)
 *
 * Rate-limited to 1 request per 30 seconds.
 */

import type { CultureType, EnvironmentType } from "./audioEngine";

export interface LocationContext {
  culture: CultureType;
  environment: EnvironmentType;
  neighborhood: string;
  features: string[];
  confidence: number; // 0-1
}

// ─── Culture Detection Keywords ──────────────────────────
const CULTURE_KEYWORDS: Record<CultureType, string[]> = {
  eastAsian: [
    "korea", "korean", "koreatown", "china", "chinese", "chinatown",
    "japan", "japanese", "little tokyo", "japantown", "asian",
    "sushi", "ramen", "dim sum", "pho", "bibimbap", "boba",
    "dumpling", "noodle", "wok", "teriyaki", "udon", "soba",
    "temple", "buddhist", "shinto", "pagoda",
    "karaoke", "manga", "anime",
  ],
  latin: [
    "mexico", "mexican", "latin", "latino", "latina", "hispanic",
    "cuba", "cuban", "brazil", "brazilian", "colombia", "colombian",
    "little havana", "el barrio", "spanish", "peru", "peruvian",
    "salsa", "taco", "taqueria", "burrito", "enchilada", "tamale",
    "pupusa", "empanada", "churro", "bodega", "cantina",
    "mariachi", "cumbia",
  ],
  middleEastern: [
    "middle east", "arab", "arabic", "persian", "iran", "iranian",
    "turkish", "turkey", "lebanon", "lebanese", "morocco", "moroccan",
    "syria", "syrian", "egypt", "egyptian",
    "falafel", "shawarma", "hummus", "kebab", "hookah", "shisha",
    "baklava", "pita", "halal",
    "mosque", "islamic", "muslim", "minaret",
  ],
  indian: [
    "india", "indian", "pakistan", "pakistani", "bangladesh", "bengali",
    "nepal", "nepalese", "sri lanka",
    "little india", "curry", "tandoori", "naan", "masala",
    "biryani", "samosa", "chai", "tikka", "paneer", "dosa",
    "hindu", "sikh", "gurudwara", "mandir",
  ],
  african: [
    "africa", "african", "ethiopia", "ethiopian", "nigeria", "nigerian",
    "ghana", "ghanaian", "senegal", "senegalese", "somalia", "somali",
    "kenya", "kenyan", "congo", "congolese",
    "injera", "jollof", "fufu", "suya",
    "little africa",
  ],
  urban: [
    "downtown", "midtown", "financial district", "arts district",
    "entertainment", "nightlife", "club district", "theater district",
    "times square", "broadway", "strip",
  ],
  western: [], // default fallback
};

// ─── Environment Keywords ────────────────────────────────
const ENV_KEYWORDS: Record<EnvironmentType, string[]> = {
  nature: [
    "park", "garden", "forest", "wood", "trail", "meadow", "botanical",
    "nature", "tree", "reserve", "wilderness", "grove", "hill",
    "mountain", "valley", "field", "grassland",
  ],
  water: [
    "river", "lake", "ocean", "beach", "creek", "bay", "harbor",
    "marina", "waterfront", "pier", "bridge", "canal", "pond",
    "fountain", "dam", "coast", "shore", "wharf",
  ],
  night: [], // detected by time
  city: [], // default
};

// ─── Rate Limiter ────────────────────────────────────────
let lastFetchTime = 0;
const MIN_INTERVAL = 30000; // 30 seconds

function canFetch(): boolean {
  const now = Date.now();
  if (now - lastFetchTime < MIN_INTERVAL) return false;
  lastFetchTime = now;
  return true;
}

// ─── Reverse Geocoding (Nominatim) ───────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<{
  neighborhood: string;
  allText: string;
}> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
      {
        headers: {
          "User-Agent": "WanderScore/1.0 (https://wanderscore.app)",
        },
      }
    );

    if (!res.ok) return { neighborhood: "", allText: "" };

    const data = await res.json();
    const addr = data.address || {};

    const neighborhood =
      addr.neighbourhood || addr.suburb || addr.quarter ||
      addr.city_district || addr.town || addr.city || "";

    // Collect all text for keyword matching
    const allText = [
      data.display_name || "",
      neighborhood,
      addr.road || "",
      addr.suburb || "",
      addr.neighbourhood || "",
      addr.quarter || "",
      addr.city_district || "",
    ].join(" ").toLowerCase();

    return { neighborhood, allText };
  } catch {
    return { neighborhood: "", allText: "" };
  }
}

// ─── Nearby POIs (Overpass) ──────────────────────────────
async function fetchNearbyPOIs(lat: number, lng: number): Promise<string[]> {
  try {
    const radius = 250; // meters
    const query = `[out:json][timeout:10];(
      node(around:${radius},${lat},${lng})["amenity"~"restaurant|cafe|place_of_worship|bar|pub"];
      node(around:${radius},${lat},${lng})["cuisine"];
      node(around:${radius},${lat},${lng})["natural"];
      node(around:${radius},${lat},${lng})["leisure"~"park|garden|nature_reserve"];
      way(around:${radius},${lat},${lng})["natural"~"water|wood|tree"];
      way(around:${radius},${lat},${lng})["leisure"~"park|garden"];
      way(around:${radius},${lat},${lng})["waterway"];
    );out tags;`;

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const features: string[] = [];

    for (const el of data.elements || []) {
      const tags = el.tags || {};
      if (tags.cuisine) features.push(tags.cuisine.toLowerCase());
      if (tags.amenity) features.push(tags.amenity.toLowerCase());
      if (tags.religion) features.push(tags.religion.toLowerCase());
      if (tags.natural) features.push(tags.natural.toLowerCase());
      if (tags.leisure) features.push(tags.leisure.toLowerCase());
      if (tags.waterway) features.push("water");
      if (tags.name) features.push(tags.name.toLowerCase());
    }

    return Array.from(new Set(features));
  } catch {
    return [];
  }
}

// ─── Keyword Matching ────────────────────────────────────
function detectCulture(text: string, features: string[]): { culture: CultureType; confidence: number } {
  const combined = `${text} ${features.join(" ")}`.toLowerCase();

  let bestCulture: CultureType = "western";
  let bestScore = 0;

  for (const [culture, keywords] of Object.entries(CULTURE_KEYWORDS)) {
    if (keywords.length === 0) continue;
    let score = 0;
    for (const keyword of keywords) {
      if (combined.includes(keyword)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCulture = culture as CultureType;
    }
  }

  const confidence = Math.min(1, bestScore / 3);
  return { culture: bestCulture, confidence };
}

function detectEnvironment(text: string, features: string[]): EnvironmentType {
  const combined = `${text} ${features.join(" ")}`.toLowerCase();

  // Time-based night detection
  const hour = new Date().getHours();
  if (hour >= 21 || hour < 5) return "night";

  // Feature-based detection
  for (const [env, keywords] of Object.entries(ENV_KEYWORDS)) {
    if (keywords.length === 0) continue;
    for (const keyword of keywords) {
      if (combined.includes(keyword)) return env as EnvironmentType;
    }
  }

  return "city";
}

// ─── Main Function ───────────────────────────────────────
export async function getLocationContext(
  lat: number,
  lng: number
): Promise<LocationContext | null> {
  if (!canFetch()) return null;

  // Run both API calls in parallel
  const [geo, features] = await Promise.all([
    reverseGeocode(lat, lng),
    fetchNearbyPOIs(lat, lng),
  ]);

  const { culture, confidence } = detectCulture(geo.allText, features);
  const environment = detectEnvironment(geo.allText, features);

  return {
    culture,
    environment,
    neighborhood: geo.neighborhood,
    features,
    confidence,
  };
}
