const fs = require("fs");

const info = {
  buildDate: new Date().toLocaleString("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
}),

};

fs.writeFileSync("public/build-info.json", JSON.stringify(info, null, 2));
console.log("Build info written:", info.buildDate);