const coloring = function (array) {
  var color = [];
  var warningValue = 1000;
  var dangerousValue = 2000;
  for (let item of array) {
    if (item <= warningValue) {
      color.push("#29C758");
    } else if (item > warningValue && item < dangerousValue) {
      color.push("#F9B43E");
    } else {
      color.push("rgba(255,0,0,1)");
    }
  }
  return color;
};

const config = {
  type: "scatter",
  data: {
    datasets: [
      {
        data: [], // Set initially to empty data
        parsing: {
          xAxisKey: "time",
          yAxisKey: "CO2",
        },
        // borderColor: "rgba(0,0,255,0.3)",
        backgroundColor: [],
        fill: false,
      },
    ],
  },
  options: {
    layout: {
      padding: 10,
    },
    scales: {
      x: {
        type: "time",
        time: { unit: "hour", round: true },
        title: {
          text: "time",
          display: true,
          padding: 10,
          font: {
            size: 15,
            family: "sans-serif",
          },
        },
      },

      y: {
        beginAtZero: true,
        max: 4000,
        title: {
          text: "CO2 ppm",
          display: true,
          padding: 10,
          font: {
            size: 15,
            family: "sans-serif",
          },
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: "CO2 ppm in my room",
        font: {
          size: 15,
          family: "sans-serif",
        },
      },
      legend: {
        display: false,
      },
    },
    animation: false,
    elements: {
      line: {
        borderColor: "rgba(0,0,255,0.1)",
      },
      point: {
        pointBorderWidth: 0,
      },
    },
  },
};

const ctx = document.getElementById("myChart");
const co2Chart = new Chart(ctx, config);

const fetchChartData = function () {
  $.ajax({
    url: "/CO2_query",
    type: "post",
    data: {
      timeInterval: $("#time-query").val(),
    },
  }).then(function (results) {
    var yValues = [];
    for (let result of results) {
      yValues.push(result.CO2);
    }
    if ($("#time-query").val() == "1-hour") {
      config.options.scales.x.time.unit = "minute";
    } else {
      config.options.scales.x.time.unit = "hour";
      config.options.scales.x.time.round = true;
    }
    config.data.datasets[0].data = results;
    config.data.datasets[0].backgroundColor = coloring(yValues);
    co2Chart.update();
    setTimeout(fetchChartData, 1000);
  });
};

$(document).ready(function () {
  fetchChartData();
});
