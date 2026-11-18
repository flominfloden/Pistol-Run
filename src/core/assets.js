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

export async function preloadBg(name) {
  await loadImage(bgUrl(name, false));
  await loadImage(bgUrl(name, true));
}

export async function preload(ids, bgName, onProgress) {
  const list = [];
  for (const id of ids) list.push(artUrl(id));
  list.push(bgUrl(bgName, false));
  list.push(bgUrl(bgName, true));
  list.push(B + "cardback.webp");

  let done = 0;
  const total = list.length;
  await Promise.all(
    list.map((u) =>
      loadImage(u).then(() => {
        done++;
        if (onProgress) onProgress(done / total);
      })
    )
  );
  return { ok: cache.size };
}

export async function preloadFaces(ids) {
  await Promise.all(ids.map((id) => loadImage(faceUrl(id))));
}
