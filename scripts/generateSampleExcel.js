const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const sampleTeams = [
  {
    'Team Name': 'Total Gaming Esports',
    'Captain Name': 'Ajay Sharma',
    'Captain Phone Number': '+91 98765 43210',
    'Captain Discord User ID': '108273645192837465',
    'Player 2 Name': 'Prince Gupta',
    'Player 3 Name': 'Vicky Singh',
    'Player 4 Name': 'Rohit Verma',
    'Substitute Player Name': 'Kunal Yadav',
    'Coach Name': 'Coach Vikram',
    'Free Fire Guild UID': 'FF-GUILD-101'
  },
  {
    'Team Name': 'Team Elite Free Fire',
    'Captain Name': 'Pahadi Gaming',
    'Captain Phone Number': '+91 98123 45678',
    'Captain Discord User ID': '109283746510293847',
    'Player 2 Name': 'Jonty Gaming',
    'Player 3 Name': 'Killer FF',
    'Player 4 Name': 'Iconic Pro',
    'Substitute Player Name': 'Tirth V',
    'Coach Name': 'Coach Rakesh',
    'Free Fire Guild UID': 'FF-GUILD-102'
  },
  {
    'Team Name': 'TSM Entity India',
    'Captain Name': 'Neyoo Sen',
    'Captain Phone Number': '+91 98711 22334',
    'Captain Discord User ID': '110293847561029384',
    'Player 2 Name': 'Jonathan Amar',
    'Player 3 Name': 'ClutchGod',
    'Player 4 Name': 'Zgod OP',
    'Substitute Player Name': 'Ghatak Sir',
    'Coach Name': 'Coach Aman',
    'Free Fire Guild UID': 'FF-GUILD-103'
  },
  {
    'Team Name': 'GodLike Esports',
    'Captain Name': 'Kronten Boss',
    'Captain Phone Number': '+91 98222 33445',
    'Captain Discord User ID': '111293847561029385',
    'Player 2 Name': 'Shadow FF',
    'Player 3 Name': 'Spower Ace',
    'Player 4 Name': 'Gill Gaming',
    'Substitute Player Name': 'Manya OP',
    'Coach Name': 'Coach Suraj',
    'Free Fire Guild UID': 'FF-GUILD-104'
  },
  {
    'Team Name': 'Blind Esports',
    'Captain Name': 'Mamba Ray',
    'Captain Phone Number': '+91 98333 44556',
    'Captain Discord User ID': '112293847561029386',
    'Player 2 Name': 'Nakul Fire',
    'Player 3 Name': 'Rony Beast',
    'Player 4 Name': 'Harsh Sniper',
    'Substitute Player Name': 'Rishi Sub',
    'Coach Name': 'Coach Nikhil',
    'Free Fire Guild UID': 'FF-GUILD-105'
  },
  {
    'Team Name': 'Orangutan Elite',
    'Captain Name': 'Wizz Gaming',
    'Captain Phone Number': '+91 98444 55667',
    'Captain Discord User ID': '113293847561029387',
    'Player 2 Name': 'Draco FF',
    'Player 3 Name': 'Sensei Rush',
    'Player 4 Name': 'Blaze OP',
    'Substitute Player Name': 'Venom Sub',
    'Coach Name': 'Coach Karan',
    'Free Fire Guild UID': 'FF-GUILD-106'
  },
  {
    'Team Name': 'Hyderabad Hydras',
    'Captain Name': 'Viper Fire',
    'Captain Phone Number': '+91 98555 66778',
    'Captain Discord User ID': '114293847561029388',
    'Player 2 Name': 'Hydra Ace',
    'Player 3 Name': 'Rex Nitro',
    'Player 4 Name': 'Ghost Sniper',
    'Substitute Player Name': 'Phantom X',
    'Coach Name': 'Coach Dev',
    'Free Fire Guild UID': 'FF-GUILD-107'
  },
  {
    'Team Name': 'Revenant Esports',
    'Captain Name': 'Paradox King',
    'Captain Phone Number': '+91 98666 77889',
    'Captain Discord User ID': '115293847561029389',
    'Player 2 Name': 'Kyro Rush',
    'Player 3 Name': 'Spark Fire',
    'Player 4 Name': 'Titan OP',
    'Substitute Player Name': 'Alpha Sub',
    'Coach Name': 'Coach Sameer',
    'Free Fire Guild UID': 'FF-GUILD-108'
  },
  {
    'Team Name': 'Enigma Gaming',
    'Captain Name': 'Rawknee OP',
    'Captain Phone Number': '+91 98777 88990',
    'Captain Discord User ID': '116293847561029390',
    'Player 2 Name': 'Insane God',
    'Player 3 Name': 'Bullet Rush',
    'Player 4 Name': 'Storm Eye',
    'Substitute Player Name': 'Frost Bit',
    'Coach Name': 'Coach Rajiv',
    'Free Fire Guild UID': 'FF-GUILD-109'
  },
  {
    'Team Name': 'Chemin Esports',
    'Captain Name': 'Radhe Gaming',
    'Captain Phone Number': '+91 98888 99001',
    'Captain Discord User ID': '117293847561029391',
    'Player 2 Name': 'Swag Ace',
    'Player 3 Name': 'Thunder Fox',
    'Player 4 Name': 'Nova Striker',
    'Substitute Player Name': 'Zeus Sub',
    'Coach Name': 'Coach Amit',
    'Free Fire Guild UID': 'FF-GUILD-110'
  },
  {
    'Team Name': 'Nigma Galaxy India',
    'Captain Name': 'Vortex Chief',
    'Captain Phone Number': '+91 98999 00112',
    'Captain Discord User ID': '118293847561029392',
    'Player 2 Name': 'Aero Blast',
    'Player 3 Name': 'Falcon Sky',
    'Player 4 Name': 'Cobra Strike',
    'Substitute Player Name': 'Raven Sub',
    'Coach Name': 'Coach Kabir',
    'Free Fire Guild UID': 'FF-GUILD-111'
  },
  {
    'Team Name': 'Global Esports FF',
    'Captain Name': 'Skylord Legend',
    'Captain Phone Number': '+91 97111 22334',
    'Captain Discord User ID': '119293847561029393',
    'Player 2 Name': 'Eagle Eye',
    'Player 3 Name': 'Sniper God',
    'Player 4 Name': 'Flash Rush',
    'Substitute Player Name': 'Ranger Sub',
    'Coach Name': 'Coach Arvind',
    'Free Fire Guild UID': 'FF-GUILD-112'
  },
  {
    'Team Name': '7Sea Esports',
    'Captain Name': 'Poseidon FF',
    'Captain Phone Number': '+91 97222 33445',
    'Captain Discord User ID': '120293847561029394',
    'Player 2 Name': 'Ocean Tide',
    'Player 3 Name': 'Deep Sea',
    'Player 4 Name': 'Shark Attack',
    'Substitute Player Name': 'Wave Sub',
    'Coach Name': 'Coach Sagar',
    'Free Fire Guild UID': 'FF-GUILD-113'
  },
  {
    'Team Name': 'Skylightz Gaming',
    'Captain Name': 'Zenith Pro',
    'Captain Phone Number': '+91 97333 44556',
    'Captain Discord User ID': '121293847561029395',
    'Player 2 Name': 'Cosmo Ace',
    'Player 3 Name': 'Starlight FF',
    'Player 4 Name': 'Solar Flare',
    'Substitute Player Name': 'Lunar Sub',
    'Coach Name': 'Coach Tarun',
    'Free Fire Guild UID': 'FF-GUILD-114'
  },
  {
    'Team Name': 'Marcos Gaming',
    'Captain Name': 'Commando Max',
    'Captain Phone Number': '+91 97444 55667',
    'Captain Discord User ID': '122293847561029396',
    'Player 2 Name': 'Bravo Force',
    'Player 3 Name': 'Delta Recon',
    'Player 4 Name': 'Echo Sniper',
    'Substitute Player Name': 'Tango Sub',
    'Coach Name': 'Coach Mohan',
    'Free Fire Guild UID': 'FF-GUILD-115'
  },
  {
    'Team Name': 'Insane Esports',
    'Captain Name': 'Maniac Rush',
    'Captain Phone Number': '+91 97555 66778',
    'Captain Discord User ID': '123293847561029397',
    'Player 2 Name': 'Psycho Ace',
    'Player 3 Name': 'Chaos Maker',
    'Player 4 Name': 'Frenzy Fire',
    'Substitute Player Name': 'Havoc Sub',
    'Coach Name': 'Coach Pradeep',
    'Free Fire Guild UID': 'FF-GUILD-116'
  },
  {
    'Team Name': 'Entity Gaming FF',
    'Captain Name': 'Captain Razor',
    'Captain Phone Number': '+91 97666 77889',
    'Captain Discord User ID': '124293847561029398',
    'Player 2 Name': 'Blade Runner',
    'Player 3 Name': 'Sharp Edge',
    'Player 4 Name': 'Steel Heart',
    'Substitute Player Name': 'Dagger Sub',
    'Coach Name': 'Coach Sunil',
    'Free Fire Guild UID': 'FF-GUILD-117'
  },
  {
    'Team Name': 'Galaxy Racers India',
    'Captain Name': 'Nitro Turbo',
    'Captain Phone Number': '+91 97777 88990',
    'Captain Discord User ID': '125293847561029399',
    'Player 2 Name': 'Speed Demon',
    'Player 3 Name': 'Overdrive FF',
    'Player 4 Name': 'Apex Drift',
    'Substitute Player Name': 'Ignition Sub',
    'Coach Name': 'Coach Chetan',
    'Free Fire Guild UID': 'FF-GUILD-118'
  },
  {
    'Team Name': 'Velocity Gaming',
    'Captain Name': 'Mach Rush',
    'Captain Phone Number': '+91 97888 99001',
    'Captain Discord User ID': '126293847561029400',
    'Player 2 Name': 'Sonic Boom',
    'Player 3 Name': 'Hyper Beam',
    'Player 4 Name': 'Quantum Leap',
    'Substitute Player Name': 'Warp Sub',
    'Coach Name': 'Coach Varun',
    'Free Fire Guild UID': 'FF-GUILD-119'
  },
  {
    'Team Name': 'True Rippers Esports',
    'Captain Name': 'Ripper King',
    'Captain Phone Number': '+91 97999 00112',
    'Captain Discord User ID': '127293847561029401',
    'Player 2 Name': 'Savage Beast',
    'Player 3 Name': 'Predator FF',
    'Player 4 Name': 'Apex Hunter',
    'Substitute Player Name': 'Carnage Sub',
    'Coach Name': 'Coach Deepak',
    'Free Fire Guild UID': 'FF-GUILD-120'
  },
  {
    'Team Name': 'Force One Esports',
    'Captain Name': 'Major General',
    'Captain Phone Number': '+91 96111 22334',
    'Captain Discord User ID': '128293847561029402',
    'Player 2 Name': 'Colonel Strike',
    'Player 3 Name': 'Captain Fury',
    'Player 4 Name': 'Lieutenant Gun',
    'Substitute Player Name': 'Sergeant Sub',
    'Coach Name': 'Coach Ramesh',
    'Free Fire Guild UID': 'FF-GUILD-121'
  },
  {
    'Team Name': 'Gods Reign FF',
    'Captain Name': 'Ares War',
    'Captain Phone Number': '+91 96222 33445',
    'Captain Discord User ID': '129293847561029403',
    'Player 2 Name': 'Hades Realm',
    'Player 3 Name': 'Apollo Light',
    'Player 4 Name': 'Hermes Swift',
    'Substitute Player Name': 'Atlas Sub',
    'Coach Name': 'Coach Shashi',
    'Free Fire Guild UID': 'FF-GUILD-122'
  },
  {
    'Team Name': 'Team Mayhem FF',
    'Captain Name': 'Disaster Lord',
    'Captain Phone Number': '+91 96333 44556',
    'Captain Discord User ID': '130293847561029404',
    'Player 2 Name': 'Calamity Jane',
    'Player 3 Name': 'Cataclysm OP',
    'Player 4 Name': 'Rupture Rush',
    'Substitute Player Name': 'Quake Sub',
    'Coach Name': 'Coach Hemant',
    'Free Fire Guild UID': 'FF-GUILD-123'
  },
  {
    'Team Name': 'Dragon Claw Esports',
    'Captain Name': 'Drake Flame',
    'Captain Phone Number': '+91 96444 55667',
    'Captain Discord User ID': '131293847561029405',
    'Player 2 Name': 'Wyvern Wing',
    'Player 3 Name': 'Scales Armor',
    'Player 4 Name': 'Inferno Breath',
    'Substitute Player Name': 'Ember Sub',
    'Coach Name': 'Coach Bharat',
    'Free Fire Guild UID': 'FF-GUILD-124'
  }
];

const outDir = path.join(__dirname, '..', 'samples');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(sampleTeams);
XLSX.utils.book_append_sheet(workbook, worksheet, 'Team Registrations');

const outPath = path.join(outDir, 'free_fire_sample_teams.xlsx');
XLSX.writeFile(workbook, outPath);

console.log('✓ Successfully generated sample Excel template at:', outPath);
