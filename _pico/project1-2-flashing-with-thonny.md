---
layout: lesson
title: "Project 1.2: Flashing MicroPython with Thonny"
pathway: pico
order: 101
chapter: "p1.2"
project: 1
project_part: 2
label: "Project 1.2"
source: original
subtitle: "Get MicroPython running on your Pico for the first time, using Thonny"
organizer: /pico/project1-2-3-checklist/
organizer_label: "Checklist (covers 1.2 & 1.3)"
slides: /pico/project1-2-3-intro-slides/
slides_label: "Slides (covers 1.2 & 1.3)"
---

<aside class="callout warning" markdown="1">
**ONLY AFTER SIGN-OFF**

Do not connect your Pico to USB until a teacher has checked your circuit against the exemplar. Plugging in before then is exactly the mistake Project 1.1 warned about.
</aside>

### Check whether you even need this

Open Thonny and look at the bottom-right corner of the window. If it already shows **MicroPython (Raspberry Pi Pico)** with your Pico connected, MicroPython is already installed. Skip ahead to [Project 1.3](/pico/project1-3-files-and-the-repl/).

If it doesn't, or your Pico shows up as a plain removable drive instead, keep going. This is likely the first time your specific Pico has had MicroPython put on it.

### Put your Pico into BOOTSEL mode

Hold down the **BOOTSEL** button on top of your Pico. While still holding it down, plug your Pico into the computer with a micro USB cable. Count to three, then let go of the button. Your Pico should appear as a plain removable drive, not as a MicroPython device yet.

The first time you do this, your Mac will ask whether to allow the accessory to connect. Click **Allow**.

<figure id="fig-project1-2-allow-accessory" class="figure-small">
  <img src="{{ '/assets/img/pico/allow-accessory-connect.png' | relative_url }}" alt="A macOS dialog titled Allow accessory to connect, asking whether to connect Raspberry Pi RP2350 Boot to this Mac, with Don't Allow and Allow buttons.">
  <figcaption>Your Mac asking permission to connect to your Pico in BOOTSEL mode</figcaption>
</figure>

### Install MicroPython from inside Thonny

With your Pico in BOOTSEL mode, use Thonny's own installer rather than downloading anything by hand:

1. Click the interpreter indicator in Thonny's bottom-right corner.
2. Look for an option to install or update MicroPython on the device.
3. Choose the variant that matches your board exactly: **Raspberry Pi Pico 2 W**, not plain Pico 2. Picking the wrong variant is the most common mistake here.
4. Click Install, and wait. Don't unplug your Pico while this runs.

<figure id="fig-project1-2-install-micropython" class="figure-small">
  <img src="{{ '/assets/img/pico/install-micropython-menu.png' | relative_url }}" alt="Thonny's interpreter menu open, showing Install MicroPython highlighted above Install CircuitPython and Configure interpreter options.">
  <figcaption>The interpreter menu in Thonny's bottom-right corner, with Install MicroPython selected</figcaption>
</figure>

When it finishes, Thonny should reconnect automatically and show **MicroPython (Raspberry Pi Pico)** in the bottom-right corner. If it doesn't, click the interpreter indicator again and pick the MicroPython entry for your board from the list.

<figure id="fig-project1-2-micropython-connected" class="figure-small">
  <img src="{{ '/assets/img/pico/micropython-connected-menu.png' | relative_url }}" alt="Thonny's interpreter menu listing MicroPython options for the connected board, with one highlighted.">
  <figcaption>The interpreter menu after installing, now listing MicroPython for your connected board</figcaption>
</figure>

<aside class="callout note" markdown="1">
**IF THONNY DOESN'T OFFER THIS**

Thonny's menus shift a little between versions, so ask your teacher if you can't find this option. [Chapter 1's installing MicroPython section](/pico/01-get-to-know-your-pico/#installing-micropython) covers the manual way, downloading the firmware file yourself and dragging it onto your Pico's drive, which does the exact same thing and works no matter what Thonny's interface looks like.
</aside>

<aside class="callout note" markdown="1">
**QUICK CHECK FOR PROJECT 1.3**

Project 1.3 uses a two-panel file view that only shows up in Thonny's **regular** mode. On a Mac, regular is already the default, so you likely don't need to do anything. If Project 1.3's file panels are missing when you get there, open **Thonny > Preferences**, go to the **General** tab, and set **UI mode** to **regular**.

<figure id="fig-project1-2-regular-mode" class="figure-small">
  <img src="{{ '/assets/img/pico/thonny-options-regular-mode.png' | relative_url }}" alt="Thonny's General options tab with the UI mode dropdown open, showing simple, regular, and expert, with regular selected.">
  <figcaption>Thonny's General options, with UI mode set to regular</figcaption>
</figure>

Changing this setting needs a full restart of Thonny (quit and reopen) before it takes effect.
</aside>

Once Thonny shows MicroPython connected, move on to [Project 1.3](/pico/project1-3-files-and-the-repl/).
