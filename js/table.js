const getTableValue = function () {
  let html = "";
  $.ajax({
    url: "/CO2_table",
    type: "get",
  }).then(function (results) {
    for (let result of results) {
      html +=
        "<tr><td>" +
        result["time"] +
        "</td><td>" +
        result["CO2"] +
        "</td></tr>";
    }
    document.querySelector("tbody").innerHTML = html;
    setTimeout(getTableValue, 60000);
  });
};

$(document).ready(function () {
  getTableValue();
  $("#getValue").click(function () {
    $.get("./CO2_table", function (results) {
      let html = "";
      for (let result of results) {
        html +=
          "<tr><td>" +
          result["time"] +
          "</td><td>" +
          result["CO2"] +
          "</td></tr>";
      }
      alert(
        `time: ${results[0]["time"]}\nCo2 concentration (ppm): ${results[0]["CO2"]}`
      );
      document.querySelector("tbody").innerHTML = html;
    });
  });
  $("#resetValue").click(function () {
    html = "";
    document.querySelector("tbody").innerHTML = html;
  });
});
