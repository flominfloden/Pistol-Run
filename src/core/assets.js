const cache = new Map();
const loading = new Map();

export function loadImage(url) {
  if (cache.has(url)) return Promise.resolve(cache.get(url));
  if (loading.has(url)) return loading.get(url);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      cache.set(url, img);
      resolve(img);
    };
    img.onerror = () => {
      cache.set(url, null);
      resolve(null);
    };
    img.src = url;
  });
  loading.set(url, p);
  return p;
}

export function getImage(url) {
  return cache.get(url) || null;
}

const A = "./art/";
const F = "./faces/";
const D = "./draft/";
const B = "./bg/";

export const artUrl = (id) => A + id + ".webp";
export const faceUrl = (id) => F + id + ".webp";
export const draftUrl = (id) => D + id + ".webp";
export const bgUrl = (name, portrait) => B + name + (portrait ? "-tall" : "") + ".webp";

/**
 * 关键资源：只等这些就开局，剩下的后台补。
 * 网络慢时不能把玩家卡在 40 秒白屏上。
 */
export async function preloadCritical(heroId, bgName, onProgress) {
  const list = [
    bgUrl(bgName, false),
    bgUrl(bgName, true),
    artUrl(heroId),
  ];
  let done = 0;
  await Promise.all(
    list.map((u) =>
      loadImage(u).then(() => {
        done++;
        if (onProgress) onProgress(done / list.length);
      })
    )
  );
}

/**
 * 后台补齐：不阻塞流程，失败也无声。
 * 限制并发，避免把刚开局的首帧挤掉。
 */
export function preloadRest(ids, bgName, concurrency = 6) {
  const queue = [];
  for (const id of ids) {
    // 首波用不到立绘，先只补原画
    queue.push(artUrl(id));
  }
  queue.push(B + "cardback.webp");

  let cursor = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < queue.length) {
      const u = queue[cursor++];
      if (cache.has(u)) continue;
      await loadImage(u);
    }
  });
  return Promise.all(workers);
}

/** 选卡界面打开前调用：补 3 张卡面，不阻塞整波 */
export function preloadFaces(ids) {
  return Promise.all(ids.map((id) => loadImage(faceUrl(id))));
}

/** 选卡也优先用 draft 图（更小），失败回退到 face */
export function preloadDraft(ids) {
  return Promise.all(ids.map((id) => loadImage(draftUrl(id))));
}
