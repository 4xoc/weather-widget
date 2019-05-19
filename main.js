var baseUrl = "https://api.openweathermap.org/data/2.5/";
var refresh = 300;
var apiKey = "";
var zipCode = "";
var dwdRegionName = "";
var today = new Date();

window.addEventListener('message', function(event) {
  apiKey = event.data.value.apiKey;
  zipCode = event.data.value.zip;
  refresh = event.data.value.refresh;
  dwdRegionName = event.data.value.dwdRegionName;

  update();
}, false);

function update() {
  today = new Date();

  getCurrent();
  getForecast();
  getWeatherWarnings();

  if (refresh > 0) {
    window.setTimeout(update, refresh * 1000);
  }
}

// getWeatherWarnings updates the `now_warning` element with existing weather warnings
//
// official weather warnings from DWD
// source: https://www.dwd.de/DWD/warnungen/warnapp/json/warnings.json
async function getWeatherWarnings() {
  var request = new XMLHttpRequest()
  // DWD doesn't set allowed origins in response; workaround is using "cors-anywhere.heokuapp.com"
  request.open('GET', "https://cors-anywhere.herokuapp.com/https://www.dwd.de/DWD/warnungen/warnapp/json/warnings.json", true);
  request.setRequestHeader("x-requested-with", 'foo');
  request.onload = function () {
    // returned data JSONP, but only JSON is needed
    var data = JSON.parse(this.response.substr(24,this.response.length-26));
    var warnings = new Array();

    for (var id in data.warnings) {
      if (data.warnings[id][0].regionName == dwdRegionName) {
        // warning matches required region
        end = new Date(data.warnings[id][0].end);

        if (end.getTime() > today.getTime()) {
          // warning is still valid

          // prepare data
          var warning = {};
          warning["level"] = data.warnings[id][0].level - 1; // starting with level 1 and not 2
          warning["description"] = data.warnings[id][0].description;
          warning["note"] = data.warnings[id][0].event.charAt(0) + data.warnings[id][0].event.slice(1).toLowerCase();

          // TODO: this list is most likely incomplete as there is no documentation about all possible values
          if (data.warnings[id][0].event == "FROST" ||
            data.warnings[id][0].event == "GLÄTTE") {
            warning["icon"] = "wi-snowflake-cold";

          } else if (data.warnings[id][0].event.includes("GEWITTER")) {
            warning["icon"] = "wi-thunderstorm";

          } else if (data.warnings[id][0].event.includes("LEICHTER SCHNEEFALL")) {
            warning["icon"] = "wi-snow";

          } else if (data.warnings[id][0].event.includes("BÖEN") ||
            data.warnings[id][0].event.includes("WIND")) {
            warning["icon"] = "wi-strong-wind";
          }

          // add warning to list
          warnings[warnings.length] = warning;
        }
      }
    }

    if (warnings.length == 0) {
      document.getElementById("now_warning").classList.add("wi-na"); // default is n/a until updated further down
      document.getElementById("now_warning_note").innerHTML = "no warnings";
      return;
    }

    // TODO: add support for multiple warnings
    for (var i in warnings) {
      document.getElementById("now_warning").classList.add("level" + warnings[i].level);
      document.getElementById("now_warning_note").classList.add("level" + warnings[i].level);
      document.getElementById("now_warning").classList.remove("wi-na");
      document.getElementById("now_warning").classList.add(warnings[i].icon);
      document.getElementById("now_warning_note").innerHTML = warnings[i].note;
      document.getElementById("now_warning").parentNode.setAttribute("title", warnings[i].description);
    }
  }

  request.send();
}

// getUVIndex takes given latitude and longitude values and sets the `detail_uv` element to the current UV index value
async function getUVIndex(lat,lon) {
  var request = new XMLHttpRequest()
  request.open('GET', baseUrl+'uvi?lat='+lat+'&lon='+lon+'&APPID='+apiKey, true);
  request.onload = function () {
    var data = JSON.parse(this.response)

    if (data.value < 3) {
      var color = "low";
    } else if (data.value >= 3 && data.value < 6) {
      var color = "medium";
    } else if (data.value >= 6 && data.value < 8) {
      var color = "high";
    } else if (data.value >= 8 && data.value < 10) {
      var color = "very-high";
    } else {
      var color = "extremely-high";
    }

    document.getElementById("detail_uv").innerHTML = '<span class="uv-'+color+'">'+data.value+'</span>';
  }

  request.send();
}

async function getCurrent() {
  var request = new XMLHttpRequest()
  request.open('GET', baseUrl+'weather?units=metric&zip='+zipCode+'&APPID='+apiKey, true);
  request.onload = function () {
    var data = JSON.parse(this.response)

    getUVIndex(data.coord.lat, data.coord.lon);
  
    // header
    document.getElementById("location").innerHTML = data.name; document.getElementById("now_temp").innerHTML = parseFloat(data.main.temp).toFixed(2) + " &deg;C";
    document.getElementById("now_temp_note").innerHTML = data.weather[0].description;
    document.getElementById("now_weather").classList.add("wi-owm-" + data.weather[0].id);
  
    // details
    document.getElementById("detail_temp").innerHTML = parseFloat(data.main.temp_min).toFixed(2) + " / " +
      parseFloat(data.main.temp_max).toFixed(2) + " &deg;C";
    sunrise = new Date(data.sys.sunrise*1000);
    sunset = new Date(data.sys.sunset*1000);
    document.getElementById("detail_sun").innerHTML = sunrise.toString().slice(16,21) + " / " + sunset.toString().slice(16,21);
  
    if (data.wind.deg != undefined) {
      document.getElementById("detail_wind").innerHTML = parseFloat(data.wind.speed*3.6).toFixed(0) + " km/h <span class=\"wi wi-wind from-" + data.wind.deg.toFixed(0) + "-deg\"></span>";
    } else {
      document.getElementById("detail_wind").innerHTML = parseFloat(data.wind.speed*3.6).toFixed(0) + " km/h";
    }
    document.getElementById("detail_pressure").innerHTML = data.main.pressure + " hPa"
  
    document.getElementById("detail_humid").innerHTML = data.main.humidity + " %";
    document.getElementById("detail_visibility").innerHTML = parseFloat(data.visibility/1000).toFixed(2) + " km";
  
    document.getElementById("detail_cloudiness").innerHTML = data.clouds.all + " %";
  }

  request.send();
}

// getForecast set the forecast elements
async function getForecast() {
  var request = new XMLHttpRequest()
  request.open('GET', baseUrl+'forecast?&units=metric&zip='+zipCode+'&APPID='+apiKey, true);
  request.onload = function () {
    var data = JSON.parse(this.response)

    var weekdays = new Array(7);
    weekdays[0] = "Sunday";
    weekdays[1] = "Monday";
    weekdays[2] = "Tuesday";
    weekdays[3] = "Wedesday";
    weekdays[4] = "Thursday";
    weekdays[5] = "Friday";
    weekdays[6] = "Saturday";
    var index = 0;

    for (i=0;i<data.cnt;i++) {
      var day = new Date(data.list[i].dt*1000);

      if (day.getDay() == today.getDay() || index > 1) {
        // only do forcast for future 2 days
        continue;
      }

      if (day.getUTCHours() != 6 && day.getUTCHours() != 12 && day.getUTCHours() != 18) {
        // only for 6:00, 12:00 and 18:00
        continue;
      }

      if (day.getUTCHours() == 6) {
        segment = 0;
      } else if (day.getUTCHours() == 12) {
        segment = 1;
      } else {
        segment = 2;
      }

      document.getElementById("forecast"+index+"_title").innerHTML = weekdays[day.getDay()];
      document.getElementById("forecast"+index+"_title").parentNode.setAttribute("title", weekdays[day.getDay()]);
      document.getElementById("forecast"+index+segment+"_icon").classList.add("wi-owm-" + data.list[i].weather[0].id);
      document.getElementById("forecast"+index+segment+"_icon").setAttribute("title",data.list[i].weather[0].description);
      document.getElementById("forecast"+index+segment+"_note").innerHTML = data.list[i].weather[0].description;
      document.getElementById("forecast"+index+segment+"_temp").innerHTML = parseFloat(data.list[i].main.temp).toFixed(0) + " &deg;C";
      document.getElementById("forecast"+index+segment+"_wind").innerHTML = parseFloat(data.list[i].wind.speed*3.6).toFixed(0) + " km/h <span class=\"wi wi-wind from-" + data.list[i].wind.deg.toFixed(0) + "-deg\"></span>";

      if (data.list[i].rain != undefined) {
        document.getElementById("forecast"+index+segment+"_rain").innerHTML = parseFloat(data.list[i].rain["3h"]).toFixed(2) + " mm";
      } else {
        document.getElementById("forecast"+index+segment+"_rain").innerHTML = "0 mm";
      }

      if (segment == 2) {
        index++;
      }
    }
  }

  request.send();
}
