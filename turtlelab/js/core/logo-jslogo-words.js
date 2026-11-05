// TurtleLab: the words JSLogo already knows, so none of your blocks is given one of them as its name there.
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// MADE from the interpreter in ../../logo by asking it for its list of built-in words (test/logo.test.js checks
// it is still the same list, so if JSLogo is ever updated the test says to make this again). Lower case.

export const JSLOGO_WORDS = new Set([
  "abs", "and", "apply", "arc", "arctan", "arity", "array", "array?", "arrayp", "arraytolist", "ascii",
  "ashift", "ask", "back", "background", "before?", "beforep", "bf", "bfs", "bg", "bitand", "bitcut",
  "bitnot", "bitor", "bitpaste", "bitxor", "bk", "bl", "bounds", "buried", "buried?", "buriedp", "bury",
  "buryall", "buryname", "butfirst", "butfirsts", "butlast", "button", "button?", "buttonp", "bye", "case",
  "catch", "char", "clean", "clearscreen", "cleartext", "clearturtles", "clickpos", "combine", "cond",
  "contents", "copydef", "cos", "count", "crossmap", "cs", "ct", "decreasefont", "def", "define", "defined?",
  "definedp", "dequeue", "difference", "do.until", "do.while", "dotimes", "empty?", "emptyp", "equal?",
  "equalp", "erall", "erase", "ern", "erns", "erpl", "erpls", "erps", "error", "exp", "false", "fd", "fence",
  "fill", "filled", "filter", "find", "first", "firsts", "font", "for", "foreach", "forever", "form",
  "forward", "fput", "gensym", "getsc", "getscreencolor", "global", "globals", "gprop", "greater?",
  "greaterequal?", "greaterequalp", "greaterp", "heading", "hideturtle", "home", "ht", "if", "ifelse", "iff",
  "iffalse", "ift", "iftrue", "ignore", "increasefont", "int", "invoke", "iseq", "item", "label",
  "labelfont", "labelsize", "last", "left", "less?", "lessequal?", "lessequalp", "lessp", "list", "list?",
  "listp", "listtoarray", "ln", "local", "localmake", "log10", "lowercase", "lput", "lshift", "lt", "make",
  "map", "map.se", "mdarray", "mditem", "mdsetitem", "member", "member?", "memberp", "minus", "modulo",
  "mousepos", "name", "name?", "namelist", "namep", "names", "not", "notequal?", "notequalp", "number?",
  "numberp", "numberwang", "op", "or", "output", "palette", "parse", "pc", "pd", "pe", "pencolor", "pendown",
  "pendown?", "pendownp", "penerase", "penmode", "penpaint", "penreverse", "pensize", "penup", "pick",
  "plist", "plist?", "plistp", "plists", "pllist", "pop", "pos", "power", "pprop", "ppt", "pr", "primitive?",
  "primitivep", "primitives", "print", "procedure?", "procedurep", "procedures", "product", "pu", "push",
  "px", "queue", "quoted", "quotient", "radarctan", "radcos", "radsin", "radtan", "random", "readlist",
  "readword", "reduce", "remainder", "remdup", "remove", "remprop", "repcount", "repeat", "rerandom",
  "reverse", "right", "round", "rseq", "rt", "run", "runparse", "runresult", "scrunch", "se", "sentence",
  "setbackground", "setbg", "setcolor", "setfont", "seth", "setheading", "setitem", "setlabelfont",
  "setlabelheight", "setpalette", "setpc", "setpencolor", "setpensize", "setpos", "setpw", "setsc",
  "setscreencolor", "setscrunch", "settextcolor", "settextsize", "setturtle", "setwidth", "setx", "setxy",
  "sety", "show", "shown?", "shownp", "showturtle", "sin", "split", "sqrt", "st", "standout", "stepped",
  "stop", "substring?", "substringp", "sum", "tan", "test", "text", "textcolor", "textsize", "thing",
  "throw", "to", "touches", "towards", "traced", "true", "turtle", "turtlemode", "turtles", "type", "unbury",
  "unburyall", "unburyname", "until", "uppercase", "wait", "while", "window", "word", "word?", "wordp",
  "wrap", "xcor", "xor", "ycor",
]);
