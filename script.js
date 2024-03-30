var long = -77.039;
var lat = 38.88;
const header = "Current location";

function checkURL() {
  // Check if this page needs a map
  let urlList = document.URL.split("/");
  if (urlList[urlList.length - 1] === "14days.html") {
    fullForecast(lat, long);
  } else {
    startMap();
  }
}

checkURL();

function startMap() {
  // Atempting to get user location for the start point of the map
  mapboxgl.accessToken =
    "pk.eyJ1IjoibmVycGEiLCJhIjoiY2xwa2E5MDY3MDY2ZTJpbzF0bGwxbnQ5ZiJ9.blQ3oF4KIvVl68EeggiAlQ";
    console.log(localStorage.getItem("lat"));
    if(localStorage.getItem("lat") & localStorage.getItem("long")){
      lat = parseFloat(localStorage.getItem("lat"));
      long = parseFloat(localStorage.getItem("long"));
      console.log(lat, long);
      setupMap([long, lat]);
      link = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,cloud_cover,pressure_msl,wind_speed_10m,wind_gusts_10m&forecast_days=1`
      renderForecast(lat, long, renderCurrentData, link);
    } else {
      navigator.geolocation.getCurrentPosition(successLocation, errorLocation, {
        enableHighAccuracy: true,
      });
    }
}
function successLocation(position) {
  // If user location was recieved, this function renders map centered at the user location
  long = position.coords.longitude;
  localStorage.setItem("long", long);
  lat = position.coords.latitude;
  localStorage.setItem("lat", lat);
  setupMap([long, lat]);
  link = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,cloud_cover,pressure_msl,wind_speed_10m,wind_gusts_10m&forecast_days=1`
  renderForecast(lat, long, renderCurrentData, link);
}

function setupMap(center) {
  // This function renders map and its elements

  //  Renders map
  const map = new mapboxgl.Map({
    container: "map", // container ID
    style: "mapbox://styles/mapbox/streets-v11", // style URL
    center: center,
    zoom: 12, // starting zoom
  });

  // Adds navigation controls
  const navigation = new mapboxgl.NavigationControl();
  map.addControl(navigation);

  // Adds searchbox
  const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    language: "en-EN",
    mapboxgl: mapboxgl,
  });

  // Appends the search box to the "geocoder" div
  document.getElementById("geocoder").appendChild(geocoder.onAdd(map));

  map.on("load", () => {
    document.getElementById("h1").innerHTML = header;
    document.getElementById("labels-current").removeAttribute("hidden");
  });

  // Listen for the result event to get coordinates
  geocoder.on("result", function (event) {
    const coordinates = event.result.geometry.coordinates;
    console.log("Selected location coordinates:", coordinates);
    long = coordinates[0];
    localStorage.setItem("long", long);
    lat = coordinates[1];
    localStorage.setItem("lat", lat);

    document.getElementById("h1").innerHTML = event.result.text;
    clearForecast();
    link = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,cloud_cover,pressure_msl,wind_speed_10m,wind_gusts_10m&forecast_days=1`
    renderForecast(lat, long, renderCurrentData, link);  });
}

// If location was not recieved, this functon
function errorLocation() {
  setupMap([long, lat]);
}

function renderForecast(lat, long, callback, link) {
  console.log(lat);
  console.log(long);
  console.log(link);

  let data;

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  fetch(link, requestOptions)
    .then((response) => response.json())
    .then((result) => callback(result))
    .catch((error) => console.error(error));
}

function renderCurrentData(data) {
  for (i in data.current) {
    if (!["time", "interval", "is_day"].includes(i)) {
      console.log(i, data.current[i], data.current_units[i]);
      let elem = document.createElement("h3");
      elem.innerHTML = data.current[i] + " " + data.current_units[i];
      elem.className = "data-unit";
      document.getElementById("data").appendChild(elem);
    }
  }
}

function renderFullData(data) {
  console.log(data);
  let labelList = [
    "time",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
    "wind_speed_10m_max",
    "wind_gusts_10m_max",
  ];
  for (label of labelList) {
    for (i of data.daily[label]) {
      let elem = document.createElement("li");
      elem.innerHTML = i + " " + data.daily_units[label];
      elem.className = "data-unit";
      document.getElementById(label).appendChild(elem);
    }
  }
}

function clearForecast() {
  document.getElementById("data").innerHTML = "";
}

function fullForecast() {
  lat = parseFloat(localStorage.getItem("lat"));
  long = parseFloat(localStorage.getItem("long"));
  link = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&hourly=is_day&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max&forecast_days=14`;
  renderForecast(lat, long, renderFullData, link);
}
