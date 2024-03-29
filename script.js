mapboxgl.accessToken =
  "pk.eyJ1IjoibmVycGEiLCJhIjoiY2xwa2E5MDY3MDY2ZTJpbzF0bGwxbnQ5ZiJ9.blQ3oF4KIvVl68EeggiAlQ";

var long = -77.039;
var lat = 38.88;
const header = "Current location";

// Atempting to get user location for the start point of the map
navigator.geolocation.getCurrentPosition(successLocation, errorLocation, {
  enableHighAccuracy: true,
});


// If user location was recieved, this function renders map centered at the user location 
function successLocation(position) {
  long = position.coords.longitude;
  lat = position.coords.latitude;
  setupMap([long, lat]);
  renderForecast(lat, long);
}


// This function renders map and its elements
function setupMap(center) {
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
    language:'en-EN',
    mapboxgl: mapboxgl,
  });

  // Appends the search box to the "geocoder" div
  document.getElementById("geocoder").appendChild(geocoder.onAdd(map));

  map.on("load", () => {document.getElementById("h1").innerHTML = header});

  // Listen for the result event to get coordinates
  geocoder.on("result", function (event) {
    const coordinates = event.result.geometry.coordinates;
    console.log("Selected location coordinates:", coordinates);
    long = coordinates[0];
    lat = coordinates[1];
    document.getElementById("h1").innerHTML = event.result.text;
    clearForecast();
    renderForecast(lat, long);
  });
}

// If location was not recieved, this functon
function errorLocation() {
  setupMap([lat, long]);
}

// ___________________________________________________________________________________________________________________
function renderForecast(lat, long){

  let data;

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
  };

  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=uv_index,is_day&forecast_days=1`, requestOptions)
    .then((response) => response.json())
    .then((result) => renderData(result))
    .catch((error) => console.error(error));

}

function renderData(data){
  let temperature = data.current.temperature_2m + ' ' + data.current_units.temperature_2m;
  let humidity = data.current.relative_humidity_2m + ' ' + data.current_units.relative_humidity_2m;
  let pressure = data.current.pressure_msl + ' ' + data.current_units.pressure_msl;
  let clouds = data.current.cloud_cover + ' ' + data.current_units.cloud_cover;
  let wind = data.current.wind_speed_10m + ' ' + data.current_units.wind_speed_10m;
  let wind_gusts = data.current.wind_gusts_10m + ' ' + data.current_units.wind_gusts_10m;
  
  for (item of [temperature, humidity, pressure, clouds, wind, wind_gusts]){
    let elem = document.createElement('h3');
    elem.innerHTML = item;
    document.getElementById('data').appendChild(elem);
  }
}

function clearForecast(){
  document.getElementById('data').innerHTML = '';
}