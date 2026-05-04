const csv = require("csvtojson");
const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "../../../../AI/dataset.csv");
const outputPath = path.join(__dirname, "dataset.json");

async function convert() {
  const jsonArray = await csv().fromFile(inputPath);

  fs.writeFileSync(outputPath, JSON.stringify(jsonArray, null, 2));

  console.log("CSV converted to JSON");
}

convert();