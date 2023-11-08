const express = require("express");
const cors = require("cors");
const app = express();
const puppeteer = require("puppeteer");
require("dotenv").config();

app.use(cors());

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    userDataDir: "./cache",
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
      "--disable-dev-shm-usage",
      "--disable-gpu",
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

  await browser.close();

  const festivalsList = allFestivals.filter(
    (festival) =>
      !festival["url"].includes("insomniac") &&
      !festival["url"].includes("mexico") &&
      !festival["url"].includes("hotel")
  );

  app.get("/api/festivals", async function (req, res) {
    console.log("Sent All Festivals");
    res.send(festivalsList);
  });

  festivalsList.forEach(function (festival) {
    app.get(
      "/api/festivals/".concat(festival["name"].replaceAll(" ", "")),
      async function (req, res) {
        const browser = await puppeteer.launch({
          headless: "new",
          userDataDir: "./cache",
          args: [
            "--disable-setuid-sandbox",
            "--no-sandbox",
            "--single-process",
            "--no-zygote",
            "--disable-dev-shm-usage",
            "--disable-gpu",
          ],
          executablePath:
            process.env.NODE_ENV === "production"
              ? process.env.PUPPETEER_EXECUTABLE_PATH
              : puppeteer.executablePath(),
        });
        const page = await browser.newPage();
        await page.goto(festival["url"].concat("/lineup"), { timeout: 0 });
        var lineup;
        if (festival["url"].includes("edsea")) {
          lineup = await page.evaluate(() =>
          Array.from(
              document.querySelectorAll(".art-link"), (e) => e.textContent.replaceAll("\n                                \t\t\t\t\t\t\t\t", "").replaceAll("                                ", "")
            )
          );
        } else if (festival["url"].includes("holyship")) {
          lineup = await page.evaluate(() =>
          Array.from(
              document.querySelectorAll(".lineup-box-title h3"), (e) => e.textContent
            )
          );
        } else {
          lineup = await page.evaluate(() =>
          Array.from(
              document.querySelectorAll(".js-wp-template-Modal.no-barba"), (e) => e.textContent
            )
          );
        }
        

        await browser.close();

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
            lineup[i].includes("True Vine + Sister System") || lineup[i].includes("(DJ)")
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
          if (lineup[i].includes(" Presents: ")) {
            lineup[i] = lineup[i].substring(
              0,
              lineup[i].indexOf(" Presents: ")
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

        const lineupNoDupe = lineup.reduce((result, element) => {
          var normalize = x => typeof x === 'string' ? x.toLowerCase() : x;
      
          var normalizedElement = normalize(element);
          if (result.every(otherElement => normalize(otherElement) !== normalizedElement))
            result.push(element);
      
          return result;
        }, []);
        lineupNoDupe.sort(function (a, b) {
          return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
        });

        console.log("Sent Lineup");
        res.send(lineupNoDupe);
      }
    );
  });
})();

app.listen(5000, function () {
  console.log("Running on port 5000.");
});
