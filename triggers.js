"use strict";

/*
 * =====================================================================
 * SLEEP PARALYSIS — EXTENDED DYNAMIC AUTO-GENERATING REPLY ENGINE
 * =====================================================================
 * Generates endless organic Tagalog banat and responses dynamically.
 */

const openers = [
  "uy", "hoy", "balita ko", "sabi na nga ba", "napansin ko lang,", 
  "ang lakas mo mag-talk ha,", "real talk lang,", "teka lang,", "tignan mo nga naman,",
  "sa totoo lang,", "wag ka magagalit ha,", "aminin man natin o hindi,", "patawa ka rin,",
  "halatang-halata ka na,", "subukan mo munang mag-isip,", "chika mo 'yan e,", "pansin ng lahat,",
  "grabe rin yang confidence mo,", "pagbigyan na lang kita pero,", "pansin ko lang sa'yo,"
];

const subjects = [
  "yang confidence mo", "yang logic mong baluktot", "yang reply speed mo",
  "yang banat mong pilit", "yang pagpapacute mo", "yang argumento mong walang resibo",
  "yang pagkamasalita mo", "yang panggugulo mo sa chat", "yang mga hinala mo",
  "yang mga pinaglalaban mo", "yang tapang-tapangan mo", "yang reasoning mong pambata",
  "yang akala mong angas", "yang mga kwento mong gawa-gawa", "yang mga banat mong lumang-luma",
  "yang mga pinagsasasabi mo", "yang pang-aasar mong sablay", "yang entitlement mo"
];

const bridges = [
  "parang naka-trial version pa,", "medyo nakakaawa na,", "kulang na kulang sa substance,",
  "halatang napipilitan ka na lang,", "walang-wala sa hulog,", "parang nag-lag sa utak mo,",
  "sobrang malayo sa reality,", "parang wala sa tamang ulirat,", "lumalagpas na sa linya,",
  "kailangan na yata ng resuscitation,", "nawawalan na ng direksyon,", "puro na lang pangarap,",
  "stuck pa rin sa lumang season,", "nag-error 404 bigla,", "sobrang sub-par ng quality,"
];

const punchlines = [
  "tumakbo ka na lang AHAHAHAHA", 
  "magkano ba bayad sa'yo sa pagiging ganyan?",
  "baka kailangan mo muna mag-reboot", 
  "subukan mo namang gumawa ng may sense next time",
  "sleep paralysis demon niyo 'to, wag kayong maingay", 
  "balik ka na lang muna sa elementarya para matuto",
  "tuloy mo lang, natutuwa akong panoorin kang malito", 
  "puro ka angas wala namang laman",
  "parang side quest lang sa totoong buhay 'yang point mo",
  "hanapin mo muna 'yung punto mo bago ka mag-reply ulit",
  "di ka ba napapagod maging maling-mali sa lahat ng bagay?",
  "baka kailangan natin ng search party para sa common sense mo",
  "magkano ba load mo pampalakas lang ng loob?",
  "pwede ka nang magtayo ng museum para sa mga sablay na take",
  "kahit anong spin mo, wala talagang resibo e",
  "pahinga ka muna, halatang umiinit na utak mo",
  "wag mong seryosohin, baka magalit ka na naman dyan",
  "sobrang try-hard, pero sige moral support na lang"
];

const endings = [
  "😭", "HAHAHAHA", "uwi ka na.", "peace muna.", "behave ka lang dyan.", "gets mo?",
  "tulog ka na lang.", "iyak ka muna dyan.", "wala kang maloloko dito.", "magsaing ka na muna.",
  "balitaan mo 'ko kapag may sense ka na.", "kbye.", "sayang load mo."
];

function generateDynamicBanat() {
  const op = openers[Math.floor(Math.random() * openers.length)];
  const sub = subjects[Math.floor(Math.random() * subjects.length)];
  const br = bridges[Math.floor(Math.random() * bridges.length)];
  const punch = punchlines[Math.floor(Math.random() * punchlines.length)];
  const end = endings[Math.floor(Math.random() * endings.length)];

  const patterns = [
    `${op} ${sub} ${br} ${punch} ${end}`,
    `${sub} ${br} ${punch} ${end}`,
    `${op} ${punch} ${end}`,
    `${punch} — ${sub} ${end}`,
    `${op} ${sub} ${br} ${end}`,
    `${punch} ${end}`
  ];

  return patterns[Math.floor(Math.random() * patterns.length)];
}

const groups = [
  {
    name: "bot-defense",
    triggers: ["bot", "robot", "ai", "script", "autobot", "system"],
    replies: [
      "mga tao ngayon, tawag agad sa 'kin bot kapag hindi makasabay sa reply",
      "bot ka dyan, baka ikaw 'yung mechanical mag-isip HAHAHAHA",
      "kapag wala nang masagot, sasabihin na lang 'bot', lumang linya na 'yan",
      "porket mabilis lang ako mag-type, bot agad? mahina",
      "ako pa talaga? magpakita ka muna ng resibo bago ka mag-accuse dyan",
      "bot? sorry ha, sadyang effortless lang talaga kitang barahin"
    ]
  },
  {
    name: "trash-talk-trigger",
    triggers: ["weak", "laro", "lala", "patawa", "pake ko", "sino yan", "talk", "pikon", "epal", "kulit", "sira", "bobo", "tanga"],
    replies: [
      "sleep paralysis demon niyo 'to, wag kayo masyadong maingay",
      "tumakbo ka na AHAHAHAHA",
      "tumakbo ka na, hindi mo kaya 'to",
      "takbo na, may time ka pa AHAHAHA",
      "tumakbo ka na bago ka maabutan ng resibo",
      "sige tumakbo ka na, hihintayin kita dito AHAHAHAHA",
      "cute mo kapag mali ka"
    ]
  }
];

function normalize(text) { 
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim(); 
}

function getTriggerReply(body) {
  const text = normalize(body);
  const matched = groups.find(group => group.triggers.some(trigger => {
    const t = String(trigger).toLowerCase();
    return text.includes(t);
  }));

  if (matched && Math.random() < 0.6) {
    return matched.replies[Math.floor(Math.random() * matched.replies.length)];
  }

  return generateDynamicBanat();
}

function getRandomFallbackReply() {
  return generateDynamicBanat();
}

module.exports = {
  groups,
  getTriggerReply,
  getRandomFallbackReply,
  generateDynamicBanat
};
