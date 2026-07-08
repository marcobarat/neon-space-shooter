// Bestiario: mostri UNICI per mondo. BESTIARY[mondo][tipo] → funzione di
// disegno (ctx, e). I tipi derivati usano il disegno del genitore (con LOD
// interno su e.type/e.r); se un tipo compare fuori dal pool del suo mondo
// (es. kamikaze evocato da un boss), si usa il primo mondo che lo definisce.
import { W1 } from "./world1.js";
import { W2 } from "./world2.js";
import { W3 } from "./world3.js";
import { W4 } from "./world4.js";
import { W5 } from "./world5.js";

export const BESTIARY = [W1, W2, W3, W4, W5];

const ALIAS = { splitling: "splitter", shard: "asteroid", pebble: "asteroid" };

export function drawCreature(ctx, e) {
  const world = BESTIARY[(e.skin || 0) % BESTIARY.length];
  const key = ALIAS[e.type] || e.type;
  let fn = world[key];
  if (!fn) {
    for (const w of BESTIARY) {
      if (w[key]) { fn = w[key]; break; }
    }
  }
  (fn || BESTIARY[0].straight)(ctx, e);
}
