document.addEventListener("DOMContentLoaded", () => {
    const searchBtn = document.getElementById("searchbtn");
    const searchInput = document.getElementById("searchinput");
    const now = new Date();
    function searchWeather() {
        const city = searchInput.value.trim();
        if (!city) {
            document.getElementById("weatherresult").innerText = "لطفا نام شهر را وارد کنید";
            return;
        }
        
        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`)
        .then(response => response.json()).then(data => {
            if(!data.results || data.results.length == 0){
                document.getElementById("weatherresult").innerText = "شهر پیدا نشد";
                return;
            }
            const place = data.results[0];
            const lat = place.latitude;
            const lon = place.longitude;
            const country = place.country;

            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,uv_index_max,uv_index_clear_sky_max&forecast_days=4&timezone=auto&hourly=temperature_2m`
            ).then(response => response.json()).then(data => {
                const times = data.hourly.time;
                const hours = times.slice(0, 24).map(t => new Date(t).getHours() + ":00");
                const temps = data.hourly.temperature_2m;
                const currentWeather = data.current;
                const weathercode = currentWeather.weather_code;
                const temp = Math.round(currentWeather.temperature_2m);
                const realfeel = currentWeather.apparent_temperature;
                const wind = currentWeather.wind_speed_10m;
                const uv_index = data.daily.uv_index_max[0]; 
                const rain_chance = data.daily.precipitation_probability_max[0];
                const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const months = ["Jan", "Feb" ,"Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const dayName = days[now.getDay()];
                const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
                
                const weatherS = getWeatherStatus(weathercode);
                document.getElementById("weather-status").innerText = weatherS.name;
                document.getElementById("status-pic").setAttribute("src", weatherS.pic);
                document.getElementById("date").innerText = `${dayName} | ${dateStr}`;
                document.getElementById("temp").innerText = `${temp}°C`;

                
                let forecastHTML = "<h2>4-Day Forecast</h2><div class='forecast-container'>";
                
                for (let i = 0; i < 4; i++) {
                    const forecastDate = new Date(data.daily.time[i]);
                    const dayName = days[forecastDate.getDay()];
                    const maxTemp = Math.round(data.daily.temperature_2m_max[i]);
                    const minTemp = Math.round(data.daily.temperature_2m_min[i]);
                    const weatherCode = data.daily.weather_code[i];
                    const desc = getWeatherStatus(weatherCode);
                    
                    forecastHTML += `
                        <div class="day-card">
                            <p class="day-name">${dayName}</p>
                            <img src="${desc.pic}" alt="${desc.name}" class="weather-icon">
                            <p class="temp-range">${maxTemp}°/${minTemp}°</p>
                        </div>
                    `;
                }
                
                forecastHTML += "</div>";
                document.getElementById("forecast").innerHTML = forecastHTML;

                document.getElementById("airconditions").innerHTML = `
                <h2>Air Conditions</h2>
                <div style="display: grid; grid-template-columns: 2fr 2fr;">
                <div style="display: flex; flex-direction: row; margin: 5px">
                    <img src="assets/feel.svg" height="60px" width="60px">
                    <div style="display:flex; flex-direction: column; justify-content: center;">
                    <span>RealFeel</span>
                    <span>${realfeel}°</span>
                    </div>
                </div>
                <div style="display: flex; flex-direction: row; margin: 5px;">
                    <img src="assets/wind.svg" height="60px" width="60px">
                    <div style="display:flex; flex-direction: column;">
                    <span>Wind</span>
                    <span>${wind} km/h</span>
                    </div>
                </div>
                </div>
                <div style="display: grid; grid-template-columns: 2fr 2fr;">
                <div style="display: flex; flex-direction: row; margin: 5px">
                    <img src="assets/rain.svg" height="60px" width="60px">
                    <div style="display:flex; flex-direction: column;">
                    <span>Rain Chance</span>
                    <span>${rain_chance}%</span>
                    </div>
                </div>
                <div style="display: flex; flex-direction: row; margin: 5px;">
                    <img src="assets/uv.svg" height="60px" width="60px">
                    <div style="display:flex; flex-direction: column;">
                    <span>UV Index</span>
                    <span>${uv_index}</span>
                    </div>
                </div>
                </div>

                `;
                const ctx = document.getElementById('chart').getContext('2d');
                
                
                if (window.tempChart) {
                    window.tempChart.destroy();
                }
                
                
                window.tempChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: hours,
                        datasets: [{
                            label: '',
                            data: temps,
                            borderColor: "#25232A",
                            borderWidth: 2,
                            tension: 0.3, 
                            fill: false
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        height: 500,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                suggestedMin: 0,
                                suggestedMax: 40,
                                ticks: {
                                    stepSize: 20,  
                                    callback: value => value + "°C"
                                },
                                grid: {
                                    display: true,
                                    drawBorder: true,
                                    drawOnChartArea: true
                                }
                            }
                        }
                    }
                });
                
                // Make sure the chart container has a defined height
                document.getElementById('chart').style.height = '500px';

            }).catch(err => {
                document.getElementById("weatherresult").innerText = "خطا در دریافت اطلاعات";
                console.error(err);
            });
        }).catch(err => {
            document.getElementById("weatherresult").innerText = "خطا در جستجوی شهر";
            console.error(err);
        });
    }
    function getWeatherStatus(code) {
        if (code === 0) {
            return { name: "Clear", pic: "assets/weather/clear-day.svg" };
        }
        if (code === 1) {
            return { name: "Partly Cloudy", pic: "assets/weather/partly-cloudy-day.svg" };
        }
        if ([2, 3].includes(code)) {
            return { name: "Cloudy", pic: "assets/weather/cloudy.svg" };
        }
        if ([45, 48].includes(code)) {
            return { name: "Fog", pic: "assets/weather/fog.svg" };
        }
        if (code >= 51 && code <= 67) {
            return { name: "Rain", pic: "assets/weather/showers.svg" };
        }
        if (code >= 71 && code <= 77) {
            return { name: "Snow", pic: "assets/weather/snow.svg" };
        }
        if (code >= 80 && code <= 82) {
            return { name: "Heavy Rain", pic: "assets/weather/heavy-sleet.svg" };
        }
        if (code >= 95) {
            return { name: "Thunder Storm", pic: "assets/weather/thunderstorm-showers.svg" };
        }
        return { name: "Unknown", pic: "assets/weather/clear-day.svg" };
    }

    searchBtn.addEventListener("click", searchWeather);
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            searchWeather();
        }
    });
});