---
layout: minimal
title: "About OpenSCAD in the Browser"
permalink: /openscad/about/
---

<div class="lesson-crumbs">
  <a href="{{ '/openscad/' | relative_url }}">&larr; Open the tool</a>
</div>

<div class="lesson" markdown="1">

# About OpenSCAD in the Browser

## What this is

A page where you type OpenSCAD code and watch the 3D model appear next to it.
It is the real OpenSCAD, running inside your browser, so a script that works on
your own computer works here too, and the other way around. When you like the
model, **File, Download STL** gives you a file a 3D printer's software can read.

Everything stays on your computer. Your code is not sent anywhere, and there is
nothing to install and no account to make.

## What you can do here

- **Write and run code.** Colors for the parts of the language, automatic
  indenting, and suggestions as you type (try typing `cyl`). Press Ctrl or
  Cmd and Enter to render.
- **Open and save `.scad` files from your computer.** In Chrome you can install this page as an app (the menu, Cast, save and share, Install page as app). Then Finder's Open With lists it for `.scad` files, and **File, Save to the file** (Ctrl or Cmd and S) writes your changes back to that file.
- **Keep many drawings.** Give a drawing a name and it is saved in this browser
  as you type. **File, My drawings** lists all of them, and you can back them
  up to a file and restore them later.
- **Share through GitHub.** **File, Open from GitHub** opens a `.scad` file from a
  repository (public, or private with a token) when you paste its link, or lists all the `.scad` files in a
  repository when you paste the repository's link. **File, Save to GitHub** puts your
  drawing in a repository with a note about the change. If you changed a file
  that someone else also changed, it stops and tells you instead of erasing
  their work.
- **Open a GitHub file by its address.** Go to `/openscad/owner/repo/branch/folder/part.scad` to open
  that file (leave out the branch and it is `main`). Go to `/openscad/owner/repo` (or add a
  branch and folder) to get a list of the repository's `.scad` files to pick from. If the
  repository is private you are asked for a token once.
- **Use other files.** A drawing opened from GitHub can `include <parts.scad>`, `use <lib/gear.scad>`, `import("bracket.stl")`,
  `import("logo.svg")` (a 2D drawing, which you can `linear_extrude` or `rotate_extrude`) and `surface("map.png")` (a PNG picture or a `.dat` table of heights). When you press Render, the page fetches those files from the same folder of the same repository
  (and from `../` and subfolders), and the engine finds them as it would on a computer. This works for `.scad`, `.stl`, `.3mf`, `.svg` and other
  files OpenSCAD can import. OpenSCAD ignores an SVG's colors: every shape in it counts, filled or not. Names built in code, like `import(str(name, ".stl"))`, are not found, and neither are OpenSCAD's own
  libraries (MCAD, BOSL). A drawing that did not come from GitHub cannot find other files, and the messages under the code say so.
  The files are remembered for a minute, so a repeat render does not fetch them again.
- **See the history.** **File, History on GitHub** lists the commits that changed the
  drawing's GitHub file, newest first, with the date, who made it and the note. **Open this
  version** loads an old one as a separate new drawing, and **On GitHub** shows what changed.
- **Share a link.** **File, Copy share link** makes a link with your exact code. If
  the drawing came from a GitHub file, the link remembers that file, so the person
  you send it to can change the code and save it back with their own token.
  **Copy link to the GitHub file** makes a link that opens the file as it is on
  GitHub right now.
- <a id="gists"></a>**Share as a public gist.** **File, Share as public gist** puts your drawing in a new
  [gist](https://gist.github.com/) on your GitHub account (a gist is one file with its own address,
  with no repository to set up) and copies a link that opens it here: `/openscad/#gist=<id>`.
  Anyone can open that link, or paste a gist address into **File, Open from GitHub**, and it
  becomes their own drawing. **File, Save to gist** saves their changes. If the gist is yours it is
  updated. If it belongs to someone else, GitHub makes **your own copy** of it (a fork) and the
  changes go there, so nobody can change a gist that is not theirs. Your drawing is then tied to
  your copy, and **Copy link to the gist** gives the link to share it. If the gist changed after you
  opened it, you are told before anything is replaced.
- **Move a drawing to Python.** **File, Open in Python 3D Studio** turns the drawing into
  Python code and opens it in [Python in 3D Studio](/python3d/studio/) in a new tab. Python 3D
  has fewer features than OpenSCAD, so it converts what it can (shapes, moving, turning,
  colors, combining and cutting, extruding, variables, loops, modules) and leaves a `# NOTE:`
  comment where it could not, for example `mirror`, `hull` and `minkowski`. Read the result
  over; it is a starting point.
- **Look at the model.** Turn it, zoom, fit it to the window, look from below,
  show scale numbers on the axes, and show its size and center.
- **Check it for printing.** **Print, Show overhangs** paints in red the faces
  that tilt too far out and would need support, and tells you how many square
  millimeters that is. **Auto-orient** tries the faces of the model as its
  bottom and keeps the way up that needs the least support.

## Make a GitHub token for one repository {#github-token}

You only need a token to open a file from a **private** repository, or to save changes back to
any repository. A public repository opens without one. If someone sent you a link here and the page
asked for a token, follow these steps. It takes about two minutes, and you only do it once per repository.

1. Sign in to GitHub, then open
   [this "new token" form](https://github.com/settings/personal-access-tokens/new?name=openscad&expires_in=365&contents=read).
   It already has the name `openscad`, a one year expiry and **Contents: Read-only** filled in.
   (To also save changes, use [this one](https://github.com/settings/personal-access-tokens/new?name=openscad&expires_in=365&contents=write) instead.
   If you know the owner, add `&target_name=owner` to the address.)
2. **Token name:** anything you will recognize, for example `openscad`.
3. **Expiration:** one year (already set). When it expires, make a new one.
4. **Resource owner:** choose the person or organization that owns the repository. (If the repository
   belongs to an organization and it is not listed, ask the owner to allow tokens, or to make the token for you.)
5. **Repository access:** choose **Only select repositories**, then pick the one repository you need.
   Do not choose All repositories.
6. Check **Permissions**, then **Repository permissions**, and find **Contents**.
   - To only **open** files, set it to **Read-only**.
   - To also **save** changes, set it to **Read and write**.
   (GitHub adds **Metadata: Read-only** by itself. That is fine.)
7. Press **Generate token**, then **copy the token** now. It starts with `github_pat_` and GitHub shows
   it only once.
8. Back in OpenSCAD, paste it into the **Personal access token** box and press **Open** (or **Save to GitHub**).

What to expect:

- The token is sent only to GitHub. Once GitHub accepts it, this browser remembers it for that one
  repository, so you are not asked again. **Forget saved token** in the dialog removes it.
- Do not save a token on a shared computer, and never post it in a chat, an email or a file. If you
  think it leaked, delete it in GitHub's token list and make a new one.
- "GitHub did not accept that token" means part of it was not copied, or it has expired.
  "Cannot find that file" usually means the token was made for a different repository, or it has no
  Contents permission.

**Sharing a file that needs a token:** send the link
`https://learn.porttack.com/openscad/owner/repo/branch/folder/part.scad` (with the real names). It opens
the file at once, and asks for a token only if the repository is private. In your message, point to
this section: `https://learn.porttack.com/openscad/about/#github-token`

## Why OpenSCAD matters

Most 3D design programs are about dragging shapes with a mouse. OpenSCAD is
about describing a shape with numbers and words, and that changes what you can
do.

- **It is exact.** A hole that is 10.8 mm is 10.8 mm, not "about that size on
  the screen." Parts that must fit together, such as a cap that slides into a
  tube and squeezes an O-ring, depend on numbers like that.
- **Change one number, change the whole part.** Put the tube size at the top as
  a variable and every other measurement follows. This is called a parametric
  design, and it is how one design becomes ten sizes.
- **Your design is a text file.** You can copy it, share it, compare two
  versions, and keep it for years. Nothing is hidden inside a mouse movement.
- **It teaches real programming.** Variables, loops, if statements, functions
  and your own modules are all in it, and the result is something you can hold
  after it prints.
- **It is free and open.** Anyone can use it, read how it works, and add to it.
  Many people who share 3D printable designs write them in OpenSCAD.

It also pairs with the rest of this site. [Python in 3D]({{ '/python3d/' | relative_url }})
uses the same ideas (shapes, translate, rotate, difference) written in Python.
If you can write one, the other will feel familiar.

## What is under the hood

| Part | What it does | License |
|---|---|---|
| OpenSCAD (a snapshot dated 2025-01-19, built for the web) | Reads your code and builds the model. It uses the Manifold geometry library for fast cutting and joining of shapes. | GPL-2.0-or-later (Manifold: Apache-2.0) |
| DejaVu fonts | The letters used by `text()`. | Free (Bitstream Vera license) |
| WebAssembly and a Web Worker | WebAssembly lets the program written for desktops run in a browser. The worker runs it off the main page, so the page stays responsive and **Stop** works if a script never finishes. | Part of the browser |
| CodeMirror 6 | The editor: colors, indenting, suggestions, undo. | MIT |
| three.js | Draws the 3D model, the grid, the axes and the arrows. | MIT |
| lz-string | Squeezes your code into a share link. | MIT |
| Your browser's local storage | Keeps your named drawings on this computer. | Part of the browser |

The OpenSCAD engine is copied, unchanged, from the open source package
[openscad-wasm-prebuilt](https://github.com/lorenzowritescode/openscad-wasm),
which compiles [OpenSCAD](https://openscad.org) for the web. The overhang check
and auto-orient are this page's own code: they look at the triangles of the
finished model, they are not part of OpenSCAD.

## Licensing

- **OpenSCAD is free software under the GNU General Public License, version 2
  or later.** The engine file on this site is that program, so it comes with
  its license text and the sources are linked above. This is why the tool lives
  in its own folder, separate from the lessons.
- **What you make is yours.** The code you write and the STL files you download
  belong to you, to use and share as you like.
- **This page's own wrapper** (the page, the editor setup and the viewer code)
  is the work of the course teacher and is part of this site.

## Privacy

- Your code and drawings are never sent to a server. They live in this
  browser's local storage, on this computer, and are gone if the site's data is
  cleared. Use **File, My drawings, Back up all** for anything you care about.
- Saving to GitHub or to a gist needs a personal access token, and so does
  opening a file from a private repository (a public one needs no token). The token is sent only
  to GitHub. Once GitHub accepts it, this browser's local storage remembers it for that one
  `owner/repo` on this site, so you are not asked again. **Forget saved token** in the Open and
  Save dialogs removes it (the gist dialog keeps one token for all gists), and so does clearing the site's data. Anyone who can use this browser
  profile can use the token, so do not save one on a shared computer. Make the token for
  one repository only, with permission to write contents, and a one year expiry.

- The page does load two small code libraries (three.js and lz-string) from a
  public library host, the same way the Python in 3D pages do. That host can see
  that a page asked for them, as any host would, but it never receives your
  code.

## What is not here yet

- **Fonts:** `text()` works with three fonts: DejaVu Sans, DejaVu Sans Bold and
  DejaVu Sans Mono. Use them by name, for example
  `text("Hi", font="DejaVu Sans:style=Bold")`. Other fonts are not included, and
  the fonts are downloaded only when your script uses `text()`.
- **Libraries:** `use <...>` and `include <...>` of outside libraries (such as
  MCAD or BOSL) do not work, and neither does `import()` of a file. Everything
  has to be in your one script.
- **GitHub:** each file is opened or saved on its own, and nothing else in the
  repository is fetched yet, so `use <other.scad>` still does not work.
- **Size:** the first time you open the page it downloads the engine, which is
  about 11 MB. After that your browser keeps it.
- **Overhangs:** the red faces are a guide. A real 3D printer's software has the
  final say about what needs support, and a face exactly at the limit is treated
  as printable.

## Where to learn OpenSCAD

- The [OpenSCAD cheatsheet](https://openscad.org/cheatsheet/) is one page with
  every command. It is also in the **Help** menu.
- The [OpenSCAD documentation](https://openscad.org/documentation.html) has a
  full manual and tutorials.
- In the tool, **File, Example: overhang test** is a small script that shows
  what the overhang check does.

</div>

<style>
  .lesson-crumbs { max-width: 720px; font-size: 0.85rem; }
  .lesson-crumbs a { color: #2a7ae2; text-decoration: none; }
  .lesson-crumbs a:hover { text-decoration: underline; }
  .lesson { max-width: 720px; }
  .lesson h1 { margin-top: 8px; }
  .lesson h2 { margin-top: 1.6em; padding-bottom: 0.3em; border-bottom: 1px solid #d0d7de; }
  .lesson table { font-size: 0.9rem; }
</style>
