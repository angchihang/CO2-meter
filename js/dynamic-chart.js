$(document).ready(function () {
  var warningValue = 1000,
    dangerousValue = 2500;
  var myChart, chart;
  var default_chart = setInterval(function () {
    $.ajax({
      url: "/CO2_query",
      type: "post",
      data: {
        timeInterval: "1-hour",
      },
      success: function (results) {
        if (myChart !== undefined) {
          myChart.destroy();
        }
        var xValues = [];
        var yValues = [];
        for (let result of results) {
          xValues.push(result.time);
          yValues.push(result.CO2);
        }
        let backgroundColor = [];
        for (let yValue of yValues) {
          if (yValue < warningValue) {
            backgroundColor.push("#29C758");
          } else if (yValue > warningValue && yValue < dangerousValue) {
            // 99ff99 => green;
            backgroundColor.push("#F9B43E");
          } else {
            backgroundColor.push("rgba(0,0,255,1)");
          }
        }
        myChart = new Chart("myChart", {
          type: "line",
          data: {
            labels: xValues,
            datasets: [
              {
                fill: false,
                lineTension: 0,
                backgroundColor: backgroundColor,
                borderColor: "rgba(0,0,255,0.1)",
                data: yValues,
              },
            ],
          },
          options: {
            legend: { display: false },
            scales: {
              yAxes: [{ ticks: { min: 0, max: 4000 } }],
              xAxes: [{ ticks: { padding: 5, backdropPadding: 5 } }],
            },
            layout: {
              padding: 10,
            },
            animation: false,

            title: {
              display: true,
              text: "CO2 ppm in my room",
            },
          },
        });
      },
    });
  }, 5000);

  $("#time-query").change(function () {
    var new_chart;

    clearInterval(default_chart);
    if (chart !== undefined) {
      chart.destroy();
    }
    if (new_chart !== undefined) {
      clearInterval(new_chart);
    }

    new_chart = setInterval(function () {
      if (chart !== undefined) {
        chart.destroy();
        console.log("ok");
      } else {
        console.log("no");
      }
      $.ajax({
        url: "/CO2_query",
        type: "post",
        data: {
          timeInterval: $("#time-query").val(),
        },
        success: function (results) {
          var xValues = [];
          var yValues = [];
          for (let result of results) {
            xValues.push(result.time);
            yValues.push(result.CO2);
          }
          let backgroundColor = [];
          for (let yValue of yValues) {
            if (yValue < warningValue) {
              backgroundColor.push("#29C758");
            } else if (yValue > warningValue && yValue < dangerousValue) {
              // 99ff99 => green;
              backgroundColor.push("#F9B43E");
            } else {
              backgroundColor.push("rgba(0,0,255,1)");
            }
          }
          let config = {
            type: "line",
            data: {
              datasets: [
                {
                  data: results,
                  parsing: {
                    xAxisKey: "time",
                    yAxisKey: "CO2",
                  },
                },
              ],
            },
            options: {
              legend: { display: false },

              scales: {
                xAxes: {
                  type: "time",
                  time: {
                    unit: "hour",
                  },
                },
                yAxes: [
                  {
                    beginAtZero: true,
                  },
                ],
              },
              animation: false,
              title: {
                display: true,
                text: "CO2 ppm in my room",
              },
            },
          };
          var place = document.getElementById("myChart");
          chart = new Chart(place, config);
        },
      });
    }, 1000);
  });
});
