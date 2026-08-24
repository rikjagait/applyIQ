const encouragements=[
  "You do not need to see the whole path—just take the next confident step.",
  "Your experience has value, and the right team will recognize it.",
  "Small, focused actions today can open remarkable doors tomorrow.",
  "You are bringing more strength and possibility to this search than you realize.",
  "The right opportunity is looking for someone with exactly your perspective.",
  "Progress counts, especially when it is built one thoughtful step at a time.",
  "Trust the experience you have earned and the direction you are choosing.",
  "Every application is a chance to make your strengths easier to discover.",
  "There is room for both patience and ambition in a meaningful career move.",
  "Today is another opportunity to move closer to work that feels right.",
  "Your next chapter can be both purposeful and exciting.",
  "You are allowed to aim for work that values your whole contribution.",
  "Momentum begins with one clear, manageable action.",
  "Your career story is still growing—and the best parts may be ahead.",
];

export function greetingForHour(hour:number){return hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";}
export function encouragementForDate(date:Date){const key=Number(`${date.getFullYear()}${String(date.getMonth()+1).padStart(2,"0")}${String(date.getDate()).padStart(2,"0")}`);return encouragements[key%encouragements.length];}

