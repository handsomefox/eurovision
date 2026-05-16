import { describe, expect, it } from "vitest";
import esc2026Eu from "../src/data/contests/esc-2026-eu.json";
import { parseRankingImport } from "../src/lib/importRanking";
import type { Contest } from "../src/types";

const contest = esc2026Eu as Contest;

const pastedRanking = `1. 🇩🇰 Denmark: Søren Torpegaard Lund - Før Vi Går Hjem
2. 🇮🇱 Israel: Noam Bettan - Michelle
3. 🇷🇸 Serbia: LAVINA - Kraj Mene
4. 🇲🇹 Malta: AIDAN - Bella
5. 🇫🇮 Finland: Linda Lampenius x Pete Parkkonen - Liekinheitin
6. 🇱🇹 Lithuania: Lion Ceccah - Sólo Quiero Más
7. 🇦🇱 Albania: Alis Kallaçi - Nân
8. 🇺🇦 Ukraine: LELÉKA - Ridnym
9. 🇧🇬 Bulgaria: DARA - Bangaranga
10. 🇸🇪 Sweden: FELICIA - My System
11. 🇮🇹 Italy: Sal Da Vinci - Per Sempre Sì
12. 🇫🇷 France: Monroe - Regarde!
13. 🇦🇺 Australia: Delta Goodrem - Eclipse
14. 🇨🇾 Cyprus: Antigoni - JALLA
15. 🇳🇴 Norway: JONAS LOVV - YA YA YA
16. 🇷🇴 Romania: Alexandra Căpitănescu - Choke Me
17. 🇵🇱 Poland: ALICJA - Pray
18. 🇲🇩 Moldova: Satoshi - Viva, Moldova!
19. 🇦🇹 Austria: COSMÓ - Tanzschein
20. 🇨🇿 Czechia: Daniel Zizka - CROSSROADS
21. 🇬🇧 United Kingdom: LOOK MUM NO COMPUTER - Eins, Zwei, Drei
22. 🇧🇪 Belgium: ESSYLA - Dancing on the Ice
23. 🇬🇷 Greece: Akylas - Ferto
24. 🇭🇷 Croatia: LELEK - Andromeda
25. 🇩🇪 Germany: Sarah Engels - Fire`;

describe("parseRankingImport", () => {
  it("imports a copied numbered ranking in pasted order", () => {
    const result = parseRankingImport(pastedRanking, contest.entries);

    expect(result.unmatchedLines).toEqual([]);
    expect(result.ids).toEqual([
      "denmark",
      "israel",
      "serbia",
      "malta",
      "finland",
      "lithuania",
      "albania",
      "ukraine",
      "bulgaria",
      "sweden",
      "italy",
      "france",
      "australia",
      "cyprus",
      "norway",
      "romania",
      "poland",
      "moldova",
      "austria",
      "czechia",
      "united-kingdom",
      "belgium",
      "greece",
      "croatia",
      "germany"
    ]);
  });

  it("reports lines it cannot match", () => {
    const result = parseRankingImport("1. Atlantis: Nobody - Nowhere", contest.entries);

    expect(result.ids).toEqual([]);
    expect(result.unmatchedLines).toEqual(["1. Atlantis: Nobody - Nowhere"]);
  });
});
