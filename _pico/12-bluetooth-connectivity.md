---
layout: lesson
title: "Chapter 12: Bluetooth connectivity with Pico W and Pico 2 W"
pathway: pico
order: 12
source: rpi-pico-2e
subtitle: "Link Raspberry Pi Pico W or Pico 2 W to your smartphone, tablet, computer, or another Pico with Bluetooth Low Energy"
---

*Link Raspberry Pi Pico W or Pico 2 W to your smartphone, tablet, computer, or another Pico with Bluetooth Low Energy*

Designed for short-range wireless communication, Bluetooth is a technology you likely use every day without realising it: games console controllers typically connect via Bluetooth, as do wireless headphones and mobile phone headsets, and many wireless mice and keyboard use Bluetooth too.

The radio in Raspberry Pi Pico W and Pico 2 supports Bluetooth as well as Wi-Fi, in two variants: *Bluetooth Classic* and *Bluetooth Low Energy* (*BLE*). BLE offers a more energy-efficient take on wireless communication, and is frequently used in the Internet of Things (IoT) to gather data from sensors — which is exactly what you’ll be doing in this chapter.

To complete this project, you’ll need:

- One or two Raspberry Pi Pico W or Pico 2 W boards
- A smartphone or tablet with Bluetooth Low Energy (BLE) support
- The Punch Through Design LightBlue app, available free for Apple iOS and Google Android from their respective app stores.

### About Bluetooth

First released in 1998 by the Bluetooth Special Interest Group, Bluetooth has a much shorter range than Wi-Fi and transfers data at a much slower rate — but using much less energy, making it ideal for battery-powered and embedded devices.

The original Bluetooth standard, now known as Bluetooth Classic, was joined in 2009 by Bluetooth Low Energy (BLE). As the name implies, Bluetooth Low Energy requires even less energy than Bluetooth Classic — making it the go-to standard for connecting embedded systems like sensors.

The radio in Pico W and Pico 2 W supports both Bluetooth Classic and Bluetooth Low Energy modes. Because BLE consumes less power and bandwidth than classic, it’s well-suited to the sort of projects you’ll build with Pico-family devices; this chapter will use BLE exclusively.

### A BLE temperature sensor

Like in [Chapter 11, Wi-Fi connectivity with Pico W and Pico 2 W](/pico/11-wifi-connectivity/), using a Bluetooth Low Energy connection on Pico W or Pico 2 W requires quite a lot of ‘boilerplate’ code — static MicroPython code for activating the radio, defining functions for transmitting *advertising beacons*, decoding messages, and the like, which doesn’t change from program to program.

<aside class="callout note" markdown="1">
**ADVERTISING, NOT ADVERTS**

In this context, ‘advertising’ doesn’t mean your program is going to try to sell you something. Rather, it simply means that it will broadcast a message to any nearby devices telling them what services it offers — thus ‘advertising’ its capabilities.
</aside>

Thankfully, there’s an easier way: the `aioble` library. Designed for use along with MicroPython’s `bluetooth` library, `aioble` handles a lot of the boilerplate work for you — making it programs which use it shorter and easier to understand than their equivalents written using the `bluetooth` library alone.

The programs in this chapter build on the examples provided with the `aioble` library. To see the original examples, library documentation, and additional examples, head to the `aioble` GitHub repository at [rptl.io/aioble](http://rptl.io/aioble).

Open ViperIDE and create a new file, then type in the following:

```python
import struct
import asyncio
import aioble
import bluetooth
import machine
```

This imports the four libraries you’ll be using. `aoible` and `bluetooth` are for handling the Bluetooth Low Energy work; `struct` is for handling structured data, which you’ll be using to create a *payload* for your BLE advertising beacon; and `asyncio` is a library for handling *asynchronous tasks*.

Asynchronous tasks don’t run in-order like most Python programs, but appear to run at the same time as each other. While Pico W and Pico 2 W can have up to two physical processor cores active at any given time, they can run as many asynchronous tasks as you like — though, as it’s technically switching back and forth very quickly between them rather than running them truly simultaneously, performance will suffer if you run too many tasks at once.

Because you’ll be using the microcontroller’s built-in temperature sensor in this project, you’ll need to set things up the same as in [Chapter 8, Temperature gauge](/pico/08-temperature-gauge/). Add the following two lines to your program:

```python
sensor_temp = machine.ADC(machine.ADC.CORE_TEMP)
conversion_factor = 3.3 / (65535)
```

These, you may remember, tell Pico W or Pico 2 W to use its analogue-to-digital converter (ADC), connected to the microcontroller’s temperature sensor, and set up a mathematical conversion to map the read value so it can be converted into a temperature later in the program.

Next, you’ll need to set up some variables for your BLE advertising beacon. Add the following lines:

```python
ble_name = "picow_ble"
ble_svc_uuid = bluetooth.UUID(0x181A)
ble_characteristic_uuid = bluetooth.UUID(0x2A6E)
ble_appearance = 0x0300
ble_advertising_interval = 2000
```

The variable `ble_name` is reasonable straightforward: it’s a friendly name given to identify your beacon. It doesn’t have to be `picow_ble` — you could call it `kitchen_temperature`, `temp_sensor`, `sara`, or any other name of your choice.

The remaining lines, though, should be left as they are — for now, at least. The first sets a *universally unique identifier* (*UUID*) for the beacon’s *service type*. This isn’t chosen at random, unlike the name, but comes from a pre-set list of possible values set by the Bluetooth Special Interest Group (Bluetooth SIG), which is in charge of the Bluetooth and Bluetooth Low Energy (BLE) standards. Here, you’re setting the UUID to the hexadecimal number 0x181A, which is 6,170 in decimal. That corresponds to a service type of “environmental sensing,” meaning a device which measures some aspect of its surrounding environment.

The line below it sets another UUID, this time for the beacon’s *characteristic*: 0x2A6E, 10,862 in hexadecimal, which is the UUID for a temperature sensor. Put together, the two UUIDs mean that the beacon you’re creating will be an environmental sensor which measures temperatures.

`ble_appearance` isn’t a UUID, but a hexadecimal value which chooses from a list of icons to represent the beacon. In this case, it’s icon 0x0300, or 768 in decimal, which is a generic picture of a thermometer. These icons are only displayed on certain devices, and you won’t see them on Pico W itself, but you should set one anyway for completeness. Finally, the *advertising interval* is the time, in milliseconds, between your beacon’s advertising broadcasts.

<aside class="callout note" markdown="1">
**KNOW YOUR UUIDS**

These values are fine for the beacon you’re making now, but you’ll need to change them if you want to build anything other than a temperature sensor beacon. A full list of UUIDs is available in the Bluetooth SIG’s Assigned Numbers Document — totalling nearly 400 pages and covering every possible service, characteristic, and appearance option — at [rptl.io/btnums](http://rptl.io/btnums).
</aside>

You’ll now need to do a little more setup for the BLE beacon part of the program. Add the following lines:

```python
ble_service = aioble.Service(ble_svc_uuid)
ble_characteristic = aioble.Characteristic(
    ble_service,
    ble_characteristic_uuid,
    read=True,
    notify=True)
aioble.register_services(ble_service)
```

For the line starting `ble_characteristic`, you can press the ENTER key after the opening bracket and after every comma to make it easier to read, as shown — your editor will automatically indent your code for you. Alternatively, you can reduce the number of lines in the program by writing it all on one line — finishing at `notify=True)`.

Here, you’re setting up `aioble` with the details you inserted earlier in your program. If you want to change them later — to choose a different name, or to change the service or characteristic type, you don’t need to touch this block of code at all.

The two most important sections are `read=True` and `notify=True`, which configure your BLE beacon so that its values can be read — because it wouldn’t be much use if they couldn’t — and so that devices can choose to *subscribe* to the beacon to receive notifications when new readings are available.

Next, you need to create the tasks which will run side-by-side to make the beacon work. The first one you’ll need is the beacon task itself. Add the following lines to your program:

```python
async def ble_task():
    while True:
        async with await aioble.advertise(
            ble_advertising_interval,
            name=ble_name,
            services=[ble_svc_uuid],
            appearance=ble_appearance) as connection:
            print("Connection from", connection.device)
            await connection.disconnected()
```

Here you’re creating an *asynchronous coroutine* which uses `aioble` to activate an advertising beacon, transmit at the interval chosen earlier, and to print a message to the Terminal when a device connects. This block of code won’t run right now, but only when it’s called as a task later in the program.

Before you can create your next coroutine, you need to create a *helper function* which will take the temperature readings from the sensor and format them in the way that `aioble` needs in order to transmit them as a payload in the advertising beacon. Add the following two lines:

```python
def encode_temp(temperature):
    return struct.pack("<h", int(temperature * 100))
```

This function takes the temperature reading from the sensor and turns it into *structured data* in the format expected of a BLE beacon. It also converts it from a floating-point number — one with a decimal point — to an integer, multiplying it by 100 first. That multiplication will be important later, when you come to read the payload, so remember it!

With the helper function set up, you can create your second asynchronous coroutine — responsible for actually reading the temperature sensor. If you’ve worked through [Chapter 9, Data logger](/pico/09-data-logger/), the next few lines will look very familiar:

```python
async def sensor_task():
    while True:
        reading = sensor_temp.read_u16() * conversion_factor
        temperature = 27 - (reading - 0.706) / 0.001721
        print("Temperature:", temperature)
        ble_characteristic.write(encode_temp(temperature))
        await asyncio.sleep_ms(2000)
```

Here, you’re reading the value from the temperature sensor and multiplying it by the conversion factor, then using the ‘magic numbers’ for the RP2040 and RP2350 microcontrollers to convert that reading to a temperature in degrees Celsius. This is then printed to the Terminal, encoded using the helper function you just wrote, and written as a BLE beacon payload.

Finally, the coroutine goes to sleep for 2,000 milliseconds — two seconds. It doesn’t use the normal `sleep()` instruction, though: here you’re using a special version which comes with the `asyncio` library, as it’s *non-blocking.* The normal `sleep()` instruction is *blocking*, meaning that your program can’t do anything else while it’s sleeping; `asyncio.sleep_ms()` isn’t, and the other task in your program can continue to run even while your sensor task is sleeping until its next scheduled reading.

Like your earlier coroutine, this block of code won’t run until the task is started. To do that, add the following lines to your program:

```python
async def main():
    task1 = asyncio.create_task(ble_task())
    task2 = asyncio.create_task(sensor_task())
    await asyncio.gather(task1, task2)
```

This creates two tasks, named `task1` and `task2`, corresponding to the BLE beacon coroutine and the sensor reading coroutine respectively. The two tasks are then set running using `asyncio.gather()`, while `await` means that the main coroutine will continue to run until both tasks have finished. Because both tasks are based on coroutines which loop infinitely, that means the main coroutine will never finish — keeping your beacon running so long as the microcontroller has power.

Even now, though, your code won’t actually run — but you’re almost there. Add the final two lines as shown:

```python
print("Launching Raspberry Pi Pico W BLE temperature sensor...")
asyncio.run(main())
```

This prints a message to the Terminal and tells the `asyncio` library to run its main coroutine, converting the two other coroutines into tasks and setting them running. That’s it: your program is finished!

Save this program to your Pico W or Pico 2 W as `BLE_Temperature.py` and click **Run**. You’ll see your launch message printed to the Terminal, followed by a temperature reading every two seconds. To read the transmitted beacon, you’ll need a device capable of receiving Bluetooth Low Energy beacons.

The good news is, you probably already do: all modern smartphones and most tablets include Bluetooth radios with Bluetooth Low Energy support as standard. The software you’ll need is free, too: open the Apple App Store or Google Play, on iOS or Android respectively, and search for the ‘Punch Through Design LightBlue’ app and install it.

Open the app, give it permission to access the Bluetooth radio and your location if requested, and look through the list of nearby beacons for the one called `picow_ble`. You may find it helpful to use the app’s filter option to narrow the list down to the strongest signals (a lower number indicates a stronger signal).

Click the **Connect** button and the LightBlue app will connect to Pico W or Pico 2 W over Bluetooth Low Energy. Go down to the **Environmental Sensing** section and tap on **Temperature** and you’ll see your payload data — if not, tap the **Read Again** button to capture a fresh reading.

The temperature you receive, though, doesn’t look like a number at first glance. That’s because, by default, LightBlue decodes the structured data into hexadecimal. To make the number more easily readable, look for a drop-down box next to **Data format** which says **Hex**. Tap it, and choose **Signed Little-Endian** from the list: this will display the beacon data in decimal, or base ten — the normal counting system you use every day. Finally, you need to undo the multiplication your helper function does: divide the displayed number by 100 to get the reported temperature in degrees Celsius: a value of 3032, for example, means a temperature of 30.32°C.

Congratulations: your Pico W or Pico 2 W is now a wireless temperature sensor! If you want to be able to deploy your Pico W or Pico 2 W away from your computer as a remote sensor, remember to save a copy of your program as `main.py` — then it’ll automatically run every time you connect the board to power, either via a USB power supply or a battery.

### Receiving services

While you can use your smartphone or tablet to receive the beacon broadcasts, you can also use another Pico W or Pico 2 W. If you only have one Pico W or Pico 2 W, feel free to skip this part of the chapter — otherwise, make sure you’ve saved your temperature beacon program as `main.py` and disconnect your first Pico W or Pico 2 W, connect your second board in its place, then open ViperIDE and start a new program:

```python
import struct
import asyncio
import aioble
import bluetooth

ble_name = "picow_ble"
ble_svc_uuid = bluetooth.UUID(0x181A)
ble_characteristic_uuid = bluetooth.UUID(0x2A6E)
ble_scan_length = 5000
ble_interval = 30000
ble_window = 30000
```

Here you’re using the same libraries as before, and some of the same variables — only this time, rather than setting the beacon name and UUIDs you’re telling Pico W or Pico 2 W what it should be looking for when it scans for beacons.

There are three other variables here too: `ble_scan_length` sets the time, in milliseconds, that a scan for BLE advertising beacons should last before the program gives up, while `ble_interval` and `ble_window` configure detection timings in microseconds — setting them low in order to improve the likelihood of the two boards successfully seeing each other and connecting.

You’re going to be creating asynchronous coroutines again, starting with one using `aoible` to scan for a BLE beacon which matches the details you set above — one with the name `picow_ble`, the service UUID of 0x181A, and characteristic ID of 0x2A6E. Type the following:

```python
async def ble_scan():
    print("Scanning for BLE beacon named", ble_name, "...")
    async with aioble.scan(
    ble_scan_length,
    interval_us=ble_interval,
    window_us=ble_window,
    active=True) as scanner:
        async for result in scanner:
            if result.name() == ble_name and \
               ble_svc_uuid in result.services():
                return result.device
    return None
```

This coroutine prints a message to the Terminal and begins a five-second scan for BLE beacons in the area. It then checks each beacon’s name and service UUID against the variables you set earlier in the program — and if there’s a match, returns the device’s details for use later in the program.

Next, you’ll need to create another helper function for handling structured data. Type the following:

```python
def decode_temp(data):
    return struct.unpack("<h", data)[0] / 100
```

If you compare this to the helper function in your earlier program, you’ll notice it’s the exact opposite: where your previous function converted the temperature reading into an integer, multiplied it by 100, and packed it as structured data, this one unpacks structured data and divides the resulting value by 100 — getting you back to a temperature reading in degrees Celsius.

Now your program needs to handle the output of the scan. Type the following:

```python
async def main():
    device = await ble_scan()
    if not device:
        print("BLE beacon not found.")
        return

    try:
        print("Connecting to", device)
        connection = await device.connect()
    except asyncio.TimeoutError:
        print("Connection timed out.")
        return
```

Here you’re setting up some error handling, in case your scan can’t find the BLE beacon running on your other Pico. Assuming it does find it, your program will try to connect — handling another error if the connection fails.

To actually do something once connected, you’ll need some more code. Add the following, paying careful attention to indentation and making sure the first line is indented by four spaces to make it part of the `main()` coroutine:

```python
    async with connection:
        try:
            ble_service = await connection.service(ble_svc_uuid)
            ble_characteristic = await \
              ble_service.characteristic(ble_characteristic_uuid)
        except (asyncio.TimeoutError, AttributeError):
            print("Timeout discovering services/characteristics.")
            return

        while True:
            temp = decode_temp(await ble_characteristic.read())
            print("Temperature:", temp)
            await asyncio.sleep_ms(2000)
```

This, again, includes some error handling — this time in case the connection is successful, but the beacon doesn’t send its service or characteristic UUIDs. This shouldn’t happen, unless the beacon Pico W or Pico 2 W was unplugged just after connecting — or if the two boards are just slightly too far apart and suffering from a weak signal strength.

Assuming there’s no error, the code then calls the helper function to take the beacon payload and decode it into a temperature value before printing it to the Terminal. Finally, there’s a non-blocking delay — set to two seconds, matching the delay in your beacon program — before the next reading is printed to the Terminal.

As before, you’ll need one all-important line to set things into motion:

```python
asyncio.run(main())
```

Save this to your second Pico W or Pico 2 W as `BLE_Temperature_Client.py`. Click **Run**, and watch the Terminal: you’ll see the scan for beacons begin, then exit with an error after failing to find a match.

Power up your original Pico W or Pico 2 W, with the temperature beacon program on it as `main.py`. Give the beacon Pico W or Pico 2 W a second or two to set things up, then click Run again: this time your scanning Pico W or Pico 2 W should find the beacon and automatically connect.

Look in the Terminal, and you’ll see the beacon content from your first Pico W or Pico 2 W printed out — after conversion from the structured data to a human-friendly temperature measurement in degrees Celsius. The second Pico W or Pico 2 W will *subscribe* to the beacon, meaning that it will continue to receive new data every time it’s transmitted — printing the latest reading to the Terminal once every two seconds.

Congratulations: you’ve now connected two Pico W or Pico 2 Ws wirelessly over Bluetooth Low Energy, creating your own Internet of Things in miniature!

<aside class="callout note" markdown="1">
**FURTHER READING**

You can learn more about Pico W and Pico 2 W’s Bluetooth capabilities and using them at a lower level, without the `aioble` library, in the free book *Connecting to the Internet with Raspberry Pi Pico W-series*, available from [rptl.io/picow-connect](http://rptl.io/picow-connect).
</aside>
