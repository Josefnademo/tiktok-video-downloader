import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// 1. Enable Stealth Mode
// This makes the bot look like a real human user to TikTok's security
puppeteer.use(StealthPlugin());

export async function getVideoInfo(inputUrl) {
  console.log(`[TikTok Service] Launching Browser for: ${inputUrl}`);

  let browser = null;

  try {
    // 2. Launch Headless Chrome
    // 'headless: "new"' means it runs in the background without opening a window
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // 3. Set a Real User Agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    );

    // 4. Go to the TikTok URL
    // waitUntil: 'networkidle2' means wait until the page finishes loading
    await page.goto(inputUrl, { waitUntil: "networkidle2", timeout: 60000 });

    // 5. Extract JSON Data embedded in the HTML
    // TikTok stores video info in a hidden script tag called "__UNIVERSAL_DATA_FOR_REHYDRATION__"
    // or sometimes inside a script with id "SIGI_STATE"
    const data = await page.evaluate(() => {
      // Method A: Universal Data (New TikTok layout)
      const script = document.getElementById(
        "__UNIVERSAL_DATA_FOR_REHYDRATION__"
      );
      if (script && script.textContent) {
        return JSON.parse(script.textContent);
      }

      // Method B: SIGI_STATE (Old TikTok layout)
      const sigi = document.getElementById("SIGI_STATE");
      if (sigi && sigi.textContent) {
        return JSON.parse(sigi.textContent);
      }
      return null;
    });

    if (!data) {
      throw new Error(
        "Could not extract data from page. TikTok might have shown a Captcha."
      );
    }

    // 6. Navigate the complex JSON structure to find the video details
    // The structure differs slightly depending on Method A or B, so we try to find the video list
    let videoData = null;

    if (
      data.__DEFAULT_SCOPE__ &&
      data.__DEFAULT_SCOPE__["webapp.video-detail"]
    ) {
      // Structure A
      videoData =
        data.__DEFAULT_SCOPE__["webapp.video-detail"].itemInfo.itemStruct;
    } else if (data.ItemModule) {
      // Structure B
      const videoId = Object.keys(data.ItemModule)[0];
      videoData = data.ItemModule[videoId];
    }

    if (!videoData) {
      throw new Error("Video data structure changed or not found.");
    }

    console.log(`[TikTok Service] Successfully extracted: ${videoData.id}`);

    // 7. Construct Result
    return {
      id: videoData.id,
      desc: videoData.desc || "TikTok Video",
      cover: videoData.video.cover,
      author: videoData.author.nickname,
      // Note: Direct scraping often gives the watermarked URL by default.
      // To get unwatermarked, we use the address provided in the JSON.
      url: videoData.video.playAddr,
      qualities: [
        {
          label: "Original Quality",
          url: videoData.video.playAddr,
          id: "orig",
        },
      ],
    };
  } catch (error) {
    console.error("[TikTok Service] Error:", error.message);
    throw new Error("Failed to scrape video. Please try again.");
  } finally {
    // 8. Always close the browser to save RAM
    if (browser) {
      await browser.close();
    }
  }
}
