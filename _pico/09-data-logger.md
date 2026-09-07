---
layout: lesson
title: "Chapter 9: Data logger"
pathway: pico
order: 9
source: rpi-pico-2e
---

*Untether Raspberry Pi Pico from the computer to make it a fully portable temperature-logging device*

So far, you’ve been using your Raspberry Pi Pico-series device connected to your Raspberry Pi or other computer via its micro USB port. As with all microcontrollers, though, there’s no reason your Pico must be tethered in this way: it’s a fully functional self-contained system, with processing capabilities, memory, and everything it needs to work on its own.

In this chapter you’ll learn how to use the file system to create, write to, and read from files, allowing you to put your Pico anywhere you like and record data for later access — turning it into what is known as a *data logger*. For this you’ll only need your Pico and, if you want to use it away from your Raspberry Pi, a micro USB charger or battery pack; once you have finished the chapter, you can connect additional sensors if you want to expand your project.

### The file system

The file system is where your Pico stores all the programs you’ve been writing. It’s equivalent in function to the microSD card in your Raspberry Pi, or the hard drive or solid-state drive in your laptop or desktop computer: it’s a form of *non-volatile* storage, which means that whatever you save there stays in place even when you unplug your Pico’s micro USB cable.

Connect your Pico to ViperIDE if it’s not already connected. Look at the File Manager pane: you’ll see a list of all the programs you’ve written so far, stored on your Pico’s file system.

Click into the Terminal to start working with your Pico’s REPL in interactive mode. Type:

```python
file = open("test.txt", "w")
```

This tells MicroPython to open a file called `test.txt` for writing — the `"w"` part of the instruction. You won’t see anything print to the Terminal when you press ENTER at the end of the line, because although you’ve opened the file, you haven’t done anything with it yet. Type:

```python
file.write("Hello, File!")
```

When you press ENTER at the end of this line, you’ll see the number `12` appear in the Terminal. That’s MicroPython confirming to you that it has written twelve bytes to the file you opened. Count the number of characters in the message you wrote: including the letters, comma, space, and exclamation mark, there are twelve — each of which takes up a single byte.

When you’re done writing to a file, you need to close it — this ensures that the data you’ve told MicroPython to write is actually written to the file system. If you don’t close the file, the data might not have been written yet — a bit like writing a letter in LibreOffice Writer or another word processor and forgetting to save it. Type:

```python
file.close()
```

Your file is now safely stored on your Pico’s file system. Look in ViperIDE’s File Manager pane and find `test.txt`. Click on it to open it: you’ll see your message appear in the editor.

You don’t have to open a file in the editor to read it, though: you can open the file right in MicroPython itself. Click back into the Terminal and type:

```python
file = open("test.txt")
```

You’ll notice that this time around there’s no `"w"`: that’s because instead of writing to the file, you’re going to be reading it. You could replace the `"w"` with an `"r"`, but MicroPython defaults to opening a file in read mode — so it’s fine to simply leave that part of the instruction off. Next, type:

```python
file.read()
```

You’ll see the message you wrote to the file print to the Terminal. Congratulations: you can read and write files on your Pico’s file system!

Before you finish, close the file — it’s not as important to properly close a file after reading it as it is when writing, but it’s a good habit to get into:

```python
file.close()
```

#### Logging temperatures

Now you know how to open, write to, and read from files, you have everything you need to build a data logger on your Pico. Create a new file in ViperIDE, and start your program by typing:

```python
import machine
import time

sensor_temp = machine.ADC(machine.ADC.CORE_TEMP)

conversion_factor = 3.3 / (65535)
reading = sensor_temp.read_u16() * conversion_factor
temperature = 27 - (reading - 0.706)/0.001721
```

You might recognise this code: it’s the same as you used in [Chapter 8, Temperature gauge](/pico/08-temperature-gauge/) to read from your Pico’s on-board temperature sensor. The readings from the sensor are the data you’re going to be logging to the file system, so you don’t want to simply print them out as you did before.

Start by opening a file for writing by adding the following line at the bottom:

```python
file = open("temps.txt", "w")
```

If the file doesn’t already exist on the file system, this creates it; if it does, it overwrites it — emptying its contents ready for you to write new data.

<aside class="callout warning" markdown="1">
**WARNING**

Opening a file for writing in MicroPython will delete anything you’ve already stored in it. Always make sure you’ve opened the file for reading and saved the contents somewhere if you want to keep it!
</aside>

Now you need to write something to the file — the value you got from the temperature sensor:

```python
file.write(str(temperature))
```

Rather than writing a fixed string in quotes, as you did before, this time you’re converting the variable `temperature` — which is a floating-point number (a number with a decimal point in it) — to a string, then writing that to the file.

As before, to make sure the data is written, you need to close the file:

```python
file.close()
```

Click **Run**, then save your program to the Raspberry Pi Pico as `Datalogger.py`. The program will only take a few seconds to run; when the `>>>` prompt reappears in the Terminal, click into it and type the following to open and read your new file:

```python
file = open("temps.txt")
file.read()
file.close()
```

You’ll see the temperature reading your program took appear in the Terminal. Congratulations: your data logger works!

A data logger that only logs a single reading — a *datum* — isn’t that useful, though. To make your data logger more powerful, you need to modify it so it takes lots of readings. Click **Run** again, and read the file again:

```python
file = open("temps.txt")
file.read()
file.close()
```

Notice how there’s still only one reading in the file. When your program opened the file for writing again, it automatically wiped its previous contents — meaning that each time your program runs, it will wipe the file and store a single reading.

To fix that, you need to modify your program. Start by clicking and dragging your mouse cursor to highlight the lines:

```python
reading = sensor_temp.read_u16() * conversion_factor
temperature = 27 - (reading - 0.706)/0.001721
```

When you’ve highlighted both lines completely, let go of the mouse button and type CTRL+X (or COMMAND+X on Mac) to cut the lines; you’ll see them disappear. Go to the bottom of your program and delete everything after:

```python
file = open("temps.txt", "w")
```

Now type:

```python
while True:
```

After pressing ENTER at the end of that line, paste the two lines you cut earlier (CTRL+V or COMMAND+V). You’ll see them appear, which saves you having to type them in — but only the first line will be indented correctly under the infinite loop you just created. Put your cursor at the start of the second line, then press SPACE four times to indent the line properly. Move your cursor to the end of the line and press ENTER. Type the following line, making sure it’s properly indented:

```python
file.write(str(temperature))
```

Now, though, you’re going to need to do something new. If you close the file as you did before, you won’t be able to write to it again without reopening it and wiping its contents. If you don’t close the file, the data will never actually get written to the file system.

The solution: flush the file, rather than close it. Type:

```python
file.flush()
```

When you’re writing to a file but the data isn’t actually being written to the file system, it’s stored in what’s known as a *buffer* — a temporary storage area. When you close the file, the buffer is written to the file in a process known as *flushing*. Using `file.flush()` is equivalent to `file.close()`, in that it flushes the contents of the buffer into the file — but unlike `file.close()`, the file remains open for you to write more data to it later.

Now you just need to pause your program between readings:

```python
time.sleep(10)
```

Your finished program will look like this:

```python
import machine
import time

sensor_temp = machine.ADC(machine.ADC.CORE_TEMP)

conversion_factor = 3.3 / (65535)
file = open("temps.txt", "w")
while True:
    reading = sensor_temp.read_u16() * conversion_factor
    temperature = 27 - (reading - 0.706)/0.001721
    file.write(str(temperature))
    file.flush()
    time.sleep(10)
```

Click **Run**, count to 60, then stop your program. Run this code in the Terminal:

```python
file = open("temps.txt")
file.read()
file.close()
```

The good news is that your program worked, and you’ve logged multiple readings — around six, depending on how fast you counted. The bad news is that they’re all mushed together into one unreadable string of digits, with no gap between one reading and the next.

To fix that problem, you need to format the data as it’s written to the file. Go back to the `file.write()` line in your program, and modify it so it looks like:

```python
file.write(str(temperature) + "\n")
```

The plus symbol ( `+` ) tells MicroPython that you want to append what follows, concatenating the two strings together; `"\n"` is a special string known as a *control character* — it acts as the equivalent of pressing the ENTER key, meaning that each line in your data log should be on its own separate line.

Click the **Run** icon, count to 60 again, and stop your program. Open and read your file:

```python
file = open("temps.txt")
file.read()
file.close()
```

You’ve made progress, but it’s still not right: the `\n` control character isn’t acting like a press of ENTER, but printing as the two visible characters `\n`. That’s because `file.read()` is bringing in the raw contents of the file, and making no attempt at formatting it for the screen.

To fix the formatting problem, wrap `file.read` in a `print()` function:

```python
file = open("temps.txt")
print(file.read())
file.close()
```

This time you’ll see each reading print out on its own line, neatly formatted and easy to read.

Congratulations: you’ve built a data logger which can take multiple readings and store them on your Pico’s file system!

<aside class="callout note" markdown="1">
**FILE STORAGE**

Your Pico 2’s file system is 3MiB in size, meaning it can hold 3,145,728 bytes of data (the original Pico’s file system is 1.375MiB or 1,441,792 bytes). Every file you save on your Pico, including the data logger’s storage file, takes up room. How long it takes to fill the storage will depend on how many other files you have and how often your data logger saves a reading: at nine bytes per reading every ten seconds, you’ll fill 3MiB in around 40 days; if you took a reading every minute, your data logger could run for around 242 days; once an hour, and your data logger could run more than 40 years!

If you’d like your data logger to write to the same file every time you run the program, change the `"w"` in `file = open("temps.txt", "w")` to an `"a"`. This creates the file if it doesn’t exist, but appends to it if it does.
</aside>

#### Running Headless

Your Pico’s file system works regardless of whether or not it’s connected to your Raspberry Pi or another computer. If you have a micro USB mains charger or a USB battery pack with a micro USB cable, you can take your data logger to any room in your house and have it run by itself — but you’ll need a way to get your program running without having to click Run in ViperIDE.

For use without a connected computer — known as *headless operation* — you can save your program under a special file name: `main.py`. When MicroPython finds a file called `main.py` in its file system, it runs that automatically every time it’s powered on or reset — without you having to click Run. Another special file, `boot.py`, is similar, but runs before Pico is fully configured.

After stopping the program if it’s running, save your file to your Pico as `main.py`. At first, nothing will seem to happen: your Pico stays connected to ViperIDE’s REPL, which stops it from automatically running the program you just saved.

To force the program to run, click into the Terminal and press CTRL+D. This sends your Pico a *soft reset* command, which will break it out of the REPL and start the program running. Find something else to do for five minutes or so, then stop your program and open your data log:

```python
file = open("temps.txt")
print(file.read())
file.close()
```

You’ll see a list of temperature readings, even though you didn’t click the **Run** icon — because your program ran automatically when your Pico reset.

If you have a micro USB charger or USB battery pack, disconnect your Pico from your Raspberry Pi, take it to another room, and connect it to the charger or battery pack. Leave it there for ten minutes, then come back and unplug it. Take it back to your Raspberry Pi, plug it back in, and read your file again: you’ll see the readings from the other room, proving that your Pico can run perfectly well without your Raspberry Pi helping it along.

Congratulations: your data logger is now fully functional and wholly portable, ready to go with you wherever you need to record data!

<aside class="callout warning" markdown="1">
**WARNING**

Your data logger program will run every time your Pico is powered on, whether or not it’s connected to ViperIDE. If you don’t want that to happen, you can simply open `main.py` and delete all the code in it before saving it again. With an empty `main.py`, your Pico will simply sit and wait for instructions again.
</aside>

<aside class="callout challenge" markdown="1">
**CHALLENGE**

Can you change your program to record data from an external sensor connected to one of your Pico’s ADC pins? Can you have your program write a title at the start of the file, so it’s easier to see what the values mean? Can you write a program which logs how many times a push-button switch has been pressed? Can you figure out a way, such as copy-and-paste, to get your data into LibreOffice Calc or another spreadsheet program to create a chart?
</aside>
