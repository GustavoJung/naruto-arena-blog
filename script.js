/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");
const { chromium } = require("playwright");
const cheerio = require("cheerio");

// ====== CONFIG ======
const SOURCE_ROOT = "https://www.naruto-arena.site/ninja-missions";
const BASE = "https://www.naruto-arena.site";
const OUT_DIR = path.resolve(process.cwd(), "missions_out");
const OUT_IMAGES_DIR = path.join(OUT_DIR, "images");
const OUT_JSON = path.join(OUT_DIR, "missions_out.json");
const STORAGE_STATE = path.resolve(process.cwd(), "storageState.json");

// Se você já tem os HTMLs de sessões baixados localmente, coloque numa pasta e aponte aqui.
// O script usa isso só pra descobrir quais sessões existem (slugs), mas também pode descobrir pelo site.
const LOCAL_SESSIONS_HTML_DIR = path.resolve(process.cwd(), "missions_html/sessions_html"); // opcional

// ====== HELPERS ======
function nowSP() {
    // America/Sao_Paulo sem libs extras
    const d = new Date();
    // “aproximação” consistente: usa ISO e remove ms; se quiser exatamente SP com timezone correto, use luxon.
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
        d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function ensureDirs() {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.mkdirSync(OUT_IMAGES_DIR, { recursive: true });
}

function slugFromUrl(url) {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1];
}

function normalizeSessionId(sessionId) {
    return sessionId.replace(/^\/?missions\//, "").replace(/\/$/, "");
}

function safeSlug(s) {
    return slugify(String(s), { lower: true, strict: true });
}

function imgFileName(prefix, url) {
    const id = url.split("/").pop().split("?")[0];
    const ext = path.extname(id) || ".jpg";
    return `${prefix}__${id.replace(ext, "")}${ext}`;
}

/**
 * Tenta extrair o __NEXT_DATA__ da página (Next.js) e retorna o JSON.
 */
function extractNextData(html) {
    const $ = cheerio.load(html);
    const script = $("#__NEXT_DATA__").html();
    if (!script) return null;
    try {
        return JSON.parse(script);
    } catch {
        return null;
    }
}

function pick(obj, pathArr, fallback = undefined) {
    let cur = obj;
    for (const k of pathArr) {
        if (cur == null) return fallback;
        cur = cur[k];
    }
    return cur ?? fallback;
}

// ====== LOGIN FLOW ======
async function ensureLogin() {
    if (fs.existsSync(STORAGE_STATE)) return;

    console.log("storageState.json não encontrado. Vou abrir o navegador pra você logar.");
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${BASE}`, { waitUntil: "domcontentloaded" });

    console.log("➡️ Faça login manualmente na janela aberta.");
    console.log("➡️ Depois que estiver logado (e a página mostrar você autenticado), volte aqui no terminal e pressione ENTER.");

    await new Promise((resolve) => process.stdin.once("data", resolve));

    await context.storageState({ path: STORAGE_STATE });
    console.log("✅ Login salvo em storageState.json");

    await browser.close();
}

// ====== SCRAPE ======
async function getSessionSlugsFromLocalHtml() {
    if (!fs.existsSync(LOCAL_SESSIONS_HTML_DIR)) return [];
    const files = fs.readdirSync(LOCAL_SESSIONS_HTML_DIR).filter((f) => f.endsWith(".html"));
    const slugs = new Set();
    for (const f of files) {
        const html = fs.readFileSync(path.join(LOCAL_SESSIONS_HTML_DIR, f), "utf-8");
        const next = extractNextData(html);
        const qid = pick(next, ["query", "id"]);
        if (qid) slugs.add(String(qid));
    }
    return [...slugs].sort();
}

async function fetchSessionPage(page, sessionId) {
    const url = `${BASE}/missions/${normalizeSessionId(sessionId)}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const html = await page.content();

    const next = extractNextData(html);
    if (!next) throw new Error(`Sem __NEXT_DATA__ em ${url}`);

    // Esses caminhos batem com o HTML que você mostrou (“animeName”, “animeDescription”, “randomHeader”, “animeMissions”)
    const pageProps = pick(next, ["props", "pageProps"], {});
    const title = pageProps.animeName ?? pageProps.sessionName ?? normalizeSessionId(sessionId);
    const description = pageProps.animeDescription ?? pageProps.description ?? "";
    const headerImage = pageProps.randomHeader ?? null;
    const missions = Array.isArray(pageProps.animeMissions) ? pageProps.animeMissions : [];

    return { url, title, description, headerImage, missions };
}

async function fetchMissionDetail(page, missionSlug) {
    const url = `${BASE}/mission/${missionSlug}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // às vezes o conteúdo carrega depois (client-side)
    await page.waitForTimeout(300);

    const html = await page.content();
    const $ = cheerio.load(html);

    // ---------- helpers ----------
    const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

    const parseGoalsFromDom = () => {
        const goals = [];

        // 1) Tenta achar qualquer item de lista que pareça objetivo
        // (muitas páginas têm <li> com o texto do objetivo)
        $("li").each((_, el) => {
            const t = clean($(el).text());
            if (!t) return;

            // heurística: objetivos normalmente têm verbo + progresso (x/y) ou frases tipo "Win ...", "Use ...", etc.
            const looksLikeGoal =
                /\(\s*\d+\s*\/\s*\d+\s*\)/.test(t) ||
                /^(win|use|defeat|kill|complete|reach|play|earn|get)\b/i.test(t);

            if (looksLikeGoal) {
                const done = /(\(\s*(\d+)\s*\/\s*\2\s*\))/.test(t); // (8/8)
                goals.push({ text: t, isCompleted: done });
            }
        });

        // 2) Se não achou, tenta por blocos/divs (alguns layouts não usam <li>)
        if (goals.length === 0) {
            $("div, p, span").each((_, el) => {
                const t = clean($(el).text());
                if (!t) return;
                if (!/\(\s*\d+\s*\/\s*\d+\s*\)/.test(t)) return; // aqui exige progresso para reduzir falsos positivos

                const done = /(\(\s*(\d+)\s*\/\s*\2\s*\))/.test(t);
                goals.push({ text: t, isCompleted: done });
            });
        }

        // remove duplicados
        const uniq = [];
        const seen = new Set();
        for (const g of goals) {
            const key = g.text;
            if (seen.has(key)) continue;
            seen.add(key);
            uniq.push(g);
        }

        return uniq;
    };

    // ---------- 1) NEXT_DATA ----------
    const next = extractNextData(html);
    let requirements = "";
    let reward = "";
    let rewardImageUrl = null;
    let goals = [];

    if (next) {
        const pageProps = pick(next, ["props", "pageProps"], {});

        requirements =
            pageProps.requirementsText ??
            pageProps.requirements ??
            pick(pageProps, ["mission", "requirements"]) ??
            "";

        reward =
            pageProps.rewardText ??
            pageProps.reward ??
            pick(pageProps, ["mission", "reward"]) ??
            pick(pageProps, ["mission", "unlockedCharacter"]) ??
            "";

        rewardImageUrl =
            pageProps.rewardImageUrl ??
            pick(pageProps, ["mission", "rewardImageUrl"]) ??
            pick(pageProps, ["mission", "rewardImage"]) ??
            null;

        const goalsRaw =
            pageProps.goals ??
            pick(pageProps, ["mission", "goals"]) ??
            pick(pageProps, ["missionGoals"]) ??
            [];

        if (Array.isArray(goalsRaw) && goalsRaw.length) {
            goals = goalsRaw.map((g) => {
                const text = clean(g.text ?? g.description ?? String(g));
                const done = Boolean(
                    g.isCompleted ??
                    g.completed ??
                    /(\(\s*(\d+)\s*\/\s*\2\s*\))/.test(text)
                );
                return { text, isCompleted: done };
            });
        }
    }

    // ---------- 2) DOM fallback ----------
    // Se NEXT_DATA não trouxe goals, tenta DOM
    if (!goals || goals.length === 0) {
        goals = parseGoalsFromDom();
    }

    // ---------- 3) super fallback: tenta achar "Rank:" e "Reward:" no texto ----------
    if (!requirements) {
        // tenta achar algo com "Rank:" no texto da página
        const bodyText = clean($("body").text());
        const m = bodyText.match(/Rank:\s*At least\s*[^.]+/i);
        if (m) requirements = m[0];
    }

    if (!reward) {
        // tenta achar "Unlocks:" ou "Reward:"
        const bodyText = clean($("body").text());
        const m = bodyText.match(/(Unlocks|Reward)\s*:\s*[A-Za-z0-9 '._-]+/i);
        if (m) reward = m[0].split(":").slice(1).join(":").trim();
    }

    return { url, requirements, reward, goals, rewardImageUrl };
}

function buildImageEntry(filePrefix, url) {
    if (!url) return null;
    const file = `missions_out/images/${imgFileName(filePrefix, url)}`;
    return { url, file };
}

async function main() {
    ensureDirs();
    await ensureLogin();

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: STORAGE_STATE });
    const page = await context.newPage();

    // 1) Descobrir quais sessões pegar
    let sessionSlugs = await getSessionSlugsFromLocalHtml();
    if (sessionSlugs.length === 0) {
        // fallback: tenta pegar da página “ninja-missions” (se ela listar sessões)
        console.log("Não achei HTMLs locais de sessão. Vou tentar descobrir sessões pelo site.");
        await page.goto(`${BASE}/ninja-missions`, { waitUntil: "domcontentloaded" });
        const html = await page.content();
        const $ = cheerio.load(html);
        const links = $("a[href^='/missions/']")
            .map((_, el) => $(el).attr("href"))
            .get();
        sessionSlugs = [...new Set(links.map((h) => normalizeSessionId(h.replace("/missions/", ""))))].filter(Boolean);
    }

    console.log("Sessões encontradas:", sessionSlugs);

    const result = {
        sourceRoot: SOURCE_ROOT,
        generatedAt: nowSP(),
        sessions: [],
    };

    // 2) Para cada sessão, pegar lista de missions (cards)
    for (const sessionId of sessionSlugs) {
        console.log(`\n== Sessão: ${sessionId} ==`);
        const sessionData = await fetchSessionPage(page, sessionId);

        const sessionObj = {
            id: sessionId,
            title: sessionData.title,
            description: sessionData.description,
            url: sessionData.url,
            image: sessionData.headerImage
                ? buildImageEntry(`session__${sessionId}`, sessionData.headerImage)
                : null,
            missions: [],
        };

        // 3) Para cada missão no card, visitar detalhe /mission/<slug>
        for (const m of sessionData.missions) {
            const missionTitle = m.name ?? m.title ?? "Unknown";
            const missionSlug = m.linkTo ? String(m.linkTo).replace(/^\/?mission\//, "") : safeSlug(missionTitle);

            console.log(`  - missão: ${missionTitle} (${missionSlug})`);

            const detail = await fetchMissionDetail(page, missionSlug);

            const missionObj = {
                id: missionSlug,
                title: missionTitle,
                section: sessionData.title,
                card: {
                    imageUrl: m.url ?? "",
                    isAvailable: Boolean(m.isAvailable),
                    isLevelAvailable: Boolean(m.isLevelAvailable),
                    isCompleted: Boolean(m.isCompleted),
                    rankRequirement: m.rankRequirement ?? "",
                    levelRequirement: m.levelRequirement ?? null,
                    completedRequeriments: Array.isArray(m.completedRequeriments) ? m.completedRequeriments : [],
                    unlockedCharacter: m.unlockedCharacter ?? "",
                },
                missionInfo: {
                    "Mission name": missionTitle,
                    "Mission type": sessionData.title,
                },
                requirements: detail.requirements || "",
                reward: detail.reward || (m.unlockedCharacter ?? ""),
                goals: detail.goals || [],
                images: {
                    mission: buildImageEntry(`${sessionId}__${missionSlug}__mission`, m.url),
                    reward: detail.rewardImageUrl
                        ? buildImageEntry(`${sessionId}__${missionSlug}__reward`, detail.rewardImageUrl)
                        : null,
                },
                pageUrl: detail.url,
            };

            sessionObj.missions.push(missionObj);
        }

        result.sessions.push(sessionObj);
    }

    fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2), "utf-8");
    console.log(`\n✅ JSON gerado em: ${OUT_JSON}`);

    await browser.close();
}

main().catch((err) => {
    console.error("Erro:", err);
    process.exit(1);
});