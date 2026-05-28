// @ts-check
// Guardian data — source: Guardian - Feuille 1.csv

var GUARDIAN_LIST = [
  // ── Beast ─────────────────────────────────────────────────────────────────
  {name:'Deer Spirit',    img:'deer_spirit.png',       rarity:'Beast',  tpen:500,  ten:10000,
   skill:'Final DMG RES +8%, ally attack speed +12%'},
  {name:'Brawl Hound',   img:'Brawl_Hound.png',        rarity:'Beast',  tpen:300,  ten:15000,
   skill:'Final DMG RES +12%'},
  {name:'Magic Kitten',  img:'magic_cat.png',           rarity:'Beast',  tpen:800,  ten:12000,
   skill:'Final DMG RES +8%, energy recovery speed +6%'},
  {name:'Hunter Hare',   img:'Hunter_hare.png',         rarity:'Beast',  tpen:1600, ten:8000,
   skill:'Final DMG RES +6%'},
  // ── War ───────────────────────────────────────────────────────────────────
  {name:'Commander',     img:'Commander.png',           rarity:'War',    tpen:600,  ten:12000,
   skill:'Final DMG RES +16%, ally attack speed +18%'},
  {name:'Fate Hunter',   img:'Fate_hunter.png',         rarity:'War',    tpen:1920, ten:9600,
   skill:'Final DMG RES +12%'},
  {name:'Minotaur',      img:'Minotaur.png',            rarity:'War',    tpen:360,  ten:18000,
   skill:'Final DMG RES +24%'},
  {name:'Occult Mentor', img:'Occult_Mentor.png',       rarity:'War',    tpen:960,  ten:14400,
   skill:'Final DMG RES +16%, energy recovery speed +10%'},
  // ── Wrath ─────────────────────────────────────────────────────────────────
  {name:'Combat Expert', img:'Combat_Expert.png',       rarity:'Wrath',  tpen:435,  ten:21750,
   skill:'Final DMG RES +36%'},
  {name:'Beast Master',  img:'Beast_Master.png',        rarity:'Wrath',  tpen:725,  ten:14500,
   skill:'Final DMG RES +24%, ally attack speed +30%'},
  {name:'Bounty Hunter', img:'Bounty_Hunter.png',       rarity:'Wrath',  tpen:2320, ten:11600,
   skill:'Final DMG RES +18%'},
  {name:'Curse Priest',  img:'Curse_Priest.png',        rarity:'Wrath',  tpen:1160, ten:17400,
   skill:'Final DMG RES +24%, energy recovery speed +18%'},
  // ── Spirit ────────────────────────────────────────────────────────────────
  {name:'Mech Master',   img:'Mech Master.png',         rarity:'Spirit', tpen:735,  ten:36750,
   skill:'Final DMG RES +48%, all defensive effects +30%'},
  {name:'Death Reaper',  img:'Death_Reaper.png',        rarity:'Spirit', tpen:1225, ten:24500,
   skill:'Final DMG RES +32%. Every 5 normal hits / 3 ally hits: +1.2% target max HP as damage (ignores immunity)'},
  {name:'Domain Hunter', img:'Domain_Hunter.png',       rarity:'Spirit', tpen:3920, ten:19600,
   skill:'Final DMG RES +24%. Target full heal -30% for 3s'},
  {name:'Crazy Rider',   img:'Crazy_Rider.png',         rarity:'Spirit', tpen:1764, ten:29400,
   skill:'Final DMG RES +32%, evasion +20%, energy recovery speed +20%'},
  // ── Sage ──────────────────────────────────────────────────────────────────
  {name:'Flame Spirit',  img:'Flame_Spirit.png',        rarity:'Sage',   tpen:5040, ten:28800,
   skill:'Final DMG RES +30%. On attack (non-GS): 100% mixed DMG + 0.8% current HP/s for 4s (×5 stacks)'},
  {name:'Tide Spirit',   img:'Tide_Spirit.png',         rarity:'Sage',   tpen:2160, ten:43200,
   skill:'On summon: ATK +3% (max 8×). Final DMG RES +40%, HP regen 3%/s, ignores crits/combos, ally RES +2500. 610% mixed DMG vs non-GS'},
  {name:'Zephyr Spirit', img:'Zephyr_Spirit.png',       rarity:'Sage',   tpen:2376, ten:37800,
   skill:'Final DMG RES +40%, evasion/speed/ally speed/energy regen +20%. 670% mixed DMG vs non-GS'},
  {name:'Litho Spirit',  img:'Litho_Spirit.png',        rarity:'Sage',   tpen:1656, ten:54000,
   skill:'On summon: 10% max HP barrier (10s), burst 400% DEF DMG on break. Final DMG RES +60%, DEF +30%. 500% mixed DMG vs non-GS'},
  // ── Hero ──────────────────────────────────────────────────────────────────
  {name:'Zeus',              img:'Zeus.png',             rarity:'Hero',   tpen:6500, ten:40000,
   skill:'On summon: 100% poise + 5% target max HP DMG. Final DMG RES +36%. On attack: 1200% mixed DMG, 3% current HP DMG, -30% healing 4s'},
  {name:'Goddess Of Wisdom', img:'Goddess_of_Wisdom.png',rarity:'Hero',   tpen:3000, ten:60000,
   skill:'Final DMG RES +48%, all enemy stats -18%. On GS attack: +1.8% max HP DMG to all enemies. 730% mixed DMG vs non-GS'},
  {name:'Valkyrie',          img:'Valkyrie.png',         rarity:'Hero',   tpen:3600, ten:60000,
   skill:'Final DMG RES +48%, all enemy stats +20%. Every 5 normal hits: +3% current HP DMG, -20% evasion, -10% crit RES (3s). 800% mixed DMG vs non-GS'},
  {name:'Hercules',          img:'Hercules.png',         rarity:'Hero',   tpen:2300, ten:80000,
   skill:'On summon: ATK +6% (max 8×). Final DMG RES +72%, DEF +30%, all shields +30%. 600% mixed DMG vs non-GS'},
];

// Star progression — [★, TPEN, Tenacity, Global Power Increase]
// Only Wrath / Spirit / Sage tiers have star data in game
var GUARDIAN_STARS = {
  'Combat Expert': [[1,435,21750,'150%'],[2,480,24000,'160%'],[3,525,26250,'180%'],[4,570,28500,'200%'],[5,615,30750,'210%']],
  'Beast Master':  [[1,725,14500,'170%'],[2,800,16000,'190%'],[3,875,17500,'210%'],[4,950,19000,'230%'],[5,1025,20500,'250%']],
  'Bounty Hunter': [[1,2320,11600,'450%'],[2,2560,12800,'490%'],[3,2800,14000,'540%'],[4,3040,15200,'590%'],[5,3280,16400,'640%']],
  'Curse Priest':  [[1,435,21750,'150%'],[2,480,24000,'160%'],[3,525,26250,'180%'],[4,570,28500,'200%'],[5,615,30750,'210%']],
  'Mech Master':   [[1,735,36750,'240%'],[2,780,39000,'260%'],[3,825,41250,'280%'],[4,870,43500,'300%'],[5,915,45750,'320%']],
  'Death Reaper':  [[1,1225,24500,'280%'],[2,1300,26000,'300%'],[3,1375,27500,'330%'],[4,1450,29000,'350%'],[5,1525,30500,'380%']],
  'Domain Hunter': [[1,3920,19600,'720%'],[2,4160,20800,'780%'],[3,4400,22000,'840%'],[4,4640,23200,'910%'],[5,4880,24400,'970%']],
  'Crazy Rider':   [[1,1764,29400,'400%'],[2,1872,31200,'440%'],[3,1980,33000,'470%'],[4,2088,34800,'500%'],[5,2196,36600,'540%']],
  'Flame Spirit':  [[1,5040,28800,'1000%'],[2,5250,30000,'1040%'],[3,5460,31200,'1080%'],[4,5670,32400,'1120%'],[5,5880,33600,'1160%']],
  'Tide Spirit':   [[1,2160,43200,'610%'],[2,2250,45000,'640%'],[3,2340,46800,'660%'],[4,2430,48600,'680%'],[5,2520,50400,'710%']],
  'Zephyr Spirit': [[1,2376,37800,'670%'],[2,2475,39375,'690%'],[3,2574,40950,'720%'],[4,2673,42525,'750%'],[5,2772,44100,'770%']],
  'Litho Spirit':  [[1,1656,54000,'500%'],[2,1725,56250,'520%'],[3,1794,58500,'540%'],[4,1863,60750,'560%'],[5,1932,63000,'580%']],
};
