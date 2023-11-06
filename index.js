const express = require("express");
const app = express();
const puppeteer = require("puppeteer");
require("dotenv").config();

(async () => {
  const browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
  const page = await browser.newPage();
  await page.goto("https://www.insomniac.com/events/festivals/", {
    timeout: 0,
  });

  const allFestivals = await page.evaluate(() => {
    const festivals = document.querySelectorAll(".card__img");

    return Array.from(festivals).map((festival) => {
      const url = festival.querySelector("a").href;
      const name = festival.querySelector("a").getAttribute("data-name");
      const image = festival.querySelector("a").querySelector("img").src;
      return { url, name, image };
    });
  });

  const festivalsList = allFestivals.filter(
    (festival) =>
      !festival["url"].includes("insomniac.com") &&
      !festival["url"].includes("edsea") &&
      !festival["url"].includes("holyship") &&
      !festival["url"].includes("mexico") &&
      !festival["url"].includes("hotel")
  );

  app.get("/api/festivals", async function (req, res) {
    console.log("Sent All Festivals");
    res.send(festivalsList);
  });

  await browser.close();
  festivalsList.forEach(function (festival) {
    app.get(
      "/api/festivals/".concat(festival["name"].replaceAll(" ", "")),
      async function (req, res) {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(festival["url"].concat("/lineup"), { timeout: 0 });

        const lineup = await page.evaluate(() =>
          Array.from(
            document.querySelectorAll(".js-wp-template-Modal.no-barba"),
            (e) => e.textContent
          )
        );
        for (let i = 0; i < lineup.length; i++) {
          if (
            lineup[i].includes("Sunset Set") ||
            lineup[i].includes("Live") ||
            lineup[i].includes("Laser Harp") ||
            lineup[i].includes("Tech Energy") ||
            lineup[i].includes("Detox Set") ||
            lineup[i].includes("DJ Set") ||
            lineup[i].includes("DNB") ||
            lineup[i].includes("Sunrise Set") ||
            lineup[i].includes("House Set") ||
            lineup[i].includes("Progressive House / Trance Set") ||
            lineup[i].includes("Rabbit in the Moon") ||
            lineup[i].includes("UK") ||
            lineup[i].includes("Declan James & Decoder") ||
            lineup[i].includes("DNB Set") ||
            lineup[i].includes("Throwback Set") ||
            lineup[i].includes("&ME, Rampa, Adam Port") ||
            lineup[i].includes("Hybrid") ||
            lineup[i].includes("of Miami") ||
            lineup[i].includes("True Vine + Sister System")
          ) {
            lineup[i] = lineup[i].replace(/ *\([^)]*\) */g, "");
          }
          if (lineup[i].includes(" presents ")) {
            lineup[i] = lineup[i].substring(0, lineup[i].indexOf(" presents "));
          }
          if (lineup[i].includes(" present ")) {
            lineup[i] = lineup[i].substring(0, lineup[i].indexOf(" present "));
          }
          if (lineup[i].includes(" presents: ")) {
            lineup[i] = lineup[i].substring(
              0,
              lineup[i].indexOf(" presents: ")
            );
          }
          if (lineup[i].includes(" B2B ")) {
            if (lineup[i].includes("(")) {
              lineup[i] = lineup[i].replace(/[^(]*/i, "");
              lineup[i] = lineup[i].replace("(", "");
              lineup[i] = lineup[i].replace(")", "");
            }
            let B2B = lineup[i].split(" B2B ");
            lineup[i] = B2B[0];
            for (let j = 1; j < B2B.length; j++) {
              lineup.push(B2B[j]);
            }
          }
        }

        const lineupNoDupe = [...new Set(lineup)];
        lineupNoDupe.sort(function (a, b) {
          return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
        });

        await browser.close();
        console.log("Sent Lineup");
        res.send(lineupNoDupe);
      }
    );
  });
})();

app.listen(5000, function () {
  console.log("Running on port 5000.");
});
