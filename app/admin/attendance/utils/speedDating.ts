// speedDating.ts
import { Attendee, Pairing, Bye, RoundResult } from './types';

export class SpeedDatingEvent {
  private attendees: Attendee[];
  private previousPairings: Set<string>;
  private males: Attendee[];
  private females: Attendee[];
  private rounds: RoundResult[] = [];
  private readonly forbiddenPenalty = 1000000;

  constructor(attendees: Attendee[], previousPairings: Array<[string, string]> = []) {
    this.attendees = attendees;
    this.previousPairings = new Set(
      previousPairings.map(p => this.getPairKey(p[0], p[1]))
    );
    
    // Initialize attendee properties
    this.attendees.forEach(person => {
      person.bye_count = person.bye_count || 0;
      person.consecutive_byes = person.consecutive_byes || 0;
      person.dates = person.dates || [];
    });

    // Partition attendees by gender
    this.males = attendees.filter(p => p.gender === 'M');
    this.females = attendees.filter(p => p.gender === 'F');
  }

  private getPairKey(maleId: string, femaleId: string): string {
    // Consistent key format for checking duplicates
    return `${maleId}|${femaleId}`;
  }

  private computeLoss(male: Attendee, female: Attendee): number {
    // Check if they've already been paired
    const pairKey = this.getPairKey(male.id, female.id);
    if (this.previousPairings.has(pairKey)) {
      return this.forbiddenPenalty;
    }

    // Age-based loss only (location removed)
    const ageDiff = female.age - male.age; // positive if female is older
    
    if (Math.abs(ageDiff) <= 10) {
      return 0;
    } else if (ageDiff < 0) { // male is more than 10 years older
      return (-ageDiff) - 10;
    } else { // female is more than 10 years older
      return Math.exp((ageDiff - 10) / 2) - 1;
    }
  }

  private byePenalty(person: Attendee): number {
    const base = 50;
    return base + 30 * (person.bye_count || 0) + 70 * (person.consecutive_byes || 0);
  }

  private linearSumAssignment(costMatrix: number[][]): [number[], number[]] {
    const n = costMatrix.length;
    const m = costMatrix[0].length;
    
    // Simple greedy assignment for small matrices
    if (n <= 10 && m <= 10) {
      // For small matrices, try all permutations
      const permutations = this.getPermutations(Array.from({length: m}, (_, i) => i), n);
      let bestCost = Infinity;
      let bestPerm: number[] = [];
      
      for (const perm of permutations) {
        const cost = perm.reduce((sum, j, i) => sum + costMatrix[i][j], 0);
        if (cost < bestCost) {
          bestCost = cost;
          bestPerm = perm;
        }
      }
      
      return [Array.from({length: n}, (_, i) => i), bestPerm];
    } else {
      // Hungarian algorithm approximation for larger matrices
      const rowInd: number[] = [];
      const colInd: number[] = [];
      const usedRows = new Set<number>();
      const usedCols = new Set<number>();
      
      // Create a list of all (i, j, cost) triplets and sort by cost
      const allPairs: Array<{i: number, j: number, cost: number}> = [];
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
          allPairs.push({i, j, cost: costMatrix[i][j]});
        }
      }
      allPairs.sort((a, b) => a.cost - b.cost);
      
      // Greedily assign lowest cost pairs
      for (const pair of allPairs) {
        if (!usedRows.has(pair.i) && !usedCols.has(pair.j)) {
          rowInd.push(pair.i);
          colInd.push(pair.j);
          usedRows.add(pair.i);
          usedCols.add(pair.j);
          
          if (rowInd.length === n) break;
        }
      }
      
      return [rowInd, colInd];
    }
  }

  private getPermutations(arr: number[], r: number): number[][] {
    if (r === 1) return arr.map(el => [el]);
    if (r > arr.length) return [];
    
    const result: number[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      const perms = this.getPermutations(rest, r - 1);
      for (const perm of perms) {
        result.push([arr[i], ...perm]);
      }
    }
    return result;
  }

  private assignPairings(
    candidateGroup: Attendee[],
    anchorGroup: Attendee[],
    candidateIsMale: boolean,
    roundNum: number
  ): { pairings: Pairing[], byes: Bye[] } {
    const A = anchorGroup.length;
    const C = candidateGroup.length;
    const costMatrix: number[][] = Array(C).fill(null).map(() => Array(C).fill(0));
    
    for (let i = 0; i < C; i++) {
      const candidate = candidateGroup[i];
      for (let j = 0; j < C; j++) {
        if (j < A) {
          const anchor = anchorGroup[j];
          
          if (candidateIsMale) {
            costMatrix[i][j] = this.computeLoss(candidate, anchor);
          } else {
            costMatrix[i][j] = this.computeLoss(anchor, candidate);
          }
        } else {
          // Bye column
          costMatrix[i][j] = this.byePenalty(candidate);
        }
      }
    }
    
    const [rowInd, colInd] = this.linearSumAssignment(costMatrix);
    const pairings: Pairing[] = [];
    const byes: Bye[] = [];
    
    for (let idx = 0; idx < rowInd.length; idx++) {
      const i = rowInd[idx];
      const j = colInd[idx];
      const candidate = candidateGroup[i];
      
      if (j < A) {
        const anchor = anchorGroup[j];
        
        const pairing: Pairing = candidateIsMale ? {
          round: roundNum,
          male_id: candidate.id,
          female_id: anchor.id,
          male_name: candidate.name,
          female_name: anchor.name,
          male_age: candidate.age,
          female_age: anchor.age,
          age_diff: Math.abs(candidate.age - anchor.age),
          cost: costMatrix[i][j]
        } : {
          round: roundNum,
          male_id: anchor.id,
          female_id: candidate.id,
          male_name: anchor.name,
          female_name: candidate.name,
          male_age: anchor.age,
          female_age: candidate.age,
          age_diff: Math.abs(anchor.age - candidate.age),
          cost: costMatrix[i][j]
        };
        
        pairings.push(pairing);
        candidate.consecutive_byes = 0;
        anchor.consecutive_byes = 0;
        
        // Record pairing with consistent key format
        const pairKey = candidateIsMale 
          ? this.getPairKey(candidate.id, anchor.id)
          : this.getPairKey(anchor.id, candidate.id);
        this.previousPairings.add(pairKey);
        
        // Track dates
        candidate.dates!.push(anchor.name);
        anchor.dates!.push(candidate.name);
      } else {
        // Bye
        byes.push({
          round: roundNum,
          attendee_id: candidate.id,
          attendee_name: candidate.name,
          bye_penalty: costMatrix[i][j]
        });
        candidate.bye_count! += 1;
        candidate.consecutive_byes! += 1;
      }
    }
    
    return { pairings, byes };
  }

  public runRounds(numRounds: number): RoundResult[] {
    for (let roundNum = 1; roundNum <= numRounds; roundNum++) {
      const roundResult: RoundResult = {
        round: roundNum,
        pairings: [],
        byes: []
      };
      
      const numMales = this.males.length;
      const numFemales = this.females.length;
      
      if (numMales === numFemales) {
        // Balanced groups
        const costMatrix: number[][] = Array(numMales).fill(null)
          .map(() => Array(numFemales).fill(0));
        
        for (let i = 0; i < numMales; i++) {
          for (let j = 0; j < numFemales; j++) {
            const male = this.males[i];
            const female = this.females[j];
            costMatrix[i][j] = this.computeLoss(male, female);
          }
        }
        
        const [rowInd, colInd] = this.linearSumAssignment(costMatrix);
        
        for (let idx = 0; idx < rowInd.length; idx++) {
          const i = rowInd[idx];
          const j = colInd[idx];
          const male = this.males[i];
          const female = this.females[j];
          
          const pairing: Pairing = {
            round: roundNum,
            male_id: male.id,
            female_id: female.id,
            male_name: male.name,
            female_name: female.name,
            male_age: male.age,
            female_age: female.age,
            age_diff: Math.abs(male.age - female.age),
            cost: costMatrix[i][j]
          };
          
          roundResult.pairings.push(pairing);
          male.consecutive_byes = 0;
          female.consecutive_byes = 0;
          male.dates!.push(female.name);
          female.dates!.push(male.name);
          
          // Add to previous pairings with consistent key
          const pairKey = this.getPairKey(male.id, female.id);
          this.previousPairings.add(pairKey);
        }
      } else if (numMales > numFemales) {
        // More males than females
        const { pairings, byes } = this.assignPairings(
          this.males,
          this.females,
          true,
          roundNum
        );
        roundResult.pairings = pairings;
        roundResult.byes = byes;
      } else {
        // More females than males
        const { pairings, byes } = this.assignPairings(
          this.females,
          this.males,
          false,
          roundNum
        );
        roundResult.pairings = pairings;
        roundResult.byes = byes;
      }
      
      this.rounds.push(roundResult);
    }
    
    return this.rounds;
  }

  public getFormattedResults(): { detailed: string, simplified: string } {
    let detailed = '';
    let simplified = '';
    
    // Detailed results
    for (const round of this.rounds) {
      detailed += `${'='.repeat(20)} **ROUND ${round.round}** ${'='.repeat(20)}\n`;
      simplified += `${'='.repeat(20)} **ROUND ${round.round}** ${'='.repeat(20)}\n`;
      
      if (round.pairings.length > 0) {
        detailed += 'Pairings:\n';
        round.pairings.forEach((pairing, index) => {
          detailed += `  ${pairing.male_name} (M, age ${pairing.male_age}) - `;
          detailed += `${pairing.female_name} (F, age ${pairing.female_age})\n`;
          detailed += `    Age gap: ${pairing.age_diff}, Cost: ${pairing.cost.toFixed(2)}\n`;
          
          simplified += `  Room ${index + 1}: ${pairing.male_name} - ${pairing.female_name}\n`;
        });
      }
      
      if (round.byes.length > 0) {
        detailed += 'Byes:\n';
        round.byes.forEach(bye => {
          detailed += `  ${bye.attendee_name} received a bye (penalty: ${bye.bye_penalty.toFixed(2)})\n`;
        });
        
        simplified += `  Byes: ${round.byes.map(b => b.attendee_name).join(', ')}\n`;
      }
      
      detailed += '\n';
      simplified += '\n';
    }
    
    // Add participant statistics to detailed
    detailed += `${'='.repeat(20)} **PARTICIPANT STATISTICS** ${'='.repeat(20)}\n`;
    for (const person of this.attendees) {
      detailed += `Participant: ${person.name} (Gender: ${person.gender}, Age: ${person.age})\n`;
      detailed += `  Total Dates: ${person.dates?.length || 0}\n`;
      detailed += `  Date Partners: ${person.dates?.join(', ') || 'None'}\n`;
      detailed += `  Total Byes: ${person.bye_count || 0}\n`;
      detailed += `  Consecutive Byes: ${person.consecutive_byes || 0}\n\n`;
    }
    
    return { detailed, simplified };
  }
}

// Utility function for Next.js API route
export function runSpeedDatingEvent(
  attendees: Attendee[],
  numRounds: number = 8,
  previousPairings: Array<[string, string]> = []
): { detailed: string, simplified: string, rounds: RoundResult[] } {
  const event = new SpeedDatingEvent(attendees, previousPairings);
  const rounds = event.runRounds(numRounds);
  const { detailed, simplified } = event.getFormattedResults();
  
  return {
    detailed,
    simplified,
    rounds
  };
}