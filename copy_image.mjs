import fs from 'fs';
const src = "C:\\Users\\AJWADNA_MAOULAININE\\.gemini\\antigravity\\brain\\a96062c4-71a7-401e-b7ed-ceca5dea4d94\\media__1773400399935.png";
const destDir = "C:\\Users\\AJWADNA_MAOULAININE\\Desktop\\Gestion d'absence enseignants\\public";
const dest = destDir + "\\en-tete.png";
fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log("Done");
