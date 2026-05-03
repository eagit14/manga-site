// ── Genre profiles, style labels, cover gradients, helpers ────────────────

const genreProfiles = {
  shonen: {
    label: 'Shōnen', color: '#e63946', badgeColor: '#e63946',
    adjectives: ['determined and fiery', 'fearless against all odds', 'rejected but unbreakable', 'brilliant but misunderstood'],
    powers: ['a dormant power that awakens at the worst moment', 'an ancient technique forgotten by all', 'a strength born of pure willpower', 'a gift that others fear'],
    obstacles: ['an antagonist who was once their best friend', 'a tournament with deadly stakes', 'a secret organisation ruling from the shadows', 'a master who refuses to accept them'],
    themes: ['unbreakable friendship', 'surpassing your own limits', 'the strength of conviction', 'a promise kept against all odds'],
    resolutions: ['becoming the greatest of all time', 'protecting every smile around them', 'proving that the talentless can surpass geniuses', 'fulfilling the promise made to loved ones'],
    taglines: [
      'One path: forward. No matter what.',
      'They have nothing. Except a promise — and that can\'t be broken.',
      'Everyone else quit. They\'re just getting started.',
    ],
  },
  shojo: {
    label: 'Shōjo', color: '#e91e8c', badgeColor: '#e91e8c',
    adjectives: ['sensitive and sincere', 'endearing despite their clumsiness', 'strong in a way nobody sees', 'lost in their own emotions'],
    powers: ['an uncanny emotional intuition', 'a gift for reading even the most closed-off hearts', 'a resilience nothing can break', 'the ability to change people without knowing it'],
    obstacles: ['a misunderstanding that drags on for chapters', 'a rival who is far too charismatic', 'a family secret that changes everything', 'two contradictory feelings impossible to reconcile'],
    themes: ['the birth of an unexpected love', 'rediscovered self-confidence', 'the truth of feelings kept hidden', 'the gap between what you feel and what you say'],
    resolutions: ['finding the love that was there all along', 'learning to accept yourself exactly as you are', 'reconciling two worlds that seemed incompatible', 'choosing what truly matters'],
    taglines: [
      'Sometimes the greatest courage is speaking the truth.',
      'Love doesn\'t warn you. It just turns everything upside down.',
      'She wasn\'t looking to fall in love. He didn\'t give her a choice.',
    ],
  },
  seinen: {
    label: 'Seinen', color: '#444', badgeColor: '#555',
    adjectives: ['haunted by a past they can\'t erase', 'disillusioned but human at heart', 'pragmatic to the point of losing their ideals', 'complex — neither hero nor villain'],
    powers: ['a tactical intelligence that isolates them', 'lived experience no one can teach', 'the ability to see where others are blind', 'a network of bonds as precious as they are dangerous'],
    obstacles: ['a corrupt system no one can overturn alone', 'allies with an even darker past than their own', 'the blurring line between right and wrong', 'themselves — their own worst enemy'],
    themes: ['moral duality in a world with no easy answers', 'the weight of the past on present choices', 'what you sacrifice for what you believe in', 'what truly defines a human being'],
    resolutions: ['finding peace with what they\'ve done', 'delivering justice without losing their humanity', 'leaving the world a little less broken than they found it', 'choosing who they want to become'],
    taglines: [
      'There are no heroes in this world. Just people making choices.',
      'The truth is rarely beautiful. But it\'s there.',
      'Some wars are won. Others, you just survive.',
    ],
  },
  isekai: {
    label: 'Isekai', color: '#7b2ff7', badgeColor: '#7b2ff7',
    adjectives: ['completely out of place but surprisingly adaptable', 'ordinary in their world — extraordinary in the other', 'nostalgic for their old life', 'carrying a destiny written before they even arrived'],
    powers: ['a unique progression system in this new world', 'knowledge from their home world that changes everything', 'an ability to grow at an incomprehensible speed', 'access to skills this world has never seen'],
    obstacles: ['the impenetrable rules of a new world', 'the instinctive distrust of the locals', 'a Demon King with surprisingly understandable motives', 'longing for a world they can no longer reach'],
    themes: ['self-discovery in the completely unknown', 'rebuilding an identity from scratch', 'the question of belonging — where do you really come from?', 'culture clash and what it reveals'],
    resolutions: ['finding their place between two worlds', 'building something lasting in this parallel world', 'going home — or choosing to stay', 'forever changing the world that took them in'],
    taglines: [
      'An unknown world. No known rules. Everything to figure out.',
      'All they wanted was to go home. Now they\'re not sure they do.',
      'In another world, she is finally exactly who she was meant to be.',
    ],
  },
  horreur: {
    label: 'Horror', color: '#111', badgeColor: '#222',
    adjectives: ['terrified but unable to flee', 'the last survivor — for now', 'rational in the face of pure irrationality', 'haunted by a secret they don\'t yet understand'],
    powers: ['an inexplicable mental resistance to terror', 'a sixth sense for detecting danger before others', 'a growing understanding of the creature\'s rules', 'a panicked but tenacious refusal to die'],
    obstacles: ['an entity whose rules remain impenetrable', 'an environment completely cut off from the outside world', 'fear that paralyses their companions one by one', 'the growing certainty that no one will believe them'],
    themes: ['the fear of the unknown and what it reveals', 'survival at any cost and its moral price', 'the monsters hiding inside every human being', 'the truth you\'d rather never learn'],
    resolutions: ['surviving and exposing the truth to the world', 'understanding the origin of evil to end it', 'paying a terrible price so others may live', 'discovering that the real horror was human all along'],
    taglines: [
      'Some doors should never be opened.',
      'She\'s been hearing something for three nights. Tonight, it\'s getting closer.',
      'Everyone knows it ends badly. No one can stop reading.',
    ],
  },
  sf: {
    label: 'Sci-Fi', color: '#118ab2', badgeColor: '#118ab2',
    adjectives: ['ahead of their time — and the only one who knows it', 'out of place in a world they didn\'t choose', 'a pioneer despite themselves', 'increasingly doubting their own humanity'],
    powers: ['access to technology no one else understands', 'an unexplained connection with machines', 'the ability to anticipate complex systems', 'seeing flaws where others see order'],
    obstacles: ['a corporation desperate to exploit their discovery', 'an AI with completely opaque intentions', 'a government that erases individuals behind data', 'the progressive dehumanisation of a world with no way back'],
    themes: ['the ethical limits of technological progress', 'what defines humanity at its core', 'control and freedom in a surveilled world', 'the loneliness of seeing what others refuse to see'],
    resolutions: ['proving that consciousness cannot be programmed', 'saving humanity from its own progress', 'finding balance between technology and humanity', 'changing the world — or dying trying'],
    taglines: [
      'The future is here. It\'s just not evenly distributed.',
      'The machine doesn\'t lie. That\'s the problem.',
      'They built a god. They forgot to build an off switch.',
    ],
  },
  comedie: {
    label: 'Comedy', color: '#fb8500', badgeColor: '#fb8500',
    adjectives: ['catastrophically unlucky but impossible to discourage', 'too enthusiastic for their own good', 'unable to keep a secret for more than 5 minutes', 'loved in spite of everything — sometimes because of it'],
    powers: ['improbable luck that always shows up at the last second', 'an innate talent for turning disaster into opportunity', 'the ability to smile even in the most absurd situations', 'a disarming sincerity that defuses every conflict'],
    obstacles: ['cascading misunderstandings that can\'t be undone', 'rivals who take themselves far too seriously', 'their own inability to stay quiet at the right moment', 'a plan that goes wrong exactly as predicted'],
    themes: ['the absurd elevated to a way of life', 'friendship born from total chaos', 'finding love where you least expected it', 'proof that enthusiasm beats talent every time'],
    resolutions: ['proving everyone underestimated them all along', 'becoming the hero of the situation against all odds', 'winning someone\'s heart through sheer improbability', 'succeeding through trial — and mostly error'],
    taglines: [
      'No plan. No skill. And yet, somehow…',
      'The hero nobody expected. The chaos nobody planned for.',
      'When everything goes wrong, she smiles. It annoys everyone. Especially the villains.',
    ],
  },
  sport: {
    label: 'Sport', color: '#06d6a0', badgeColor: '#059a73',
    adjectives: ['passionate to the point of total obsession', 'a rookie bursting with raw talent no one has seen yet', 'injured but indestructible in their mind', 'a natural strategist without even realising it'],
    powers: ['a purely instinctive tactical sense', 'exceptional physical and mental endurance', 'the ability to read the game before it unfolds', 'a mental fortitude nothing can break'],
    obstacles: ['an undefeated champion who has never lost in ten years', 'an injury threatening their entire career', 'a team that doubts itself at the worst moment', 'a childhood rival who has gone so much further'],
    themes: ['hard work that always beats talent in the end', 'team spirit above all else', 'the impossible comeback that becomes possible', 'what sport reveals about our true nature'],
    resolutions: ['lifting the trophy with their teammates', 'surpassing their lifelong rival in the ultimate match', 'proving that sport is, above all, a matter of heart', 'becoming the legend they dreamed of as a child'],
    taglines: [
      'Talent gives an edge. Will gives the victory.',
      'They laughed at them. Until the rematch.',
      'Doesn\'t have the level. Trains twice as hard. Do the math.',
    ],
  },
};

const styleLabels = {
  dynamique: 'Dynamic & Explosive',
  elegant: 'Elegant & Detailed',
  sombre: 'Dark & Atmospheric',
  doux: 'Soft & Poetic',
  retro: '90s Retro',
  moderne: 'Modern & Minimalist',
};

const coverGrads = {
  shonen:  'linear-gradient(155deg, #1a0505 0%, #7a0f0f 55%, #c0392b 100%)',
  shojo:   'linear-gradient(155deg, #2b0a1e 0%, #8b1a5e 55%, #e91e8c 100%)',
  seinen:  'linear-gradient(155deg, #111 0%, #2a2a2a 55%, #444 100%)',
  isekai:  'linear-gradient(155deg, #0a0a2e 0%, #2a1060 55%, #7b2ff7 100%)',
  horreur: 'linear-gradient(155deg, #0a0a0a 0%, #1a0a0a 55%, #330000 100%)',
  sf:      'linear-gradient(155deg, #050f1a 0%, #0a2a3d 55%, #118ab2 100%)',
  comedie: 'linear-gradient(155deg, #1a0f00 0%, #5a2f00 55%, #fb8500 100%)',
  sport:   'linear-gradient(155deg, #001a0f 0%, #005c30 55%, #06d6a0 100%)',
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function buildSynopsis(data, profile) {
  const hero = data.heros || 'the protagonist';
  const univStr = data.univers ? `In ${data.univers}` : 'In a world where everything seems ordinary';
  const power = pick(profile.powers);
  const obstacle = pick(profile.obstacles);
  const resolution = pick(profile.resolutions);
  const theme = pick(profile.themes);

  let s = `${univStr}, ${hero} is ${pick(profile.adjectives)}. `;

  if (data.premise && data.premise.trim().length > 15) {
    let p = data.premise.trim();
    p = p.charAt(0).toUpperCase() + p.slice(1);
    if (!/[.!?]$/.test(p)) p += '.';
    s += p + ' ';
  } else {
    s += `But fate had other plans, dragging them into an adventure that will force them to discover ${power}. `;
  }

  s += `Faced with ${obstacle}, ${hero} must draw on ${power} to have any hope of ${resolution}. `;
  s += `A story driven by ${theme} — one that will leave no reader unmoved.`;
  return s;
}

function buildHeroDesc(data, profile) {
  const hero = data.heros || 'The protagonist';
  if (data.heroDesc && data.heroDesc.trim().length > 10) {
    return data.heroDesc.trim();
  }
  return `${hero} possesses ${pick(profile.powers)}, an asset as precious as it is dangerous in a world that will show them no mercy.`;
}
