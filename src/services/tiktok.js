import fetch from "node-fetch";
import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

// Маскируемся под обычный Chrome
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://www.tiktok.com/",
  "Accept-Language": "en-US,en;q=0.9",
};

export async function getVideoInfo(inputUrl) {
  console.log(`[TikTok Service] Resolving URL: ${inputUrl}`);

  // 1. Раскрываем короткую ссылку (если есть)
  const finalUrl = await resolveRedirect(inputUrl);
  console.log(`[TikTok Service] Final URL: ${finalUrl}`);

  // Извлекаем ID для имени файла
  const videoIdMatch = finalUrl.match(/\/video\/(\d+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : "unknown_id";

  // 2. Скачиваем HTML
  const response = await fetch(finalUrl, { headers: HEADERS });
  const html = await response.text();
  console.log(`[TikTok Service] HTML fetched. Length: ${html.length} chars`);

  // --- ДЕБАГ: Сохраняем HTML в файл, чтобы проверить, не пришла ли капча ---
  // Файл сохранится рядом с приложением или в Загрузках
  /* Если снова будет ошибка, найди файл "last_response.html" 
     в папке проекта и открой его в браузере.
  */
  try {
    fs.writeFileSync("last_response.html", html);
    console.log(
      "[TikTok Service] Saved HTML dump to 'last_response.html' for inspection."
    );
  } catch (e) {
    console.error("Could not save debug file", e);
  }
  // -------------------------------------------------------------------------

  // Проверка на капчу
  if (html.includes("verify-center") || html.includes("captcha")) {
    throw new Error(
      "TikTok отдал страницу с капчей (Captcha). Попробуй позже или включи VPN."
    );
  }

  // 3. ПОИСК ДАННЫХ (Стратегия 1: JSON объекты)
  let dataJson;

  // Попытка A: SIGI_STATE
  const sigiMatch = html.match(
    /<script id="SIGI_STATE" type="application\/json">(.+?)<\/script>/
  );
  // Попытка B: __NEXT_DATA__
  const nextMatch = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/
  );
  // Попытка C: __UNIVERSAL_DATA (Новый формат 2024-2025)
  const universalMatch = html.match(
    /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">(.+?)<\/script>/
  );

  try {
    if (sigiMatch) {
      console.log("[TikTok Service] Found SIGI_STATE");
      dataJson = JSON.parse(sigiMatch[1]).ItemModule?.[videoId];
    } else if (nextMatch) {
      console.log("[TikTok Service] Found __NEXT_DATA__");
      dataJson = JSON.parse(nextMatch[1]).props?.pageProps?.itemInfo
        ?.itemStruct;
    } else if (universalMatch) {
      console.log("[TikTok Service] Found UNIVERSAL_DATA");
      const deepData = JSON.parse(universalMatch[1]);
      // Структура универсального объекта очень сложная, ищем внутри массива
      dataJson =
        deepData?.__DEFAULT_SCOPE__?.["webapp.video-detail"]?.itemInfo
          ?.itemStruct;
    }
  } catch (e) {
    console.warn("[TikTok Service] JSON parse warning:", e.message);
  }

  // Если JSON сработал
  if (dataJson && dataJson.video && dataJson.video.playAddr) {
    return {
      id: dataJson.id,
      url: dataJson.video.playAddr,
      desc: dataJson.desc,
      cover: dataJson.video.cover,
    };
  }

  // 4. ПОИСК ДАННЫХ (Стратегия 2: Brute Force / Грубый поиск текста)
  // Если парсинг JSON не удался, ищем ссылку прямо в тексте HTML через RegEx
  console.log(
    "[TikTok Service] JSON method failed. Trying Brute Force Regex..."
  );

  // Ищем строку вида "playAddr":"https://..."
  // \\u0026 - это закодированный амперсанд (&)
  const urlRegex = /"playAddr":"(https:[^"]+)"/i;
  const match = html.match(urlRegex);

  if (match && match[1]) {
    // Ссылка в HTML закодирована (содержит \u002F вместо /), чистим её
    let rawUrl = match[1];
    const cleanUrl = JSON.parse(`"${rawUrl}"`); // Трюк для декодирования Unicode

    console.log("[TikTok Service] Brute Force success!");

    return {
      id: videoId,
      url: cleanUrl,
      desc: "Video (Extracted via Regex)",
      cover: "",
      isFallback: true,
    };
  }

  throw new Error(
    "Не удалось найти ссылку на видео. Возможно, HTML изменился или это приватное видео."
  );
}

async function resolveRedirect(url) {
  if (!url.includes("vm.tiktok.com") && !url.includes("vt.tiktok.com"))
    return url;
  const res = await fetch(url, { redirect: "manual", headers: HEADERS });
  return res.status === 301 || res.status === 302
    ? res.headers.get("location")
    : url;
}
