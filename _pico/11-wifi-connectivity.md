---
layout: lesson
title: "Chapter 11: Wi-Fi connectivity with Pico W and Pico 2 W"
pathway: pico
order: 11
chapter: 11
source: rpi-pico-2e
subtitle: "Turn Raspberry Pi Pico W into a network-connected node for the Internet of Things as you learn to unleash its Wi-Fi powers"
---

*Turn Raspberry Pi Pico W into a network-connected node for the Internet of Things as you learn to unleash its Wi-Fi powers*

So far, you’ve been learning about projects you can make with any Raspberry Pi Pico-family board. They’re all based on the same RP2040 or RP2350 microcontrollers, have the same overall hardware, and even share the same pin connections on the edges of their respective circuit boards. They’re not completely identical, though, because Raspberry Pi Pico W and Pico 2 W have something the others lack: a radio.

In this chapter you’ll learn how to make a device for the *Internet of Things (IoT)*, connecting to a Wi-Fi network. As a result, you’ll need a Pico W or Pico 2 W; you won’t be able to work through this chapter with Pico or Pico 2 — but read on to learn about what Pico W and Pico 2 W can do.

### The radio

Pico W and Pico 2 W’s radio, hidden beneath a metal shield, is designed around two standards: *IEEE 802.11n Wi-Fi*, also known as *Wi-Fi 4**,* and *Bluetooth 5.2*. Wi-Fi is a high-speed, relatively long-range wireless networking standard for devices like smartphones, tablets, and laptops, though it’s also popular for embedded devices which need to transfer large amounts of information. Bluetooth is a short-range, lower-speed radio standard which uses less power, and is used in devices like wireless headphones, smartphones, and sensors. You’ll learn about using Bluetooth with Pico W and Pico 2 W in [Chapter 12, Bluetooth connectivity with Pico W and Pico 2 W](/pico/12-bluetooth-connectivity/).

This radio is suitable for use in projects for the Internet of Things (IoT) — which, like it sounds, is a network made up of devices, rather than people. These devices can be anything from smart thermostats to earthquake monitors, all working to send data off for analysis and receive data in return.

The Internet of Things doesn’t have to be complicated, though. In this chapter, you’ll learn to harness the power of Pico W and Pico 2 W’s radio to connect to a Wi-Fi network, reach out to other devices on the internet, and even host its own *web server* for you to control hardware from a web browser on Raspberry Pi or your smartphone, tablet, or computer.

To complete this project, you’ll need:

- Raspberry Pi Pico W or Pico 2 W
- A Wi-Fi router with an internet connection
- A Raspberry Pi or other computer on the same Wi-Fi network, with a web browser
- The network name (SSID) and password (key) for your Wi-Fi network

### Spot the difference

Before programming Pico W or Pico 2 W to connect to your home network, take a moment to make sure it’s running the right firmware. From earlier in this pathway, you’ll remember that there are four distinct versions of the MicroPython firmware: one each for Raspberry Pi Pico, Pico W, Pico 2, and Pico 2 W.

If you’ve installed the Pico firmware on Pico W, or the Pico 2 firmware on Pico 2 W, it’ll seem to work — except you won’t be able to use the radio. If you think you might have the wrong firmware installed, simply download the Pico W or Pico 2 W firmware, depending on your board, and flash it using the instructions in [Chapter 1, Get to know your Raspberry Pi Pico](/pico/01-get-to-know-your-pico/).

MicroPython programs written for Raspberry Pi Pico W and Pico 2 W are identical to those written for Pico and Pico 2 — you can take a program written for Pico (or Pico 2) and run it on Pico W (or Pico 2 W) with no problems. The reverse isn’t directly true: if a program uses the radio, it won’t work on a Pico or Pico 2.

There’s also a small but important difference in the hardware: on Raspberry Pi Pico, the on-board LED is connected to general-purpose input/output (GPIO) pin on the RP2040 microcontroller. Raspberry Pi Pico W, though, had to use this GPIO pin to communicate with the radio — but it still has an on-board LED. The same is true for Raspberry Pi Pico 2 W.

Rather than being controlled by the RP2040 or RP2350 microcontroller, though, this LED is controlled by the radio controller. You’ll read more about controlling Pico W and Pico 2 W’s on-board LED later in this chapter. For now, just be aware of the difference — and if you’ve got programs written for Pico or Pico 2 which address the LED by pin number and aren’t working on Pico W or Pico 2 W, now you know why!

### Making a connection

To connect Raspberry Pi Pico W or Pico 2 W to your Wi-Fi network, you’ll need two pieces of information: the network name, also known as the *Service Set Identifier (SSID)*, and the password, also known as the *Pre-Shared Key (PSK)**.* This information is often written on a sticker or card attached to your router or access point, unless it has been changed from the factory defaults, and controls who can access the network.

The radio on Pico W and Pico 2 W is what is known as a *single-band radio*, meaning it only uses one block of frequencies in the radio spectrum: 2.4GHz. As a result, it can’t connect to 5GHz or 6GHz Wi-Fi networks. If your router has separate network names for each band, make sure to use the name associated with the 2.4GHz band; if it uses one network name for all bands, Pico W will still connect — but it may take longer than with a single-band network.

MicroPython programs for Pico W and Pico 2 W start like any other: open ViperIDE and start a new program, but this time you’ll be importing a library you haven’t used before: the `network` library. Type the following:

```python
import time
import network
import rp2
rp2.country("US")

wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect("NetworkName", "Password")
```

Here you’re importing the `network` library to handle Pico W or Pico 2 W’s radio, the `time` library to handle delays, and the `rp2` library to handle the RP2040 or RP2350 microcontroller. The line after the import section is a function of the `rp2` library that sets the *country code* for the radio. If you’ve ever set up a Raspberry Pi, you’ll be familiar with the country code setting from the welcome wizard: different countries have different regulations when it comes to radio frequencies, so you need to tell your device where it is in the world to use all permitted radio frequencies and Wi-Fi channels.

In this example you’re setting the country code to `US`, which is correct for the United States. If you’re elsewhere in the world, you’ll need to look up the right country code for your nation using what is known as the *ISO 3166 Alpha-2* format. For the United Kingdom, it’s `GB`; for Ireland, it’s `IE`; for Canada, it’s `CA`. A search engine will give you a full list.

<aside class="callout warning" markdown="1">
**WARNING**

Make sure you use the correct country code, or leave it unset. Using an incorrect country code can mean Pico W and Pico 2 W won’t be able to see your wireless network, or — worse — cause them to transmit on unauthorised frequencies, causing interference and potentially breaking laws surrounding radio use in your country.
</aside>

The last three lines in your program need some explanation: here you’re creating an object called `wlan` — short for Wireless Local Area Network — which uses the `network` library to set Pico W or Pico 2 W’s radio into *station mode**.* A station is simply any device which connects to the network, like a smartphone or Raspberry Pi. The radio can also be brought up in *access point mode* using `network.WLAN(network.AP_IF)` to allow other devices to connect directly to Pico W or Pico 2 W without a router in the middle; you won’t be using this mode here.

The second of the three lines tells the `network` library to turn the radio on, while the last instructs it to connect to a network with the name `NetworkName` and the password `Password`. Obviously, you’ll need to change these to match your own network name and password — or your Pico won’t connect!

To check the status of the connection, write a simple loop:

```python
while not wlan.isconnected() and wlan.status() >= 0:
    print("Waiting for Wi-Fi connection...")
    time.sleep(1)
print(wlan.ifconfig())
print(wlan.isconnected())
```

Here, you’re using the `network` library’s `isconnected()` function, along with the `status()` function, to keep the loop running only when the radio is *not* connected to your network. When it does connect, and the radio doesn’t report any error status, the loop will exit. Finally, MicroPython will print out information about the connection, including the *IP address* assigned to Pico W or Pico 2 W — the network equivalent of its telephone number or street address.

Your finished program should look like this:

```python
import time
import network
import rp2
rp2.country("US")

wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect("NetworkName", "Password")

while not wlan.isconnected() and wlan.status() >= 0:
    print("Waiting for Wi-Fi connection...")
    time.sleep(1)
print(wlan.ifconfig())
print(wlan.isconnected())
```

Save the program to your Pico W or Pico 2 W as `Connect_Network.py` and click Run. You’ll see the message ‘Waiting for Wi-Fi connection…’ in the Terminal once per second until the radio connects, then a list of the radio’s configuration. If the last line of the output is `True`, congratulations: you’re online!

<aside class="callout note" markdown="1">
**NO CONNECTION?**

If the radio hasn’t connected to your network after about a minute, there’s something wrong. Check that you wrote the network name and password correctly, and that you’re connecting to a 2.4GHz network — not a 5GHz or 6GHz network. Also double-check that you’ve set the correct country code for where you live.
</aside>

That simple program is enough to get you connected, but it’s not exactly robust. Using the `network` library’s ability to report the radio’s status, including errors, it’s possible to add *error handling* to your program — allowing it to let you know when there’s a problem, and even what type of problem it might be. Go back to ViperIDE and rewrite your program as follows:

```python
import time
import network
import rp2
rp2.country("US")

ssid = "NetworkName"
psk = "Password"

wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect(ssid, psk)

max_wait = 30
while max_wait > 0:
    if wlan.status() < 0 or wlan.status() >= 3:
        break
    max_wait -= 1
    print("Waiting for Wi-Fi connection...")
    time.sleep(1)

if wlan.status() != 3:
    raise RuntimeError("Network connection failed")
else:
    print("Connected to Wi-Fi network.")
    print(wlan.ifconfig())
```

Save your program as `Connect_Robust.py` and click **Run**. This time, your Pico W or Pico 2 W will begin the connection attempt and then count backwards from 30 — the `max_wait` variable — as it checks to see if the connection has succeeded yet. When it reaches zero, or the connection succeeds, it will exit the loop and either print a success message and the network configuration information from your first program, or it will *raise an error* — letting you know that the connection didn’t work.

The program relies on the `network` library’s ability to report the status of the radio, but it comes through in a format designed for a machine to understand: a simple number. A status of ‘3’ means that the radio has successfully connected to the network, which is why your program raises the error if the loop has exited but the status is not 3.

You may notice one other change to the program: the network name and password are now stored in variables, `ssid` and `psk`. This is a good habit to build, as it makes it easier to see where you need to enter new network details when sharing the program — and makes it less likely you’ll accidentally share the program with your own network password still in it!

<aside class="callout note" markdown="1">
**STATUS CODES**

There are other status numbers, which you can watch for in your program using the `network` library’s `status()` function if you want more detailed error reports: 0 means the connection is down; 1 means the radio is currently joining a network; 2 means the radio connected but was not given an IP address by the router; -1 means the radio link has failed; -2 means the radio is connected but there’s no underlying network; and -3 means that the network password was rejected.
</aside>

### Connecting to the internet

Now you know how to handle connecting to the network, it’s time to actually use the network — starting with talking to web servers on the internet. Although neither Pico W nor Pico 2 W are powerful enough to run a graphical web browser like Raspberry Pi or a desktop computer, they can still talk to the same servers using the *Hypertext Transport Protocol (HTTP**)*.

There’s another MicroPython library which exists specifically to request data from web servers: `requests`. Go back to the import section of your program and add the following line:

```python
import requests
```

Now go to the very bottom of your program and add the following lines:

```python
response = requests.get("https://text.npr.org")
print(response.content)
response.close()
```

Here we’ve created a `requests` object, called `response`, which contains the full address — including the *protocol*, the `https://` bit — of the website we want to visit. In this example, you’re opening a secure connection to the website — that’s what the ‘s’ in `https://` means — but you can also connect to plain `http://` servers too.

The next line is simple enough: it tells Pico W or Pico 2 W to print the content it received from the web server to the Terminal. Don’t expect it to look much like it would in a normal web browser, though: you won’t see any pictures, pretty fonts, or animations. Instead, you’ll see the raw text of the response — the Hypertext, in fact.

Your finished program should look like this:

```python
import time
import network
import rp2
import requests
rp2.country("US")

ssid = "NetworkName"
psk = "Password"

wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect(ssid, psk)

max_wait = 30
while max_wait > 0:
    if wlan.status() < 0 or wlan.status() >= 3:
        break
    max_wait -= 1
    print("Waiting for Wi-Fi connection...")
    time.sleep(1)

if wlan.status() != 3:
    raise RuntimeError("Network connection failed")
else:
    print("Connected to Wi-Fi network.")
    print(wlan.ifconfig())

response = requests.get("https://text.npr.org/")
print(response.content)
response.close()
```

Save the program to your Pico W or Pico 2 W as `Requests.py` and run it now. The radio will connect to the network, as before, then Pico will make a request to a lightweight version of the NPR website. When it receives the page back, it prints it to the Terminal: expect a long wall of raw text, since it’s the page’s actual HTML, not the pretty version a browser renders.

For something even easier to read, you can tell MicroPython to split the response into separate lines according to the line breaks it receives from the server. To do that, delete your existing `print` line and replace it with:

`[print(x) for x in response.content.splitlines()]`

If you save and run your program again, you’ll see that the response from the server is spread out more — making it better for reading, but still not as it would appear if processed and rendered as rich text in a standard web browser. These separated lines are generated by reading each split line from the `response` object and printing them one at a time until they’re all finished.

All that happens before the final line, and your program would seem to work without it — for a while, at least. The function `response.close()` tells `requests` that you’re finished requesting data from the server, and to close the *socket* (the connection between Pico and the web server) it opened.

You need to make sure that every time you use `requests` to get content from a remote server you include a `response.close()` function. If you don’t, all the connections will stay open — and Pico will very quickly run out of memory, causing your program to crash. When the socket is closed, a process called *garbage collection* takes place to free up the memory that was previously being used — allowing your program to keep running as long as you need.

<aside class="callout note" markdown="1">
**OUT OF MEMORY?**

Even if you’re making sure to close requests each time, you may still run out of memory. Modern web pages are big, even if you’re not downloading the pictures, and Pico W has just 264 kB of memory. If you request a page that’s too big, your program will crash; try to find a site which offers the information you need in a smaller page. While Pico 2 W has more memory, at 520kB, it too will run out of memory on large web pages.
</aside>

The NPR website looks great in a browser, but not so good on the Pico W or Pico 2 W. You can pull data from any website, though, including ones which are designed for providing useful information on devices that can’t handle graphical pages. Try replacing your request with one of the following examples and running your program again, to see what you get:

```python
response = requests.get("http://wttr.in/cambridge?format=3")
response = requests.get("http://ipecho.net/plain")
response = requests.get("https://earthquake.usgs.gov/fdsnws/event/"
                        "1/query?format=text&limit=10")
response = requests.get("http://artscene.textfiles.com/"
                        "asciiart/unicorn")
```

In addition to requesting content from a web server — using what is known as an *HTTP GET request* — you can also send data to a web server, using an *HTTP POST request*. Like the name suggests, this *posts* data to the server rather than *getting* data from it — allowing you to send things like sensor readings across the network.

For this you’d need what’s known as an *endpoint* set up to accept the data and do something with it, like store it in a database; that’s outside the scope of what you’re doing in this chapter, but you can find more information on making POST requests in the free book *Connecting to the Internet with Raspberry Pi Pico W-series* on the Raspberry Pi website at [rptl.io/picow-connect](http://rptl.io/picow-connect).

### Hosting a web page

Raspberry Pi Pico W and Pico 2 W aren’t limited to just talking to other peoples’ web servers: they can become web servers themselves, too. While admittedly limited by their memory and storage capacity, a Pico W or Pico 2 W-hosted server can prove extremely handy — especially when you start using it to interact with sensors and other hardware.

Start a new program in ViperIDE, and begin by configuring the network — using the same tricks as before to set the connection up in a way that it won’t stall forever if it’s having trouble connecting. To make it easier, you can literally just copy and paste all the lines from your previous program then delete the last three as well as the line `import requests` near the top — leaving you with a program which connects to your Wi-Fi network but does nothing else.

Save your program on Pico W or Pico 2 W as `connect.py`. You can run it to check that everything’s working, but it won’t do anything beyond connect to your Wi-Fi network and print the connection status.

Now start another new program. Don’t worry, you’ll still be using what you’ve just written — only this time you’ll be importing it, like a library, so that you don’t have to write it out in full every time you’re using Wi-Fi on Pico W or Pico 2 W. You’ll be importing a couple of additional libraries, too: `socket` and `machine`. Type the following:

```python
from connect import wlan
import socket
import machine

address = socket.getaddrinfo("0.0.0.0", 80)[0][-1]
s = socket.socket()
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
s.bind(address)
s.listen(1)
print("Listening for connections on", wlan.ifconfig()[0])
```

This tells Pico W or Pico 2 W to use `connect.py` to connect to the Wi-Fi network, then open a network socket on port 80 — the port used for HTTP-protocol connections from web browsers and other devices. The socket is linked to the Pico’s network address, and then told to listen on it for connections. Save your program on Pico W or Pico 2 W as `server.py`, but don’t run it: if you ran your program now you wouldn’t see anything, as there’s no content to serve.

To fix that, add the following:

```python
while True:
    try:
        client, address = s.accept()
        print("Connection accepted from", address)
        client_file = client.makefile("rwb", 0)
        while True:
            line = client_file.readline()
            if not line or line == b"\r\n":
                break
        client.send("HTTP/1.0 200 OK\r\n")
        client.send("Content-type: text/plain\r\n\r\n")
        client.send("Hello from Raspberry Pi Pico W!\r\n")
        client.close()
        print("Response sent, connection closed.")
    except OSError as e:
        client.close()
        print("Error, connection closed.")
```

This code sets up a loop, in which the `socket` library accepts incoming connections from other devices on the network — using an object called `client`, to indicate that you’re dealing with clients for the web server you’re creating. When a connection is requested, a line is printed to the Terminal and then a temporary file created to hold the client request — read line-by-line in the nested loop.

The `client` object is then used to `send` a response — starting with a bit of boilerplate which tells the client what version of the Hypertext Transport Protocol you’re using (version 1.0, here), that the server has accepted the connection (`200 OK`), and that you’re sending content of the type `text/plain` — we’ll look at another content type later. The `\r\n` on the end of the response sends a carriage return followed by a newline, special characters which let the receiving computer know the line has ended.

The second `client.send` line sends your actual message — a simple network ‘hello, world,’ in effect. The first two lines of the response won’t be seen in the connecting device’s web browser, unless you’re using special software to inspect it; the third line, though, will be printed in your browser — and if you’re using Pico 2 W, feel free to change the message accordingly.

Save and run your program now. You’ll need to stop your program first if you’d already tried running it: even though there was nothing to serve, the microcontroller is still busy in the loop and needs to be told to stop running the program before you can save your changes.

When the program has connected to the network, you’ll see a line printed to the Terminal which starts with ‘Listening for connections on’ followed by an IP address — four numbers separated by dots. This is how you’re going to connect to your Pico W or Pico 2 W over the network, like calling a friend using their telephone number.

Open a web browser and type the IP address from the Terminal into the address bar. A simple page will load, containing the message ‘Hello from Raspberry Pi Pico W!’ Congratulations: you’ve built a web server, running on your Pico! You don’t have to connect to it from the same computer on which you’re programming the microcontroller, either: so long as they’re on the same network, any device — a desktop, laptop, smartphone, tablet, or even a games console — will be able to load the page using that IP address.

<aside class="callout warning" markdown="1">
**WARNING**

The IP address you’re using is what’s known as a *private address*. It can only be accessed by people on the same network as you. The websites you usually visit have *public addresses*, which you can access over the internet. If you send the IP of your Pico W or Pico 2 W to a friend down the street, they won’t be able to load your page. It’s possible to forward connections from the public address assigned to your router to your Pico’s private address, but it’s not recommended unless you’re sure about what you’re doing: forwarding the connections means anyone can access your device.
</aside>

Just having a static message isn’t using the full functionality of the microcontroller, though. It’s time to use the `machine` library you imported earlier in your code to interface with Pico W or Pico 2 W’s hardware — specifically, to read the temperature sensor. The code you need for this is the same as in [Chapter 8, Temperature gauge](/pico/08-temperature-gauge/).

Start by adding the temperature sensor to your program, along with the conversion factor for turning its readings into a voltage value for later processing — put the following lines at the top of your program, under `import machine`:

```python
sensor_temp = machine.ADC(machine.ADC.CORE_TEMP)
conversion_factor = 3.3 / (65534)
```

Next, add the following under the line `try:` in your main program loop:

```python
        reading = sensor_temp.read_u16() * conversion_factor
        temperature = 27 - (reading - 0.706) / 0.001721
```

Finally, add these lines between your last `client.send` and `client.close`:

```python
        response = f"The temperature is {str(temperature)} C.\r\n"
        client.send(response)
```

The first of these two lines constructs an object called `response`, which takes the reading from the Pico’s temperature sensor, converted from its floating-point number to a string, and embeds it in a descriptive string. That string includes the carriage return and newline (`\r\n`) required at the end of each line. The second line sends the result to the client device.

Your finished program should now look like this:

```python
from connect import wlan
import socket
import machine

sensor_temp = machine.ADC(machine.ADC.CORE_TEMP)
conversion_factor = 3.3 / (65534)

address = socket.getaddrinfo("0.0.0.0", 80)[0][-1]
s = socket.socket()
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
s.bind(address)
s.listen(1)
print("Listening for connections on", wlan.ifconfig()[0])

while True:
    try:
        reading = sensor_temp.read_u16() * conversion_factor
        temperature = 27 - (reading - 0.706) / 0.001721
        client, address = s.accept()
        print("Connection accepted from", address)
        client_file = client.makefile("rwb", 0)
        while True:
            line = client_file.readline()
            if not line or line == b"\r\n":
                break
        client.send("HTTP/1.0 200 OK\r\n")
        client.send("Content-type: text/plain\r\n\r\n")
        client.send("Hello from Raspberry Pi Pico W!\r\n")
        response = f"The temperature is {str(temperature)} C.\r\n"
        client.send(response)
        client.close()
        print("Response sent, connection closed.")
    except OSError as e:
        client.close()
        print("Error, connection closed.")
```

Save your program as `Temperature_Server.py` on your Pico W or Pico 2 W and run it — remembering to stop the previous version first if it’s still running — then refresh the page in your browser. Now beneath the welcoming message you saw before is a new line — with a live reading from the temperature sensor. Place your finger on the RP2040 microcontroller chip for a few seconds to increase its temperature, then refresh the page again — and you’ll see the number change.

Congratulations: you’ve created a dynamic page which reads from Pico W or Pico 2 W’s temperature sensor!

### Controlling an LED

Reading sensors over a Wi-Fi connection is neat, but the microcontroller’s capabilities extend beyond that: it’s possible to actively control hardware as well. For this project, you’ll be using the Pico W or Pico 2 W’s on-board LED; if you’d prefer to use something connected to a GPIO pin instead, like a bigger external LED or a buzzer, follow the instructions in [Chapter 4, Physical computing with Raspberry Pi Pico](/pico/04-physical-computing-with-pico/) to modify what pin the program controls.

Start a new program, importing the libraries you’ll need plus your `connect.py` code — only this time make sure you import the `machine` library and set the on-board LED up as an output:

```python
from connect import wlan
import socket
import machine

led_onboard = machine.Pin("LED", machine.Pin.OUT)
led_onboard.value(0)
led_state = "LED is off"
```

Note how you’re setting the pin up based on a label, `"LED"`, rather than a pin number. You might remember from earlier in the chapter that, unlike Raspberry Pi Pico and Pico 2, Pico W and Pico 2 W don’t control the on-board LED from one of the microcontroller’s pins but from the radio controller instead. The `"LED"` label is special, and lets MicroPython know which is the right pin whether you’re using Pico, Pico W, Pico 2, or Pico 2 W, without you having to make any changes to your program between different devices. The line beneath it, meanwhile, tracks whether the LED is on or off — your program explicitly turns the LED off when it starts, so you can set the state-tracking variable to off.

This time, your program isn’t going to be sending your web browser a plain text response; instead, it’s going to send Hypertext Markup Language (HTML), which is what lets web pages control their formatting and include hyperlinks and other interactive features. To make that easier to manage, create a variable to hold the page contents — but note that you’ll have to indent the code yourself, as your editor won’t create the indentation automatically:

```python
html = """
<!DOCTYPE html>
<html>
    <head> <title>Raspberry Pi Pico W</title> </head>
    <body> <h1>Raspberry Pi Pico W</h1>
        <p>%s</p>
    </body>
</html>
"""
```

Here, you’re building the skeleton of an HTML-format document — including a `<head>` section with a page title and a `<body>` section with a heading and a placeholder. You’ll notice that every *HTML tag* that’s opened has a matching tag with a slash at the front: this closes the tag, like telling a word processor to stop making what you’re typing bold or italicised.

The `%s` section is special: this is a placeholder for *dynamic content* — in other words, page content which will change depending on what you’re doing. You’ll see what this is for later in the program.

Next, open a socket the same way as in your previous program:

```python
address = socket.getaddrinfo("0.0.0.0", 80)[0][-1]
s = socket.socket()
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
s.bind(address)
s.listen(1)
print("Listening for connections on", wlan.ifconfig()[0])
```

Then, listen not only for connections from clients, but for specific *requests*:

```python
while True:
    try:
        client, address = s.accept()
        print("Connection accepted from", address)
        request = client.recv(1024).decode("UTF-8")
        print(request)
```

The request is how you’re going to control the LED, using what is known as a *representational state transfer application programming interface*, or *RESTful API*. That may sound complicated, but it’s simpler than it sounds: an application programming interface is a way for a program to talk to something, and in this case, it follows a set standard for sending and receiving information about the state of objects. Technically, what you’re writing here isn’t a true RESTful API — but it’s a good introduction to the core concepts behind one.

You need a way to handle incoming requests from the client, so add that next:

```python
        led_on = request.startswith("GET /led/on")
        led_off = request.startswith("GET /led/off")
        print("led_on = " + str(led_on))
        print("led_off = " + str(led_off))
```

Here you’re searching through the request that came from the client for two strings: `/led/on` and `/led/off`. These will act as toggles for switching the LED on and off, exactly as it looks — but you’re going to need more code for that to actually happen:

```python
        if led_on:
            print("Client requested to turn the LED on.")
            led_onboard.value(1)
            led_state = "LED is on"

        if led_off:
            print("Client requested to turn the LED off.")
            led_onboard.value(0)
            led_state = "LED is off"
```

Here you’re checking to see whether your search through the request found the strings `/led/on` or `/led/off`, and changing the value of the LED accordingly — turning it on or off, exactly as the client requested. If neither string was found in the request, then the LED is left alone — off if it was already off, or on if it was already on. Your program is also updating the `led_state` variable, changing it to on or off as required.

Finally, build the response using the HTML skeleton you built earlier in the program and the `led_state` variable, and send it to the client:

```python
        response = html % led_state

        client.send("HTTP/1.0 200 OK\r\n")
        client.send("Content-type: text/html\r\n\r\n")
        client.send(response)
        client.close()

    except OSError as e:
        client.close()
        print("Error, connection closed.")
```

Your finished program should look like this:

```python
from connect import wlan
import socket
import machine

led_onboard = machine.Pin("LED", machine.Pin.OUT)
led_onboard.value(0)
led_state = "LED is off"

html = """
<!DOCTYPE html>
<html>
    <head> <title>Raspberry Pi Pico W</title> </head>
    <body> <h1>Raspberry Pi Pico W</h1>
        <p>%s</p>
    </body>
</html>
"""

address = socket.getaddrinfo("0.0.0.0", 80)[0][-1]
s = socket.socket()
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
s.bind(address)
s.listen(1)
print("Listening for connections on", wlan.ifconfig()[0])

while True:
    try:
        client, address = s.accept()
        print("Connection accepted from", address)
        request = client.recv(1024).decode("UTF-8")
        print(request)

        led_on = request.startswith("GET /led/on")
        led_off = request.startswith("GET /led/off")
        print("led_on = " + str(led_on))
        print("led_off = " + str(led_off))

        if led_on:
            print("Client requested to turn the LED on.")
            led_onboard.value(1)
            led_state = "LED is on"

        if led_off:
            print("Client requested to turn the LED off.")
            led_onboard.value(0)
            led_state = "LED is off"

        response = html % led_state

        client.send("HTTP/1.0 200 OK\r\n")
        client.send("Content-type: text/html\r\n\r\n")
        client.send(response)
        client.close()

    except OSError as e:
        client.close()
        print("Error, connection closed.")
```

Save and run your program now. When Pico W or Pico 2 W has connected to the network, open a web browser and type its IP address into the address bar. You’ll see a simple web page load — looking considerably prettier than the plain-text response of your earlier program — which tells you what you probably already know: the on-board LED is switched off.

To control the led, you need to construct your request — which is as easy as appending `/led/on` to the address. For example, if Pico W or Pico 2 W has the IP address `192.168.50.10`, you’d type `192.168.50.10/led/on` into the browser’s address bar.

When you load that page, you’ll see the on-board LED light up. If you look at the response you receive in the browser, you’ll also notice that the dynamic section of the page — the `%s` placeholder — has been updated, and now says ‘LED is on’ instead of ‘LED is off’. To turn the LED off again, simply use `/led/off` instead. To check the current status of the LED — assuming you can’t just look at the LED and see for yourself, of course — just type the IP address without anything after it.

Having to append your request to the end of the address manually is a pain, however — but one you can alleviate by adding an interactive button to the page. Go back to the top of your program and find the HTML skeleton you built, then below the `<p>%s</p>` line add the following simple form:

```python
        <form action="%s">
           <input type="submit" value="%s" />
        </form>
```

To have the button provide a useful toggle, you need to know whether the LED is currently on or off. Find your two `if` statements, and add the following beneath the second:

```python
        if led_state == "LED is on":
            button_link = "/led/off"
            button_text = "Turn LED off"

        else:
            button_link = "/led/on"
            button_text = "Turn LED on" 
```

This will create a button to turn the LED on if it’s off, or off if it’s on. Finally, you’ll need to add these two new variables to the response you’re building so that the form appears in the page correctly. Find the `response = line` and change it to read:

```python
        response = html % (led_state,button_link,button_text)
```

Save your program — remembering to stop it first if it was already running — then click **Run** and reload the page in your browser. You’ll see a new button has appeared: click it, and the on-board LED should turn on. Click it again, and it’ll turn off. Keep clicking it, and you can create a very small disco light show.

Congratulations: you can now control Pico W and Pico 2 W over the network! From here, you can build on these concepts to create more complicated projects: how about a web page that lets you know if you’ve left a door open, or one that lets you turn on a light? Try connecting motors to the board, using a suitable motor driver, and making a simple robot you can control from a web browser.

To learn about Pico W and Pico 2 W’s more advanced Wi-Fi capabilities, including its ability to process data in a format known as *JSON* and to submit data to a remote endpoint server, read more in *Connecting to the Internet with Raspberry Pi Pico W-series* ([rptl.io/picow-connect](http://rptl.io/picow-connect)).
