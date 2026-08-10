---
layout: default
title: Privacy Policy
permalink: /privacy/
---

# Privacy Policy

Effective date: August 10, 2026

## Short version

This site does not collect, store, or transmit any personal information
from anyone who visits it. There are no accounts, no forms, and no
analytics or tracking scripts. Almost every page is a static file with
nowhere for visitor data to go, even if that were the intent.

The one exception is the Working in Python pathway, which embeds an
in-browser Python environment (JupyterLite) so you can run notebooks
live. That environment uses your browser's own local storage to save
your work between visits. That storage stays entirely on your device
and is never transmitted to any server. It is explained in full below.

## Why that is true, technically

This site is built with [Jekyll](https://jekyllrb.com/) and published
through [GitHub Pages](https://pages.github.com/). At publish time,
every page is compiled once into a plain HTML file. Those files are
pushed to GitHub, and GitHub Pages serves those exact, unchanging files
to every visitor's browser.

That means:

- **There is no server-side application.** No code runs per visitor,
  per request, or at all, on any server under anyone's control. Where a
  page needs to run code, such as the in-browser Python notebooks
  described below, that execution happens entirely inside the visitor's
  own browser, not on a server.
- **There is no database.** A database exists to give an application
  somewhere to write data. There is no application here, so there is
  nothing to write to and nothing that persists between visits.
- **There are no forms or submission handlers.** Nothing on this site
  asks a visitor to type in a name, email address, or any other
  information, because there is no code path that could do anything
  with it if they did.
- **The entire site is public source.** Every file that produces every
  page is visible in the public repository at
  [github.com/porttack/learn](https://github.com/porttack/learn). There
  is no hidden logic. Anyone can verify this policy by reading the
  source directly, or by viewing a page's source in their browser.

In short, this is not a case of "we promise not to look at the data."
There is no mechanism by which data could be collected in the first
place.

## What is not on this site

- No user accounts or login of any kind
- No analytics (for example, Google Analytics), tracking pixels, or
  advertising code
- No comment sections or embedded third-party widgets that require a
  login
- No forms, quizzes, or file uploads that transmit data anywhere
- No cookies of any kind used to identify, track, or recognize you
  across visits or across sites. (The Working in Python pathway saves
  your notebook files locally using your browser's storage, not
  cookies; explained in the next section.)

## Interactive Python notebooks (JupyterLite)

The Working in Python pathway embeds
[JupyterLite](https://jupyterlite.readthedocs.io/), a full Python
environment that runs entirely inside your browser tab using
WebAssembly (specifically, Pyodide, a WebAssembly build of Python).
There is no server-side Python kernel anywhere. When you run a cell,
the computation happens on your own device, the same way a browser game
runs entirely on your device.

To let you keep your work between visits, without a server to save it
to, JupyterLite stores your notebook files and workspace settings using
your browser's own local storage: mainly `IndexedDB` (for the notebook
files themselves) and `localStorage` (for interface state, like which
files you have open). This is ordinary behavior for any browser
application that needs to remember state without a server, the same way
a browser game might save your progress locally. It means:

- Your saved notebooks and edits live only in your browser, on your
  device.
- That storage is scoped to this site's address, the same as any other
  website's local storage. Other sites cannot read it.
- Nothing in it is transmitted to, or retrievable by, this site, the
  course teacher, or GitHub. There is no server-side code here that
  could receive it, per the architecture described above.
- You can clear it at any time through your browser's site settings.
  Doing so resets your saved notebooks in that environment.

No cookie is involved in saving your work. (JupyterLite's underlying
code is adapted from full Jupyter Server, which separately checks for a
`_xsrf` cookie as cross-site request forgery protection when talking to
a real server over the network. Because there is no real server here,
that check is inert: it has nothing to read and nothing meaningful to
set. It plays no role in storing your notebooks and carries no
information about you.)

## Hosting and standard web server logs

This site is hosted by GitHub, Inc. through GitHub Pages. Like any web
host, GitHub's own infrastructure necessarily processes basic connection
information (such as IP address, browser type, and requested page) to
deliver files to a visitor's browser. That is standard web server
operation performed by GitHub as the hosting provider. It is not
something collected, stored, or accessible to whoever maintains this
site's content. GitHub's handling of that information is described in
[GitHub's own Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement),
which governs GitHub's infrastructure, not this site's content or this
policy.

## Why this means there are no FERPA education records here

The Family Educational Rights and Privacy Act (FERPA, 34 CFR Part 99)
governs "education records": records directly related to a student that
are maintained by an educational agency or a party acting for one. This
site maintains no such records, because:

- It collects no student-identifiable information, as described above.
- It stores no grades, assignments, submissions, or student work
  product. Anything shown on this site (including course templates,
  such as example engineering-team documents in the robotics pathway)
  is instructional material, not a record about any individual student.
- It has no database, account system, or backend that could persist
  any visitor's data, student or otherwise. This includes the
  in-browser Python notebooks described above: work saved there is
  written only to the student's own browser storage, never to a server,
  so it is not a record maintained by anyone but the student's own
  device.

Because no personally identifiable student information is collected,
stored, or transmitted through this site, its use does not implicate
FERPA's disclosure or consent requirements.

## Links to other sites

Some pages link to outside resources: competition manuals, Creative
Commons license text, reference documentation, and the companion
[python.porttack.com](https://python.porttack.com) site. Those sites
have their own privacy practices, which this policy does not cover.

## Children's privacy

Because this site collects no personal information from any visitor, it
does not knowingly collect personal information from children under 13.
There is no consent mechanism because there is nothing to consent to.

## Changes to this policy

If this site ever adds something that changes what is described above
(a form, a comment system, analytics, or similar), this page will be
updated first, with a new effective date, before that feature goes live.
The full history of this page is also public in the
[site's repository](https://github.com/porttack/learn/commits/main/privacy.md).

## Questions

Questions about this policy can be filed as an issue on the
[public repository for this site](https://github.com/porttack/learn/issues).
