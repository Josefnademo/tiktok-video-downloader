// src/services/tiktok.js
import fetch from "node-fetch";

// Эти заголовки маскируют нас под обычный браузер
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://www.tiktok.com/",
  "Accept-Language": "en-US,en;q=0.9",
};

export async function getVideoInfo(inputUrl) {
  try {
    // 1. Раскрываем короткую ссылку (если это vm.tiktok.com)
    const finalUrl = await resolveRedirect(inputUrl);

    // 2. Скачиваем HTML страницы
    const response = await fetch(finalUrl, { headers: HEADERS });
    if (!response.ok)
      throw new Error(`Ошибка доступа к TikTok: ${response.status}`);
    const html = await response.text();

    // 3. Ищем JSON с данными (TikTok постоянно меняет id, ищем оба варианта)
    // Вариант A: SIGI_STATE (новый)
    let dataMatch = html.match(
      /<script id="SIGI_STATE" type="application\/json">(.+?)<\/script>/
    );
    // Вариант B: __NEXT_DATA__ (старый)
    if (!dataMatch) {
      dataMatch = html.match(
        /<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/
      );
    }

    if (!dataMatch)
      throw new Error("Не удалось найти данные видео на странице.");

    const data = JSON.parse(dataMatch[1]);

    // 4. Парсим данные, чтобы найти URL видео
    // Логика поиска внутри JSON может отличаться в зависимости от версии скрипта TikTok
    // Обычно это ItemModule -> [videoId] -> video -> playAddr

    // Упрощенный поиск: найдем ID видео из URL и поищем его в объекте
    const videoId = finalUrl.match(/\/video\/(\d+)/)?.[1];
    if (!videoId) throw new Error("Не найден ID видео.");

    // Пытаемся достать объект видео
    const item =
      data.ItemModule?.[videoId] || data.props?.pageProps?.itemInfo?.itemStruct;

    if (!item) throw new Error("Структура JSON изменилась, видео не найдено.");

    return {
      id: item.id,
      desc: item.desc,
      // Ссылка с водяным знаком (обычно playAddr)
      urlWm: item.video.playAddr,
      // Ссылка без знака (часто совпадает с playAddr, но иногда лежит в downloadAddr)
      // На этапе "без API" мы пока берем то, что дают.
      urlClean: item.video.playAddr,
      cover: item.video.cover,
      author: item.author,
    };
  } catch (e) {
    console.error("TikTok Error:", e);
    throw e;
  }
}

// Хелпер для получения конечной ссылки (раскрытие редиректа)
async function resolveRedirect(url) {
  if (!url.includes("vm.tiktok.com") && !url.includes("vt.tiktok.com"))
    return url;

  const res = await fetch(url, {
    redirect: "manual", // Запрещаем авто-редирект, чтобы поймать заголовок
    headers: HEADERS,
  });

  // Если 301/302, берем location
  if (res.status === 301 || res.status === 302) {
    return res.headers.get("location");
  }
  return url; // Если редиректа не было
}
