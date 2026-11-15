---
layout: minimal
title: "About 3D Files"
permalink: /stl/about/
---

<div class="lesson-crumbs">
  <a href="{{ '/stl/' | relative_url }}">&larr; Open the tool</a>
</div>

# 3D Files

Keep your 3D files in a GitHub repository or a Google Drive folder, look at them in your browser, and
add new ones, without installing anything.

## Just look at a file

Drag a `.stl`, `.3mf`, `.scad` or `.svg` file from your computer onto the page, or press **Preview a file**. It opens at once, with
everything below (measuring, overhangs, rendering a `.scad`), and it is not sent anywhere. Drop several files and they
are listed under **On your computer**. If a repository is open, **Upload to GitHub** on a file you dropped adds it there.

## Addresses

- `/stl/owner/repo` lists the repository's `.stl`, `.3mf`, `.scad` and `.svg` files.
- `/stl/owner/repo/branch` lists them for one branch. Without a branch, you get the repository's main branch.
- `/stl/owner/repo/branch/folder/part.stl` opens that file. Leave out the branch and it is `main`.

Share the address from the address bar: whoever opens it sees the same file.

## What you can do

- **Preview** an STL or 3MF file: turn it with the mouse, zoom, see its size in millimeters and its triangle count, and switch on a wireframe.
- **Render a `.scad` file.** Clicking one runs the real OpenSCAD in your browser and shows the model, with **Show code** to read the code and **Download STL** for the result. If it uses `include`, `use`, `import("x.stl")` or `surface`, the page fetches those files from the same folder of the same repository (at the same version, if you are looking at an older one), and the bar says how many it used. For a file you dropped in, the other files dropped with it are used, whatever their type (an `.stl`, `.svg`, `.png` or `.dat` it reads). Files it asks for but that are not there are listed. **Open in OpenSCAD** lets you edit it and save it back at [OpenSCAD in the Browser](/openscad/).
- **Upload** `.stl`, `.3mf`, `.scad` and `.svg` files (up to 50 MB each) with the Upload button or by dragging them onto the page. Pick the folder and write a short note about the change. A file with the same name is replaced, and GitHub keeps the old version in the repository's history.
- **Preview an SVG drawing.** `.svg` files are listed with the others and shown as a picture, with the size the file states in millimeters (96 pixels to the inch when it gives no unit). Set a **Height** and press **Extrude to 3D** and OpenSCAD turns the drawing into a solid (`linear_extrude`), which you can measure, check for overhangs and download as an STL. OpenSCAD ignores an SVG's colors, so every shape counts, filled or not. A `.scad` file can use an SVG the same way as any other file it reads: `import("logo.svg")`.
- **Measure it.** The panel at the bottom left gives the width (X), depth (Y) and height (Z, up). Switch between millimeters, centimeters and inches, and the page remembers your choice. An STL file has no units, so its numbers are taken as millimeters. A 3MF file says what unit it uses, and it is converted.
- **Check for overhangs.** Tick **Show overhangs steeper than 45&deg;** (top left; you can change the angle) to color in red the faces that point down too steeply and would need support when printed. Faces lying flat on the bed are not counted, and the panel says how much of the surface is red. Look from below to see them.
- **Find your way around.** The left panel starts in **Folders** mode: it shows the folders that hold 3D files, then the files in the folder you are in, with a path at the top you can click to go back up. **All files** lists every file in the repository at once. Typing in the search box looks through every folder, in either mode. The address follows you into folders, so you can share one.
- **Read the axes.** The X (red), Y (green) and Z (blue) axes run through the origin with about seven numbered marks each, in the unit you picked. The spacing changes to 1, 2, 5, 10 and so on as you switch between millimeters, centimeters and inches, so the numbers never crowd each other. Each axis runs at least one mark past the model. Untick **Show numbers on the axes** to hide them. They are the model's real coordinates, as in OpenSCAD.
- **Zoom.** The buttons in the top right zoom in (+) and out (&minus;), **Fit** centers the model and fills the view, and **Under** looks from below, where overhangs are. The mouse works too: drag to turn, scroll to zoom, right-drag to move.
- **See which way is which.** The small **X Y Z arrows** in the bottom right corner turn with the model. Untick **Show X Y Z arrows** to hide them.
- **Download** any file.

## Google Drive (switched off for now)

Google Drive is turned off. To try it, add `?gdrive=1` to the address: `https://learn.porttack.com/stl/?gdrive=1`. That turns it
on in this browser (it is remembered), and a **GitHub | Google Drive** switch appears above the file list. Add `?gdrive=0` to turn
it off again. Nobody sees it unless they do this, and it cannot sign in until the setup below is done.

Press **Google Drive** above the file list, then **Sign in with Google** (use your school account). Then press **My Drive** or **Shared with me**,
or paste the link of a Drive folder. You see the folders and the `.stl`, `.3mf`, `.scad` and `.svg` files in them, one folder at a time,
with a path at the top to click back up. Everything else works the same as for GitHub: measuring, overhangs, rendering a `.scad`,
**Upload** (a file with the same name is replaced) and **History** (the earlier versions Drive kept). The address
`/stl/gdrive/FOLDERID` opens a folder after you sign in.

The page asks Google for permission to see and change your Drive files, because it has to list folders and write into them. The sign-in
lasts about an hour and is kept only while the page is open: it is never saved. Google's sign-in script is loaded only when you press
Google Drive.

## Google Drive setup (for the teacher)

Google lets a web page use Drive only when the page is registered as an app, once:

1. In the [Google Cloud console](https://console.cloud.google.com/), make a project (any name).
2. **APIs and services, Library:** turn on **Google Drive API**.
3. **OAuth consent screen:** choose **Internal** if you use a Google Workspace school account, so only people in your domain can sign in and Google does not need to review the app. Add the scope `.../auth/drive`.
4. **Credentials, Create credentials, OAuth client ID,** type **Web application**. Under **Authorized JavaScript origins** add `https://learn.porttack.com` (and `http://localhost:4010` to try it locally). No redirect address is needed.
5. Copy the **Client ID** (it ends in `.apps.googleusercontent.com`) and put it in `GOOGLE_CLIENT_ID` near the top of the Drive section in `stl/index.html`. It is public, not a secret. To try it first, paste it into the box that appears under **Sign in with Google**.
6. Your Workspace admin may need to allow the app for student accounts (Admin console, Security, API controls).

## Your GitHub token

Looking at a public repository needs no sign-in. Uploading, and looking at a private repository, needs a
personal access token. Make a [fine-grained token](https://github.com/settings/personal-access-tokens/new)
for just that repository with **Contents: Read and write**, and let it expire soon.

The GitHub token goes only to GitHub. Once GitHub accepts it, this browser remembers it for that one repository,
and the OpenSCAD page uses the same one. **Forget token** removes it. Do not save a token on a shared computer.

## Privacy

Your files are not sent anywhere except to the GitHub repository or Google Drive folder you choose. The page loads the
three.js library from a public library host, the same way the OpenSCAD page does. That host never receives your files.
