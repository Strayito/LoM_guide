'use strict';
// ── Talent Data — Legend of Mushroom ──
// Tree structure matches in-game (10 nodes per tree):
//
//            [root /20]              ← center top
//           /           \
//      [hub /40]     [side /10]      ← main hub + small side branch
//      /       \           \
//  [fl /40]  [mid /20]  [sfin /1]   ← fl=far-left chain, sfin=Side Final Talent
//      \       /
//    [merge /40]                     ← converge point
//      /       \
//  [flend /20] [mend /20]            ← two end nodes
//        \       /
//       [final /1]                   ← Main Final Talent
//
// Prerequisite rule (50% of parent max):
//   Parent max 20 → need 10 | Parent max 40 → need 20 | Parent max 10 → need 5
// merge needs BOTH fl (≥20) AND mid (≥10) — hence prereqMin2

const TALENT_CLASSES = ['fury', 'archery', 'sorcery', 'beasts'];

// Shared positions/connections for every tree
const T_SLOTS = [
  // [slot,     x,  y, maxLv, prereqSlot, pMin, prereqSlot2, pMin2, isFinal]
  ['root',      50,  5,  20,  null,        0,   null,         0,  false],
  ['hub',       28, 20,  40,  'root',     10,   null,         0,  false],
  ['side',      76, 20,  10,  'root',     10,   null,         0,  false],
  ['fl',        12, 37,  40,  'hub',      20,   null,         0,  false],
  ['mid',       52, 37,  20,  'hub',      20,   null,         0,  false],
  ['merge',     28, 54,  40,  'fl',       20,   'mid',       10,  false],
  ['flend',     12, 71,  20,  'merge',    20,   null,         0,  false],
  ['mend',      52, 71,  20,  'merge',    20,   null,         0,  false],
  ['sfin',      76, 71,   1,  'side',      5,   null,         0,  true ],
  ['final',     28, 87,   1,  'flend',    10,   'mend',      10,  true ]
];

const T_EDGES = [
  ['root','hub'],['root','side'],
  ['hub','fl'],['hub','mid'],
  ['fl','merge'],['mid','merge'],
  ['merge','flend'],['merge','mend'],
  ['side','sfin'],
  ['flend','final'],['mend','final']
];

function buildTree(info, pfx) {
  const nd = info.nodes;
  const nodes = T_SLOTS.map(([slot, x, y, maxLevel, ps, pm, ps2, pm2, isFinalTalent]) => ({
    id:      pfx + '_' + slot,
    name:    nd[slot].name,
    icon:    nd[slot].icon,
    x, y, maxLevel,
    prereq:      ps  ? pfx + '_' + ps  : null,
    prereq2:     ps2 ? pfx + '_' + ps2 : null,
    prereqMin:   pm,
    prereqMin2:  pm2 || null,
    isFinalTalent,
    stats: nd[slot].stats
  }));
  const edges = T_EDGES.map(([a, b]) => [pfx + '_' + a, pfx + '_' + b]);
  return { id: info.id, color: info.color, name: info.name, icon: info.icon, nodes, edges };
}

const TALENT_DATA = {
  fury: {
    label: { fr: 'Furie', en: 'Fury', sk: 'Furor' }, icon: '⚔️',
    trees: [
      buildTree({
        id: 'fury-atk', color: '#e04040',
        name: { fr: 'Attaque', en: 'Attack', sk: 'Útok' }, icon: '🗡️',
        nodes: {
          root:  { icon: '⚔️', name: { fr: 'Maîtrise Martiale', en: 'Martial Mastery',    sk: 'Bojové Majstrovstvo' }, stats: { 'Global ATK': 1.5 } },
          hub:   { icon: '💥', name: { fr: 'Frappe de Guerre',   en: 'War Strike',          sk: 'Bojový Úder' },       stats: { 'Global ATK': 1, 'Basic ATK DMG': 1 } },
          side:  { icon: '🌙', name: { fr: 'Lame Secrète',       en: 'Secret Blade',        sk: 'Tajná Čepeľ' },      stats: { 'Crit DMG': 3 } },
          fl:    { icon: '🗡️', name: { fr: 'Trancheur',          en: 'Cleaver',             sk: 'Sekáč' },            stats: { 'Basic ATK DMG': 2 } },
          mid:   { icon: '💢', name: { fr: 'Ardeur',             en: 'Ardor',               sk: 'Zápal' },            stats: { 'Crit DMG': 1.5 } },
          merge: { icon: '💀', name: { fr: 'Destruction',        en: 'Destruction',         sk: 'Ničenie' },          stats: { 'Boss DMG': 1.5, 'Global ATK': 0.5 } },
          flend: { icon: '🔥', name: { fr: 'Briseur de Boss',    en: 'Boss Breaker',        sk: 'Lámač Bossov' },     stats: { 'Boss DMG': 2 } },
          mend:  { icon: '✨', name: { fr: 'Sort Fatal',         en: 'Fatal Skill',         sk: 'Smrteľná Zručnosť' }, stats: { 'Skill Crit': 1.5 } },
          sfin:  { icon: '⚡', name: { fr: 'Lame Éclair',        en: 'Thunder Blade',       sk: 'Blesk Čepeľ' },      stats: { 'Crit DMG': 15 } },
          final: { icon: '👑', name: { fr: 'Rage Absolue',       en: 'Absolute Rage',       sk: 'Absolútna Zúrivosť' }, stats: { 'Global ATK': 20, 'Boss DMG': 10 } }
        }
      }, 'fa'),
      buildTree({
        id: 'fury-combo', color: '#e8c040',
        name: { fr: 'Combo', en: 'Combo', sk: 'Kombo' }, icon: '💥',
        nodes: {
          root:  { icon: '⚡', name: { fr: 'Impact Enchaîné',    en: 'Chain Impact',        sk: 'Reťazový Dopad' },   stats: { 'Combo DMG': 2 } },
          hub:   { icon: '🔥', name: { fr: 'Maîtrise du Combo',  en: 'Combo Mastery',       sk: 'Majstrovstvo Komba' }, stats: { 'Combo DMG': 1, 'Counter DMG': 1 } },
          side:  { icon: '🌟', name: { fr: 'Contre Ultime',      en: 'Ultimate Counter',    sk: 'Ultimátny Protiúder' }, stats: { 'Counter DMG': 3 } },
          fl:    { icon: '🔄', name: { fr: 'Riposte',            en: 'Riposte',             sk: 'Ripost' },           stats: { 'Counter DMG': 2 } },
          mid:   { icon: '👾', name: { fr: 'Familier Combattant', en: 'Fighting Pal',       sk: 'Bojovný Pal' },      stats: { 'Pal DMG': 1.5 } },
          merge: { icon: '💎', name: { fr: 'Contre Critique',    en: 'Critical Counter',    sk: 'Kritický Protiúder' }, stats: { 'Counter DMG': 1.5, 'Crit DMG': 0.5 } },
          flend: { icon: '🌀', name: { fr: 'Dévastateur',        en: 'Devastator',          sk: 'Devastátor' },       stats: { 'Combo DMG': 2 } },
          mend:  { icon: '💣', name: { fr: 'Combo du Familier',  en: 'Pal Combo',           sk: 'Pal Kombo' },        stats: { 'Pal Crit DMG': 1.5 } },
          sfin:  { icon: '🌪️', name: { fr: 'Rage Enchaînée',    en: 'Chained Rage',        sk: 'Reťazová Zúrivosť' }, stats: { 'Counter DMG': 15 } },
          final: { icon: '👑', name: { fr: 'Dévastation Totale', en: 'Total Devastation',   sk: 'Totálna Devastácia' }, stats: { 'Combo DMG': 20, 'Counter DMG': 10 } }
        }
      }, 'fb'),
      buildTree({
        id: 'fury-def', color: '#a0b8d0',
        name: { fr: 'Résistance', en: 'Resistance', sk: 'Odolnosť' }, icon: '🛡️',
        nodes: {
          root:  { icon: '❤️', name: { fr: 'Constitution Robuste', en: 'Robust Constitution', sk: 'Pevná Konštrukcia' }, stats: { 'Global HP': 2 } },
          hub:   { icon: '🛡️', name: { fr: 'Armure de Guerre',    en: 'War Armor',           sk: 'Bojová Zbroj' },     stats: { 'Global HP': 1, 'Global DEF': 1 } },
          side:  { icon: '🔵', name: { fr: 'Bouclier Mystique',   en: 'Mystic Shield',       sk: 'Mystický Štít' },    stats: { 'Boss RES': 3 } },
          fl:    { icon: '🪨', name: { fr: 'Armure Épique',       en: 'Epic Armor',          sk: 'Epická Zbroj' },     stats: { 'Global DEF': 2 } },
          mid:   { icon: '💚', name: { fr: 'Régénération',        en: 'Regeneration',        sk: 'Regenerácia' },      stats: { 'HP Regen': 2 } },
          merge: { icon: '💪', name: { fr: 'Endurance de Guerre', en: 'War Endurance',       sk: 'Bojová Výdrž' },     stats: { 'Global DEF': 1, 'Boss RES': 0.5 } },
          flend: { icon: '🔒', name: { fr: 'Résistance Boss',     en: 'Boss Resistance',     sk: 'Odolnosť Bossa' },   stats: { 'Boss RES': 2 } },
          mend:  { icon: '💊', name: { fr: 'Vigueur Vitale',      en: 'Vital Vigor',         sk: 'Vitálna Sila' },     stats: { 'Heal Rate': 1.5 } },
          sfin:  { icon: '⭐', name: { fr: 'Grâce Mystique',      en: 'Mystic Grace',        sk: 'Mystická Milosť' },  stats: { 'Crit RES': 15 } },
          final: { icon: '🏰', name: { fr: 'Forteresse Absolue',  en: 'Absolute Fortress',   sk: 'Absolútna Pevnosť' }, stats: { 'Global HP': 20, 'Global DEF': 10 } }
        }
      }, 'fc')
    ]
  },

  archery: {
    label: { fr: 'Archerie', en: 'Archery', sk: 'Lukostrelba' }, icon: '🏹',
    trees: [
      buildTree({
        id: 'arch-prec', color: '#e8c040',
        name: { fr: 'Précision', en: 'Precision', sk: 'Presnosť' }, icon: '🎯',
        nodes: {
          root:  { icon: '🦅', name: { fr: 'Œil de Faucon',      en: 'Eagle Eye',           sk: 'Sokolie Oko' },      stats: { 'Basic ATK DMG': 2 } },
          hub:   { icon: '🏹', name: { fr: 'Maîtrise de l\'Arc', en: 'Bow Mastery',          sk: 'Majstrovstvo Luku' }, stats: { 'Basic ATK DMG': 1, 'Crit DMG': 1 } },
          side:  { icon: '☠️', name: { fr: 'Flèche Empoisonnée', en: 'Poison Arrow',         sk: 'Jedovatá Šípka' },   stats: { 'Boss DMG': 3 } },
          fl:    { icon: '🎯', name: { fr: 'Tir Critique',        en: 'Critical Shot',       sk: 'Kritický Výstrel' }, stats: { 'Crit DMG': 2 } },
          mid:   { icon: '💫', name: { fr: 'Viser Juste',         en: 'True Aim',            sk: 'Presné Cielenie' },  stats: { 'Global ATK': 1.5 } },
          merge: { icon: '💥', name: { fr: 'Impact Critique',     en: 'Critical Impact',     sk: 'Kritický Dopad' },   stats: { 'Crit DMG': 1.5, 'Boss DMG': 0.5 } },
          flend: { icon: '💢', name: { fr: 'Flèche Fatale',       en: 'Lethal Arrow',        sk: 'Smrteľná Šípka' },   stats: { 'Boss DMG': 2 } },
          mend:  { icon: '⚡', name: { fr: 'Salve Rapide',        en: 'Rapid Salvo',         sk: 'Rýchla Salva' },     stats: { 'Counter DMG': 1.5 } },
          sfin:  { icon: '🌟', name: { fr: 'Flèche Foudre',       en: 'Lightning Arrow',     sk: 'Blesk Šípka' },      stats: { 'Crit DMG': 15 } },
          final: { icon: '👑', name: { fr: 'Tir Ultime',          en: 'Ultimate Shot',       sk: 'Ultimátny Výstrel' }, stats: { 'Crit DMG': 20, 'Boss DMG': 10 } }
        }
      }, 'aa'),
      buildTree({
        id: 'arch-skill', color: '#40c870',
        name: { fr: 'Compétence', en: 'Skill', sk: 'Zručnosť' }, icon: '✨',
        nodes: {
          root:  { icon: '🌿', name: { fr: 'Instinct du Chasseur', en: "Hunter's Instinct",  sk: 'Lovecký Inštinkt' }, stats: { 'Skill DMG': 2 } },
          hub:   { icon: '🦊', name: { fr: 'Art de la Chasse',     en: 'Hunting Art',        sk: 'Lovecké Umenie' },   stats: { 'Skill DMG': 1, 'Skill Crit': 1 } },
          side:  { icon: '🌙', name: { fr: 'Lien Sauvage',         en: 'Wild Bond',          sk: 'Divoké Puto' },      stats: { 'Pal DMG': 3 } },
          fl:    { icon: '⭐', name: { fr: 'Compétence Critique',  en: 'Critical Skill',     sk: 'Kritická Zručnosť' }, stats: { 'Skill Crit': 2 } },
          mid:   { icon: '👾', name: { fr: 'Attaque du Familier',  en: 'Pal Attack',         sk: 'Útok Pala' },        stats: { 'Pal DMG': 1.5 } },
          merge: { icon: '💨', name: { fr: 'Magie de Chasse',      en: 'Hunting Magic',      sk: 'Lovecká Mágia' },    stats: { 'Skill Crit': 1, 'Pal DMG': 0.5 } },
          flend: { icon: '🌀', name: { fr: 'Combo de Précision',   en: 'Precision Combo',    sk: 'Presné Kombo' },     stats: { 'Combo DMG': 2 } },
          mend:  { icon: '💢', name: { fr: 'Crit du Familier',     en: 'Pal Crit',           sk: 'Kritický Pal' },     stats: { 'Pal Crit DMG': 2 } },
          sfin:  { icon: '🦅', name: { fr: 'Serment du Chasseur',  en: "Hunter's Oath",      sk: 'Lovcová Prísaha' },  stats: { 'Pal DMG': 15 } },
          final: { icon: '👑', name: { fr: 'Maîtrise Totale',      en: 'Total Mastery',      sk: 'Úplné Majstrovstvo' }, stats: { 'Skill DMG': 20, 'Pal DMG': 10 } }
        }
      }, 'ab'),
      buildTree({
        id: 'arch-surv', color: '#4090d8',
        name: { fr: 'Survie', en: 'Survival', sk: 'Prežitie' }, icon: '🌿',
        nodes: {
          root:  { icon: '🐱', name: { fr: 'Réflexes Félins',      en: 'Cat Reflexes',       sk: 'Mačacie Reflexy' },  stats: { 'Global HP': 1.5 } },
          hub:   { icon: '🌿', name: { fr: 'Résistance Naturelle', en: 'Natural Resistance', sk: 'Prírodná Odolnosť' }, stats: { 'Global HP': 1, 'Boss RES': 1 } },
          side:  { icon: '🦎', name: { fr: 'Peau Coriace',         en: 'Tough Skin',         sk: 'Tvrdá Koža' },       stats: { 'Crit RES': 3 } },
          fl:    { icon: '💪', name: { fr: 'Endurance',            en: 'Endurance',          sk: 'Výdrž' },            stats: { 'Global DEF': 2 } },
          mid:   { icon: '💚', name: { fr: 'Régénération',         en: 'Regeneration',       sk: 'Regenerácia' },      stats: { 'HP Regen': 2 } },
          merge: { icon: '🔵', name: { fr: 'Corps Résistant',      en: 'Resistant Body',     sk: 'Odolné Telo' },      stats: { 'Global DEF': 1, 'Boss RES': 0.5 } },
          flend: { icon: '🛡️', name: { fr: 'Résistance au Boss',   en: 'Boss Resistance',    sk: 'Odolnosť voči Bossom' }, stats: { 'Boss RES': 2 } },
          mend:  { icon: '💖', name: { fr: 'Vitalité',             en: 'Vitality',           sk: 'Vitalita' },         stats: { 'Heal Rate': 1.5 } },
          sfin:  { icon: '🌱', name: { fr: 'Éveil Naturel',        en: 'Natural Awakening',  sk: 'Prírodné Prebudenie' }, stats: { 'HP Regen': 15 } },
          final: { icon: '👑', name: { fr: 'Survivant Légendaire', en: 'Legendary Survivor', sk: 'Legendárny Prežívajúci' }, stats: { 'Global HP': 20, 'Global DEF': 10 } }
        }
      }, 'ac')
    ]
  },

  sorcery: {
    label: { fr: 'Sorcellerie', en: 'Sorcery', sk: 'Čarodejníctvo' }, icon: '🔮',
    trees: [
      buildTree({
        id: 'sorc-skill', color: '#9060e0',
        name: { fr: 'Compétence', en: 'Skill', sk: 'Zručnosť' }, icon: '✨',
        nodes: {
          root:  { icon: '🔮', name: { fr: 'Arts Magiques',          en: 'Magic Arts',          sk: 'Magické Umenie' },     stats: { 'Skill DMG': 2 } },
          hub:   { icon: '⚗️', name: { fr: 'Maîtrise Arcane',        en: 'Arcane Mastery',      sk: 'Arkánne Majstrovstvo' }, stats: { 'Skill DMG': 1, 'Skill Crit': 1 } },
          side:  { icon: '🌑', name: { fr: 'Magie Noire',            en: 'Dark Magic',          sk: 'Čierna Mágia' },       stats: { 'Boss DMG': 3 } },
          fl:    { icon: '⭐', name: { fr: 'Sort Critique',          en: 'Critical Spell',      sk: 'Kritické Kúzlo' },     stats: { 'Skill Crit': 2 } },
          mid:   { icon: '💜', name: { fr: 'Magie du Familier',      en: 'Pal Magic',           sk: 'Palova Mágia' },       stats: { 'Pal DMG': 2 } },
          merge: { icon: '🌀', name: { fr: 'Confluence Magique',     en: 'Magic Confluence',    sk: 'Magická Súhra' },      stats: { 'Skill Crit': 1, 'Pal DMG': 0.5 } },
          flend: { icon: '🔄', name: { fr: 'Contre-Sort',           en: 'Counterspell',        sk: 'Protikúzlo' },         stats: { 'Counter DMG': 2 } },
          mend:  { icon: '💥', name: { fr: 'Crit du Familier',      en: 'Pal Crit',            sk: 'Kritický Pal' },       stats: { 'Pal Crit DMG': 2 } },
          sfin:  { icon: '🌌', name: { fr: 'Révélation Mystique',   en: 'Mystic Revelation',   sk: 'Mystická Zjavenie' },  stats: { 'Boss DMG': 15 } },
          final: { icon: '👑', name: { fr: 'Maîtrise Ultime',       en: 'Ultimate Mastery',    sk: 'Ultimátne Majstrovstvo' }, stats: { 'Skill DMG': 20, 'Global ATK': 10 } }
        }
      }, 'sa'),
      buildTree({
        id: 'sorc-pal', color: '#e060c0',
        name: { fr: 'Familier', en: 'Pal', sk: 'Pal' }, icon: '👾',
        nodes: {
          root:  { icon: '💜', name: { fr: 'Lien Magique',           en: 'Magic Bond',          sk: 'Magické Puto' },       stats: { 'Pal DMG': 2 } },
          hub:   { icon: '🌸', name: { fr: 'Empathie Magique',       en: 'Magical Empathy',     sk: 'Magická Empatia' },    stats: { 'Pal DMG': 1, 'Pal Crit%': 1 } },
          side:  { icon: '🔮', name: { fr: 'Pacte Mystique',         en: 'Mystic Pact',         sk: 'Mystický Pakt' },      stats: { 'Pal Combo DMG': 3 } },
          fl:    { icon: '💥', name: { fr: 'Crit du Familier',       en: 'Pal Critical',        sk: 'Kritický Pal' },       stats: { 'Pal Crit%': 1.5 } },
          mid:   { icon: '⛓️', name: { fr: 'Enchaînement',          en: 'Chaining',            sk: 'Reťazovanie' },        stats: { 'Combo DMG': 2 } },
          merge: { icon: '🌟', name: { fr: 'Lien de Bataille',       en: 'Battle Bond',         sk: 'Bojové Puto' },        stats: { 'Pal Crit%': 0.5, 'Combo DMG': 0.5 } },
          flend: { icon: '💎', name: { fr: 'DMG Critique Pal',       en: 'Pal Critical DMG',    sk: 'Kritické Poškodenie Pala' }, stats: { 'Pal Crit DMG': 2 } },
          mend:  { icon: '🔗', name: { fr: 'Combo du Familier',      en: 'Pal Combo',           sk: 'Pal Kombo' },          stats: { 'Pal Combo DMG': 2 } },
          sfin:  { icon: '✴️', name: { fr: 'Éveil du Familier',      en: 'Pal Awakening',       sk: 'Prebúdzanie Pala' },   stats: { 'Pal DMG': 15 } },
          final: { icon: '👑', name: { fr: 'Fusion Mystique',        en: 'Mystic Fusion',       sk: 'Mystická Fúzia' },     stats: { 'Pal DMG': 20, 'Pal Crit DMG': 10 } }
        }
      }, 'sb'),
      buildTree({
        id: 'sorc-sup', color: '#20d4a8',
        name: { fr: 'Soutien', en: 'Support', sk: 'Podpora' }, icon: '💚',
        nodes: {
          root:  { icon: '💚', name: { fr: 'Magie Curative',         en: 'Healing Magic',       sk: 'Liečivá Mágia' },      stats: { 'Heal Rate': 2 } },
          hub:   { icon: '⚕️', name: { fr: 'Soin Puissant',         en: 'Powerful Healing',    sk: 'Silné Liečenie' },     stats: { 'Heal Rate': 1, 'HP Regen': 1 } },
          side:  { icon: '✝️', name: { fr: 'Résurrection',           en: 'Resurrection',        sk: 'Vzkriesenie' },        stats: { 'Global HP': 3 } },
          fl:    { icon: '🌀', name: { fr: 'Régénération Rapide',    en: 'Quick Regeneration',  sk: 'Rýchla Regenerácia' }, stats: { 'HP Regen': 2 } },
          mid:   { icon: '🛡️', name: { fr: 'Bouclier Vital',        en: 'Vital Shield',        sk: 'Vitálny Štít' },       stats: { 'Global HP': 2 } },
          merge: { icon: '🏰', name: { fr: 'Gardien de Vie',         en: 'Life Guardian',       sk: 'Strážca Života' },     stats: { 'HP Regen': 0.5, 'Global DEF': 0.5 } },
          flend: { icon: '🔵', name: { fr: 'Résistance Magique',     en: 'Magical Resistance',  sk: 'Magická Odolnosť' },   stats: { 'Crit RES': 2 } },
          mend:  { icon: '💛', name: { fr: 'Forteresse Vivante',     en: 'Living Fortress',     sk: 'Živá Pevnosť' },       stats: { 'Global DEF': 1.5 } },
          sfin:  { icon: '🌟', name: { fr: 'Grâce Divine',           en: 'Divine Grace',        sk: 'Božia Milosť' },       stats: { 'Heal Rate': 15 } },
          final: { icon: '👑', name: { fr: 'Invulnérabilité',        en: 'Invulnerability',     sk: 'Nezraniteľnosť' },     stats: { 'Global HP': 20, 'Heal Rate': 10 } }
        }
      }, 'sc')
    ]
  },

  beasts: {
    label: { fr: 'Apprivoisement', en: 'Tame Beasts', sk: 'Krotkenie' }, icon: '🐉',
    trees: [
      buildTree({
        id: 'beast-pal', color: '#4090d8',
        name: { fr: 'Familier', en: 'Pal', sk: 'Pal' }, icon: '🐲',
        nodes: {
          root:  { icon: '🐉', name: { fr: 'Lien Bestial',           en: 'Bestial Bond',        sk: 'Šelmie Puto' },        stats: { 'Pal DMG': 2 } },
          hub:   { icon: '🦁', name: { fr: 'Maître des Bêtes',       en: 'Beast Master',        sk: 'Pán Šeliem' },         stats: { 'Pal DMG': 1, 'Pal Crit%': 1 } },
          side:  { icon: '🌑', name: { fr: 'Serment Ancestral',      en: 'Ancestral Oath',      sk: 'Predcovská Prísaha' }, stats: { 'Pal Combo DMG': 3 } },
          fl:    { icon: '🦷', name: { fr: 'Morsure Critique',       en: 'Critical Bite',       sk: 'Kritické Hryznutie' }, stats: { 'Pal Crit%': 2 } },
          mid:   { icon: '⛓️', name: { fr: 'Enchaînement Bestial',  en: 'Bestial Chain',       sk: 'Šelmí Reťazec' },      stats: { 'Pal Combo DMG': 2 } },
          merge: { icon: '🌀', name: { fr: 'Furie Combinée',         en: 'Combined Fury',       sk: 'Kombinovaná Zúrivosť' }, stats: { 'Pal Crit%': 0.5, 'Pal Combo DMG': 0.5 } },
          flend: { icon: '💥', name: { fr: 'DMG Critique Pal',       en: 'Pal Critical DMG',    sk: 'Kritické Poškodenie Pala' }, stats: { 'Pal Crit DMG': 2 } },
          mend:  { icon: '🔥', name: { fr: 'Combo Bestial',          en: 'Bestial Combo',       sk: 'Šelmie Kombo' },       stats: { 'Combo DMG': 2 } },
          sfin:  { icon: '🏆', name: { fr: 'Pacte de Sang',          en: 'Blood Pact',          sk: 'Krvný Pakt' },         stats: { 'Pal DMG': 15 } },
          final: { icon: '👑', name: { fr: 'Furie Bestiale',         en: 'Bestial Fury',        sk: 'Šelmia Zúrivosť' },    stats: { 'Pal DMG': 20, 'Pal Crit DMG': 10 } }
        }
      }, 'ba'),
      buildTree({
        id: 'beast-fort', color: '#20d4a8',
        name: { fr: 'Fortitude', en: 'Fortitude', sk: 'Odolnosť' }, icon: '💪',
        nodes: {
          root:  { icon: '🦺', name: { fr: 'Peau de Bête',           en: 'Beast Hide',          sk: 'Šelmia Koža' },        stats: { 'Global HP': 2 } },
          hub:   { icon: '🦏', name: { fr: 'Corps Blindé',           en: 'Armored Body',        sk: 'Obrnené Telo' },       stats: { 'Global HP': 1, 'Global DEF': 1 } },
          side:  { icon: '🌱', name: { fr: 'Régénération Bestiale',  en: 'Bestial Regeneration', sk: 'Šelmia Regenerácia' }, stats: { 'HP Regen': 3 } },
          fl:    { icon: '🛡️', name: { fr: 'Écailles Protectrices', en: 'Protective Scales',   sk: 'Ochranné Šupiny' },    stats: { 'Global DEF': 2 } },
          mid:   { icon: '💚', name: { fr: 'Récupération Rapide',    en: 'Quick Recovery',      sk: 'Rýchle Zotavenie' },   stats: { 'Heal Rate': 2 } },
          merge: { icon: '💀', name: { fr: 'Carapace Indestructible', en: 'Indestructible Shell', sk: 'Nezničiteľný Pancier' }, stats: { 'Global DEF': 1, 'Boss RES': 0.5 } },
          flend: { icon: '🔒', name: { fr: 'Résistance à la Mort',   en: 'Death Resistance',    sk: 'Odolnosť voči Smrti' }, stats: { 'Boss RES': 2 } },
          mend:  { icon: '🌿', name: { fr: 'Instinct de Survie',     en: 'Survival Instinct',   sk: 'Inštinkt Prežitia' },  stats: { 'HP Regen': 1.5 } },
          sfin:  { icon: '🏔️', name: { fr: 'Communion Bestiale',    en: 'Bestial Communion',   sk: 'Šelmie Spoločenstvo' }, stats: { 'HP Regen': 15 } },
          final: { icon: '👑', name: { fr: 'Bête Indestructible',    en: 'Indestructible Beast', sk: 'Nezničiteľná Šelma' }, stats: { 'Global HP': 20, 'Global DEF': 10 } }
        }
      }, 'bb'),
      buildTree({
        id: 'beast-atk', color: '#e8a020',
        name: { fr: 'Puissance', en: 'Power', sk: 'Sila' }, icon: '⚡',
        nodes: {
          root:  { icon: '🦅', name: { fr: 'Griffe Mortelle',        en: 'Deadly Claw',         sk: 'Smrteľný Dráp' },      stats: { 'Global ATK': 1.5 } },
          hub:   { icon: '💪', name: { fr: 'Puissance Bestiale',     en: 'Bestial Power',       sk: 'Šelmia Sila' },        stats: { 'Global ATK': 1, 'Crit DMG': 1 } },
          side:  { icon: '🦁', name: { fr: 'Rugissement',            en: 'Roar',                sk: 'Rev' },                stats: { 'Boss DMG': 3 } },
          fl:    { icon: '💢', name: { fr: 'Fracas Critique',        en: 'Critical Crash',      sk: 'Kritický Náraz' },     stats: { 'Crit DMG': 2 } },
          mid:   { icon: '✨', name: { fr: 'Compétence Bestiale',    en: 'Bestial Skill',       sk: 'Šelmia Zručnosť' },    stats: { 'Skill DMG': 2 } },
          merge: { icon: '🐯', name: { fr: 'Instinct Prédateur',     en: 'Predator Instinct',   sk: 'Inštinkt Predátora' }, stats: { 'Crit DMG': 1, 'Skill DMG': 0.5 } },
          flend: { icon: '🌀', name: { fr: 'Prédateur',              en: 'Predator',            sk: 'Predátor' },           stats: { 'Counter DMG': 2 } },
          mend:  { icon: '🌟', name: { fr: 'Compétence Critique',    en: 'Critical Skill',      sk: 'Kritická Zručnosť' },  stats: { 'Skill Crit': 1.5 } },
          sfin:  { icon: '🔥', name: { fr: 'Griffe Enflammée',       en: 'Flaming Claw',        sk: 'Horiaci Dráp' },       stats: { 'Boss DMG': 15 } },
          final: { icon: '👑', name: { fr: 'Puissance Ultime',       en: 'Ultimate Power',      sk: 'Ultimátna Sila' },     stats: { 'Global ATK': 20, 'Crit DMG': 10 } }
        }
      }, 'bc')
    ]
  }
};
