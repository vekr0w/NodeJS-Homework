const http = require("http");
const fs = require("fs");
const city = require("./configuration").city;
const API_KEY = require("./configuration").API_KEY;
const URL = `http://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}&aqi=no`;

exports.outputData = http
  .get(URL, (res) => {
    let outputData = "";
    const { statusCode } = res;
    let error;
    if (statusCode !== 200) {
      res.on("data", (chunk) => {
        outputData += chunk;
        updateOutputFile(outputData);
      });
      error = new Error("Request Failed.\n" + `Status Code: ${statusCode}`);
    }
    if (error) {
      console.error(error.message);
      res.resume();
    }

    res.setEncoding("utf8");
    let rawData = "";
    res.on("data", (chunk) => {
      rawData += chunk;
    });
    res.on("end", () => {
      try {
        const parsedData = JSON.parse(rawData);
        const [date, time] = parsedData.location.localtime.split(" ");
        const temp = parsedData.current.temp_c;
        let returnObject = {
          date: date,
          time: time,
          temperatureInCelcius: temp,
        };
        outputData = JSON.stringify(returnObject);
        updateOutputFile(outputData);
      } catch (e) {
        outputData = rawData;
        console.error(e.message);
      }
    });
  })
  .on("error", (e) => {
    let outputData = "";
    outputData = JSON.stringify(e);
    console.error(`Got error: ${e.message}`);
    updateOutputFile(outputData);
  });

function updateOutputFile(message) {
  console.log(message);
  fs.appendFile("output.txt", `${message}\n`, (err) => {
    if (err) throw err;
  });
}

const hostname = "localhost";
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end(outputData);
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
