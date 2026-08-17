// Meteorological season by month (0-11), reversed for the southern hemisphere.
const NORTH_SEASONS = [
  "winter", "winter", "spring", "spring", "spring", "summer",
  "summer", "summer", "fall", "fall", "fall", "winter",
];
const FLIP = { winter: "summer", summer: "winter", spring: "fall", fall: "spring" };

function baseSeason(month, hemisphere) {
  const season = NORTH_SEASONS[month];
  return hemisphere === "north" ? season : FLIP[season];
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation isn't available on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, () => reject(new Error("Location access was denied.")), {
      timeout: 8000,
      maximumAge: 10 * 60 * 1000,
    });
  });
}

// Detects the user's current season using real temperature, not just the
// calendar: the calendar/hemisphere gives a baseline, but an unusually warm
// or cold reading nudges it toward the season that actually dresses for it.
export async function detectWeatherSeason() {
  const position = await getPosition();
  const { latitude, longitude } = position.coords;

  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`
  );
  if (!res.ok) throw new Error("Couldn't reach the weather service.");
  const data = await res.json();
  const temp = data?.current?.temperature_2m;

  const hemisphere = latitude >= 0 ? "north" : "south";
  let season = baseSeason(new Date().getMonth(), hemisphere);

  if (typeof temp === "number") {
    if (season === "winter" && temp >= 18) season = "spring";
    else if (season === "summer" && temp <= 12) season = "fall";
  }

  return { season, temp };
}
