var apiKey = "";
var zipCode = "";
var baseUrl = "";
var refresh = 300;

window.addEventListener('message', function(event) {
  apiKey = event.data.value.key;
  zipCode = event.data.value.zip;
  baseUrl = "https://api.openweathermap.org/data/2.5/";
  refresh = event.data.value.refresh;

  update();
}, false);

function update() {
  var request = new XMLHttpRequest()
  request.open('GET', baseUrl+'weather?units=metric&zip='+zipCode+'&APPID='+apiKey, true);
  request.onload = function () {
    var data = JSON.parse(this.response)
  
    // header
    document.getElementById("location").innerHTML = data.name; document.getElementById("now_temp").innerHTML = parseFloat(data.main.temp).toFixed(2) + " &deg;C";
    document.getElementById("now_temp_note").innerHTML = data.weather[0].description;
    document.getElementById("now_weather").classList.add("wi-owm-" + data.weather[0].id);
    document.getElementById("now_warning").classList.add("wi-na"); // TODO: add warnings here
    document.getElementById("now_warning_note").innerHTML = "no warnings";
  
    // details
    document.getElementById("detail_temp").innerHTML = parseFloat(data.main.temp_min).toFixed(2) + " / " +
      parseFloat(data.main.temp_max).toFixed(2) + " &deg;C";
    sunrise = new Date(data.sys.sunrise*1000);
    sunset = new Date(data.sys.sunset*1000);
    document.getElementById("detail_sun").innerHTML = sunrise.toString().slice(16,21) + " / " + sunset.toString().slice(16,21);
  
    document.getElementById("detail_wind").innerHTML = data.wind.speed + " m/s <span class=\"wi wi-wind from-" + data.wind.deg + "-deg\"></span>";
    document.getElementById("detail_pressure").innerHTML = data.main.pressure + " hPa"
  
    document.getElementById("detail_humid").innerHTML = data.main.humidity + " %";
    document.getElementById("detail_visibility").innerHTML = parseFloat(data.visibility/1000).toFixed(2) + " km";
  
    document.getElementById("detail_cloudiness").innerHTML = data.clouds.all + " %";
  
    var request2 = new XMLHttpRequest()
    request2.open('GET', baseUrl+'uvi?lat='+data.coord.lat+'&lon='+data.coord.lon+'&APPID='+apiKey, true);
    request2.onload = function () {
      var data2 = JSON.parse(this.response)

      if (data2.value < 3) {
        var color = "low";
      } else if (data2.value >= 3 && data2.value < 6) {
        var color = "medium";
      } else if (data2.value >= 6 && data2.value < 8) {
        var color = "high";
      } else if (data2.value >= 8 && data2.value < 10) {
        var color = "very-high";
      } else {
        var color = "extremely-high";
      }

      document.getElementById("detail_uv").innerHTML = '<span class="uv-'+color+'">'+data2.value+'</span>';

      /* forecast */
      var request3 = new XMLHttpRequest()
      request3.open('GET', baseUrl+'forecast?&units=metric&zip='+zipCode+'&APPID='+apiKey, true);
      request3.onload = function () {
        var data3 = JSON.parse(this.response)

        var weekdays = new Array(7);
        weekdays[0] = "Sunday";
        weekdays[1] = "Monday";
        weekdays[2] = "Tuesday";
        weekdays[3] = "Wedesday";
        weekdays[4] = "Thursday";
        weekdays[5] = "Friday";
        weekdays[6] = "Saturday";
        var today = new Date();
        var index = 0;

        for (i=0;i<data3.cnt;i++) {
          var day = new Date(data3.list[i].dt*1000);

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
          document.getElementById("forecast"+index+segment+"_icon").classList.add("wi-owm-" + data3.list[i].weather[0].id);
          document.getElementById("forecast"+index+segment+"_icon").setAttribute("title",data3.list[i].weather[0].description);
          document.getElementById("forecast"+index+segment+"_note").innerHTML = data3.list[i].weather[0].description;
          document.getElementById("forecast"+index+segment+"_temp").innerHTML = parseFloat(data3.list[i].main.temp).toFixed(0) + " &deg;C";
          document.getElementById("forecast"+index+segment+"_wind").innerHTML = data3.list[i].wind.speed + " m/s <span class=\"wi wi-wind from-" + data3.list[i].wind.deg + "-deg\"></span>";

          if (data3.list[i].rain != undefined) {
            document.getElementById("forecast"+index+segment+"_rain").innerHTML = parseFloat(data3.list[i].rain["3h"]).toFixed(2) + " mm";
          } else {
            document.getElementById("forecast"+index+segment+"_rain").innerHTML = "0 mm";
          }

          if (segment == 2) {
            index++;
          }
        }

        if (refresh > 0) {
          window.setTimeout(update, refresh * 1000);
        }
      }

      request3.send();
    }

    request2.send();
  }

  request.send();
}
