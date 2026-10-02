---
layout: lesson
title: "Interlude B.3: Flashing MicroPython with Thonny"
pathway: pico
order: 4.7
label: "Interlude B.3"
source: original
subtitle: "Get MicroPython running on your Pico for the first time, using Thonny"
---

<aside class="callout warning" markdown="1">
**ONLY AFTER SIGN-OFF**

Do not connect your Pico to USB until a teacher has checked your circuit against the exemplar. Plugging in before then is exactly the mistake Interlude B.1 warned about.
</aside>

### Check whether you even need this

Open Thonny and look at the bottom-right corner of the window. If it already shows **MicroPython (Raspberry Pi Pico)** with your Pico connected, MicroPython is already installed. Skip ahead to [Interlude B.4](/pico/04b3-blinking-your-leds/).

If it doesn't, or your Pico shows up as a plain removable drive instead, keep going. This is likely the first time your specific Pico has had MicroPython put on it.

### Put your Pico into BOOTSEL mode

Hold down the **BOOTSEL** button on top of your Pico. While still holding it down, plug your Pico into the computer with a micro USB cable. Count to three, then let go of the button. Your Pico should appear as a plain removable drive, not as a MicroPython device yet.

### Install MicroPython from inside Thonny

With your Pico in BOOTSEL mode, use Thonny's own installer rather than downloading anything by hand:

1. Click the interpreter indicator in Thonny's bottom-right corner.
2. Look for an option to install or update MicroPython on the device.
3. Choose the variant that matches your board exactly: **Raspberry Pi Pico 2 W**, not plain Pico 2. Picking the wrong variant is the most common mistake here.
4. Click Install, and wait. Don't unplug your Pico while this runs.

When it finishes, Thonny should reconnect automatically and show **MicroPython (Raspberry Pi Pico)** in the bottom-right corner.

<aside class="callout note" markdown="1">
**IF THONNY DOESN'T OFFER THIS**

Thonny's menus shift a little between versions, so ask your teacher if you can't find this option. [Chapter 1's installing MicroPython section](/pico/01-get-to-know-your-pico/#installing-micropython) covers the manual way, downloading the firmware file yourself and dragging it onto your Pico's drive, which does the exact same thing and works no matter what Thonny's interface looks like.
</aside>

Once Thonny shows MicroPython connected, move on to [Interlude B.4](/pico/04b3-blinking-your-leds/).
