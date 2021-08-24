const express = require("express");
require("dotenv").config();
const mqtt = require("mqtt");
const mysql = require("mysql");
const path = require("path");
const date = require("date-and-time");
// for session
const session = require("express-session");
// for encrypt the password
const bcrypt = require("bcrypt");
const saltRounds = 10;

// for mailing
const nodemailer = require("nodemailer");

let tranporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const app = express();
const mysql_connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_SECRET,
  database: process.env.MYSQL_DATABASE,
});

function requireLogin(req, res, next) {
  if (req.session.loggedin == true) {
    next(); // allow the next route to run
  } else {
    // require the user to log in
    res.redirect("/login"); // or render a form, etc.
  }
}

app.use(express.static("css"));
app.use(express.static("html"));
app.use(express.static("js"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);
/**
 * @function requiereLogin
 */
app.all("/api/*", requireLogin, (req, res, next) => {
  next();
});

app.get("/", (req, res) => {
  return res.sendFile(path.resolve(__dirname, "./html/index.html"));
});

app.get("/CO2_table", (req, res) => {
  let sql = `SELECT * FROM CO2_test ORDER BY time DESC LIMIT 10`;
  mysql_connection.query(sql, (err, results) => {
    if (err) throw err;
    for (let result of results) {
      result["time"] = date.format(
        new Date(result["time"]),
        "D-MMM-YYYY HH:mm"
      );
    }
    return res.json(results);
    let datetime = new Date(result[0]["time"]);
    return res.json({
      time: date.format(datetime, "D-MMM-YYYY HH:mm"),
      CO2: result[0]["CO2"],
    });
  });
});

app.post("/CO2_query", (req, res) => {
  let sql;
  if (req.body["timeInterval"] == "1-hour") {
    sql = `SELECT * FROM CO2_test WHERE time > date_sub(date_add(now(), interval 8 hour),interval 1 hour)`;
  } else if (req.body["timeInterval"] == "5-hours") {
    sql = `SELECT * FROM CO2_test WHERE time > date_sub(date_add(now(), interval 8 hour),interval 5 hour)`;
  } else if (req.body["timeInterval"] == "10-hours") {
    sql = `SELECT * FROM CO2_test WHERE time > date_sub(date_add(now(), interval 8 hour),interval 10 hour)`;
  } else {
    sql = `SELECT * FROM CO2_test WHERE time > date_sub(date_add(now(), interval 8 hour),interval 1 day)`;
  }
  mysql_connection.query(sql, (err, results) => {
    if (err) throw err;
    for (let result of results) {
      result["time"] = date.format(
        new Date(result["time"]),
        "YYYY-MM-DDTHH:mm:ss"
      );
    }

    return res.json(results);
  });
});

app.get("/login", (req, res) => {
  return res.sendFile(path.resolve(__dirname, "./html/login.html"));
});

app.post("/login", async (req, res) => {
  mysql_connection.query(
    "SELECT * FROM users WHERE email = ?",
    [req.body["email"]],
    (err, result) => {
      if (err) throw err;
      else if (result.length == 0) {
        return res.end("the email is not register yet");
      }
      bcrypt.compare(
        req.body["password"],
        result[0]["password"],
        (err, same) => {
          if (err) throw err;
          else if (same == false) {
            return res.end("wrong password");
          } else {
            req.session.loggedin = true;
            req.session.user_email = result[0]["email"];
            console.log(req.session.loggedin);
            return res.redirect("/");
          }
        }
      );
    }
  );
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
  });
  return res.redirect("/");
});

app.get("/register", (req, res) => {
  return res.redirect("/register");
});

app.post("/register", (req, res) => {
  let sql = "INSERT INTO users (email, password) VALUE (?, ?)";
  if (req.body["password"] !== req.body["confirm-password"]) {
    return res.end("please confirm that the password is the same");
  }
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    mysql_connection.query(
      sql,
      [req.body["email"], hash],
      function (err, result) {
        if (err) throw err;
        mysql_connection.query(
          "SELECT * FROM `users` WHERE `email` = ?",
          [req.body["email"]],
          function (err, result) {
            if (err) throw err;
            // set session !
            req.session.user_id = result[0]["id"];
          }
        );
      }
    );
  });

  return res.redirect("/");
});

app.get("/api/mail", (req, res) => {
  let sendMail = function (co2ppm) {
    let mailOptions = {
      from: "angchihang2000@gmail.com",
      to: req.session.user_email,
      subject: "Nodemailer - Test",
      text: `CO2 in room in past 30 minutes is ${Math.round(co2ppm)} ppm !!`,
    };
    tranporter.sendMail(mailOptions, (err, info) => {
      if (err) throw err;
      console.log("mail send!");
    });
  };
  let query =
    "SELECT CO2 FROM CO2_test WHERE time > date_sub(date_add(now(), interval 8 hour),interval 30 minute)";
  mysql_connection.query(query, (err, results) => {
    if (err) throw err;
    let sum = 0;
    for (let result of results) {
      sum += result["CO2"];
    }
    let average = sum / results.length;
    console.log(average);
    if (average > 2000) {
      sendMail(average);
    }
  });
  return res.send("ok");
});

app.get("/apology", (req, res) => {
  return res.sendFile(path.resolve(__dirname, "./html/apology.html"));
});

app.listen(3000, () => {
  console.log("listensing to port 3000...");
});
