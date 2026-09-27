// Generates creature-sorting questions in the same schema as the fixed
// worksheet in _data/unplugged/creature_sorting.yml, so one renderer draws
// both. See creatures.js for the trait/creature model and expression parser.

import { TRAIT_NAMES, matchSet, formatExpr } from "./creatures.js";

export const LEVELS = {
  one: { label: "One operator (AND, OR, or NOT)" },
  two: { label: "Two operators" },
  parens: { label: "Parentheses and NOT" },
};

const T = (name) => ({ t: "trait", name });
const NOT = (a) => ({ t: "not", a });
const AND = (a, b) => ({ t: "and", a, b });
const OR = (a, b) => ({ t: "or", a, b });

// n distinct random trait nodes.
function traits(rng, n) {
  return rng.shuffle(TRAIT_NAMES).slice(0, n).map(T);
}

function buildOne(rng) {
  const form = rng.pick(["not", "and", "or"]);
  if (form === "not") return NOT(traits(rng, 1)[0]);
  const [a, b] = traits(rng, 2);
  return form === "and" ? AND(a, b) : OR(a, b);
}

function buildTwo(rng) {
  const form = rng.pick(["and3", "or3", "and-not", "or-not", "not-and", "not-or"]);
  if (form === "and3") {
    const [a, b, c] = traits(rng, 3);
    return AND(AND(a, b), c);
  }
  if (form === "or3") {
    const [a, b, c] = traits(rng, 3);
    return OR(OR(a, b), c);
  }
  const [a, b] = traits(rng, 2);
  if (form === "and-not") return AND(a, NOT(b));
  if (form === "or-not") return OR(a, NOT(b));
  if (form === "not-and") return AND(NOT(a), b);
  return OR(NOT(a), b);
}

function buildParens(rng) {
  const form = rng.pick(["not-and", "not-or", "and-or", "not-and-or"]);
  const [a, b, c] = traits(rng, 3);
  if (form === "not-and") return NOT(AND(a, b));
  if (form === "not-or") return NOT(OR(a, b));
  if (form === "and-or") return AND(a, OR(b, c));
  return AND(NOT(a), OR(b, c));
}

const BUILDERS = { one: buildOne, two: buildTwo, parens: buildParens };

// Builds a random AST at the given level whose true set is neither empty
// nor all 16 creatures -- either extreme makes for a useless question,
// since circling "none" or "all of them" needs no understanding of the
// expression at all.
function buildNontrivial(rng, level) {
  const build = BUILDERS[level] || BUILDERS.two;
  for (let attempt = 0; attempt < 40; attempt++) {
    const node = build(rng);
    const answer = matchSet(node);
    if (answer.length > 0 && answer.length < 16) return { node, answer };
  }
  throw new Error(`Couldn't build a non-trivial expression at level "${level}"`);
}

export function generateEvalQuestion(rng, level) {
  const { node, answer } = buildNontrivial(rng, level);
  return { kind: "evaluate", expr: formatExpr(node, "AP"), answer };
}

export function generateReverseQuestion(rng, level) {
  const { node, answer } = buildNontrivial(rng, level);
  return { kind: "reverse", marked: answer, key: formatExpr(node, "AP") };
}

// A whole set: `count` Part A questions plus two Part B (reverse) puzzles.
// Question i draws from its own forked generator, so changing the count
// doesn't reshuffle the earlier questions.
export function generateSet(rng, { level = "two", count = 8 } = {}) {
  const partA = [];
  for (let i = 0; i < count; i++) partA.push(generateEvalQuestion(rng.fork(i + 1), level));
  const partB = [generateReverseQuestion(rng.fork(count + 1), level), generateReverseQuestion(rng.fork(count + 2), level)];
  return { partA, partB };
}
