const express = require("express");
const cors = require("cors");
const app = express();
const puppeteer = require("puppeteer");
require("dotenv").config();

app.use(cors());

(async () => {
  const browser = await puppeteer.launch({
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
    waitUntil: "domcontentloaded",
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
      !festival["url"].includes("edsea") &&
      !festival["url"].includes("chicago") &&
      !festival["url"].includes("mexico") &&
      !festival["url"].includes("kingdom") &&
      !festival["url"].includes("hotel")
  );

  // festivalsList.push({url: "https://www.okeechobeefest.com/lineup/", name: "Okeechobee Music & Arts Festival", image: "https://d3vhc53cl8e8km.cloudfront.net/hello-staging/wp-content/uploads/sites/61/2022/09/19095412/omf_2023_mk_an_fest_site_homepage_header_desktop_3200x1520_r01-scaled.jpg"});

  // festivalsList.push({url: "https://hijinxfest.com/artists/", name: "Hijinx Festival", image: "https://hijinxfest.com/wp-content/themes/hijinx-fest/img/fb.jpg"});

  // festivalsList.push({url: "https://duskmusicfestival.com", name: "Dusk Music Festival", image: "https://duskmusicfestival.com/wp-content/uploads/2023/06/DUSK23-Website-OnSale.png"});

  app.get("/api/festivals", async function (req, res) {
    console.log("Sent All Festivals");
    res.send(festivalsList);
  });

  festivalsList.forEach(function (festival) {
    app.get(
      "/api/festivals/".concat(festival["name"].replaceAll(" ", "")),
      async function (req, res) {
        const browser = await puppeteer.launch({
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
        await page.setRequestInterception(true);

        page.on("request", (req) => {
          if (req.resourceType() === "image") {
            req.abort();
          } else {
            req.continue();
          }
        });
        if (
          festival["url"].includes("insomniac.com") ||
          festival["url"].includes("hijinx")
        ) {
          await page.goto(festival["url"], {
            waitUntil: "domcontentloaded",
            timeout: 0,
          });
        } else {
          await page.goto(festival["url"].concat("/lineup"), {
            waitUntil: "domcontentloaded",
            timeout: 0,
          });
        }

        var lineup;
        if (festival["url"].includes("edsea")) {
          lineup = await page.evaluate(() =>
            Array.from(document.querySelectorAll(".art-link"), (e) =>
              e.textContent
                .replaceAll(
                  "\n                                \t\t\t\t\t\t\t\t",
                  ""
                )
                .replaceAll("                                ", "")
            )
          );
        } else if (festival["url"].includes("dusk")) {
          lineup = await page.evaluate(() =>
            Array.from(
              document.querySelectorAll(".artist-name"),
              (e) => e.textContent
            )
          );
        } else if (festival["url"].includes("hijinx")) {
          lineup = await page.evaluate(() =>
            Array.from(document.querySelectorAll(".artist-item-image"), (e) =>
              e.getAttribute("alt")
            )
          );
        } else if (festival["url"].includes("insomniac.com")) {
          lineup = await page.evaluate(() =>
            Array.from(
              document.querySelectorAll(".card__title"),
              (e) => e.textContent
            )
          );
        } else if (festival["url"].includes("holyship")) {
          lineup = await page.evaluate(() =>
            Array.from(
              document.querySelectorAll(".lineup-box-title h3"),
              (e) => e.textContent
            )
          );
        } else {
          lineup = await page.evaluate(() =>
            Array.from(
              document.querySelectorAll(".js-wp-template-Modal.no-barba"),
              (e) => e.textContent
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
            lineup[i].includes("True Vine + Sister System") ||
            lineup[i].includes("(DJ)") ||
            lineup[i].includes("(Drum & Bass Set)") ||
            lineup[i].includes("(FL)") ||
            lineup[i].includes("(Chee x Jon Casey)") ||
            lineup[i].includes("(Playground Set)")
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
          var normalize = (x) => (typeof x === "string" ? x.toLowerCase() : x);

          var normalizedElement = normalize(element);
          if (
            result.every(
              (otherElement) => normalize(otherElement) !== normalizedElement
            )
          )
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
