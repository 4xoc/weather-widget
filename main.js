window.addEventListener('message', function(event) {
  //console.log(event);
  apiKey = event.data.value.key;
  zipCode = event.data.value.zip;
  baseUrl = "https://api.openweathermap.org/data/2.5/";

  var request = new XMLHttpRequest()
  request.open('GET', baseUrl+'weather?units=metric&zip='+zipCode+'&APPID='+apiKey, true);
  request.onload = function () {
    var data = JSON.parse(this.response)
    //console.log(data);
  
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
      //console.log(data2);

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
        //console.log(data3);

        var weekdays = new Array(7);
        weekdays[0] = "Sun";
        weekdays[1] = "Mon";
        weekdays[2] = "Tue";
        weekdays[3] = "Wed";
        weekdays[4] = "Thu";
        weekdays[5] = "Fri";
        weekdays[6] = "Sat";
        var today = new Date();
        var index = 0;

        for (i=0;i<data3.cnt;i++) {
          var day = new Date(data3.list[i].dt*1000);

          //TODO: this is nice and all but doesn't work very well
          // need to add: check all forecast values and get lowest/highest temp prediction
          // need to add: check all forcast values and get best/worst weather prediction
          if (day.getUTCHours() != 12 || index >= 4) {
            //only using midday forecast for the next 4 days
            continue;
          }

          if (day.getDay() != today.getDay()) {
            // because `today` is hardcoded
            console.log(day);
            document.getElementById("forecast"+index+"_title").innerHTML = weekdays[day.getDay()];
          }

          document.getElementById("forecast"+index+"_icon").classList.add("wi-owm-" + data3.list[i].weather[0].id);
          document.getElementById("forecast"+index+"_icon").setAttribute("title",data3.list[i].weather[0].description);
          document.getElementById("forecast"+index+"_note").innerHTML = data3.list[i].weather[0].description;
          document.getElementById("forecast"+index+"_temp").innerHTML = parseFloat(data3.list[i].main.temp_min).toFixed(0) + " / " +
            parseFloat(data3.list[i].main.temp_max).toFixed(0) + " &deg;C";
          document.getElementById("forecast"+index+"_wind").innerHTML = data3.list[i].wind.speed + " m/s <span class=\"wi wi-wind from-" + data3.list[i].wind.deg + "-deg\"></span>";
          index++;
        }
      }

      request3.send();
    }

    request2.send();
  }

  request.send();
}, false);
