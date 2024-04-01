// Initial latitude and longitude values
var long = -77.039;
var lat = 38.88;
// Default header text
const header = "Current location";

/**
 * Function to check the URL and determine which function to call based on the last part of the URL.
 */
function checkURL() {
  // Split the URL to check the last part
  let urlList = document.URL.split("/");

  // If the last part is "14days.html", call the fullForecast function
  if (urlList[urlList.length - 1] === "14days.html") {
    fullForecast(lat, long);
  } else {
    // Otherwise, call the startMap function
    startMap();
  }
}

// Check the URL when the page loads
checkURL();

/**
 * Function to start the map rendering process
 */
function startMap() {
  // Set the Mapbox access token
  mapboxgl.accessToken =
    "pk.eyJ1IjoibmVycGEiLCJhIjoiY2xwa2E5MDY3MDY2ZTJpbzF0bGwxbnQ5ZiJ9.blQ3oF4KIvVl68EeggiAlQ";

  // Check if latitude and longitude are stored in localStorage
  if (localStorage.getItem("lat") & localStorage.getItem("long")) {
    // If available, retrieve the coordinates and render the map
    lat = parseFloat(localStorage.getItem("lat"));
    long = parseFloat(localStorage.getItem("long"));
    setupMap([long, lat]);
    link = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,cloud_cover,pressure_msl,wind_speed_10m,wind_gusts_10m&forecast_days=1`;
    renderForecast(lat, long, renderCurrentData, link);
    // If not, attempt to get the user's location
  } else {
    navigator.geolocation.getCurrentPosition(successLocation, errorLocation, {
      enableHighAccuracy: true,
    });
  }
}

/**
 * Function to handle successful location retrieval
 * @param {object} position - The position object containing latitude and longitude coordinates
 */
function successLocation(position) {
  // Extract longitude from position object and store it in local storage
  long = position.coords.longitude;
  localStorage.setItem("long", long);

  // Extract latitude from position object and store it in local storage
  lat = position.coords.latitude;
  localStorage.setItem("lat", lat);

  // Set up the map using the longitude and latitude coordinates
  setupMap([long, lat]);

  // Create a link for fetching weather forecast data based on latitude and longitude
  link = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,cloud_cover,pressure_msl,wind_speed_10m,wind_gusts_10m&forecast_days=1`;

  // Render the forecast data using the latitude, longitude, rendering function, and link
  renderForecast(lat, long, renderCurrentData, link);
}

/**
 * Sets up the map with specified center coordinates.
 * @param {Array} center - The center coordinates for the map.
 */
function setupMap(center) {
  // Renders a map
  const map = new mapboxgl.Map({
    container: "map", // container ID
    style: "mapbox://styles/mapbox/streets-v11", // style URL
    center: center, // map center coordinates
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

  // Event listener for changing header and revealing contents after a map loads
  map.on("load", () => {
    // Set the inner HTML of the element with id "h1" to the value of the variable "header"
    document.getElementById("h1").innerHTML = header;
    // Remove the "hidden" attribute from the element with id "labels-current"
    document.getElementById("labels-current").removeAttribute("hidden");
  });

  // Listens for the result event to get coordinates of a newly searched location
  geocoder.on("result", function (event) {
    const coordinates = event.result.geometry.coordinates;
    long = coordinates[0];
    localStorage.setItem("long", long);
    lat = coordinates[1];
    localStorage.setItem("lat", lat);
    // Renders a newly searched location name
    document.getElementById("h1").innerHTML = event.result.text;
    // Clears the previous forecast
    clearForecast();
    // Link with API query for data needed for current forecast rendering
    link = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,cloud_cover,pressure_msl,wind_speed_10m,wind_gusts_10m&forecast_days=1`;
    // Fetches and renders data for a newly searched location
    renderForecast(lat, long, renderCurrentData, link);
  });
}

/**
 * Function that sets up the map with a given longitude and latitude.
 * @param {Array} coordinates - An array containing the longitude and latitude values.
 */
function errorLocation() {
  setupMap([long, lat]);
}
/**
 * Function to render forecast data based on latitude and longitude coordinates
 * @param {number} lat - Latitude coordinate
 * @param {number} long - Longitude coordinate
 * @param {function} callback - Callback function to handle the fetched data
 * @param {string} link - API link to fetch the data from
 */
function renderForecast(lat, long, callback, link) {
  let data;

  // Fetch data from the API...
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  fetch(link, requestOptions)
    .then((response) => {
      if (!response.ok) {
        // If response is not successful, throw an error
        throw new Error("Failed to fetch data");
      }
      return response.json();
    })
    .then((result) => callback(result))
    .catch((error) => console.error(error));
}

/**
 * Renders the current data on the webpage.
 * @param {object} data - The data object containing current data values.
 */
function renderCurrentData(data) {
  for (i in data.current) {
    if (!["time", "interval", "is_day"].includes(i)) {
      let elem = document.createElement("h3");
      elem.innerHTML = data.current[i] + " " + data.current_units[i];
      elem.className = "data-unit";
      document.getElementById("data").appendChild(elem);
    }
  }
}

// Function to render full data
function renderFullData(data) {
  // List of labels for data
  let labelList = [
    "time",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
    "wind_speed_10m_max",
    "wind_gusts_10m_max",
  ];
  // Initialize unit variable
  let unit = "";

  // Loop through each label in the labelList
  for (label of labelList) {
    // Check if the label is not 'time' to get the unit from daily_units
    if (label !== "time") {
      unit = data.daily_units[label];
    }

    // Loop through each data point for the current label
    for (i of data.daily[label]) {
      // Create a list element for the data point
      let elem = document.createElement("li");
      // Set the innerHTML of the element to include the data point and unit
      elem.innerHTML = i + " " + unit;
      // Add a class to the element
      elem.className = "data-unit-1";
      // Append the element to the corresponding label element in the HTML
      document.getElementById(label).appendChild(elem);
    }
  }
}

/**
 * Function to clear the forecast data displayed on the webpage.
 */
function clearForecast() {
  document.getElementById("data").innerHTML = "";
}

/**
 * Retrieves the latitude and longitude from local storage and generates a link to fetch weather forecast data.
 * Calls the renderForecast function to render the forecast data on the webpage.
 */
function fullForecast() {
  lat = parseFloat(localStorage.getItem("lat"));
  long = parseFloat(localStorage.getItem("long"));
  link = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&hourly=is_day&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max&forecast_days=14`;
  renderForecast(lat, long, renderFullData, link);
}
