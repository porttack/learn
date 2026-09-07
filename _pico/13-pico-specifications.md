---
layout: lesson
title: "Appendix A: Raspberry Pi Pico specifications"
pathway: pico
order: 13
label: "Appendix A"
source: rpi-pico-2e
---

The various components and features of a microcontroller are known as its *specifications*, and a look at the specifications gives you the information you need to compare two microcontrollers.

These specifications can seem confusing at first, are highly technical, and you don’t need to know them to use your Raspberry Pi Pico-family device, but they are included here for the curious reader.

Raspberry Pi Pico 2’s microcontroller chip is a Raspberry Pi RP2350, which you’ll see indicated by markings etched into the top of the component if you look closely enough. The microcontroller’s name can be broken down into sections, each of which has a particular meaning:

- RP means ‘Raspberry Pi’, simply enough.
- 2 is the number of *processor cores* the microcontroller has.
- 3 is the type of processor core, indicating in this case the RP2350 uses a processor core called the *Cortex-M33* from Cambridge-based Arm.
- 5 is how much *random access memory* (*RAM*) the microcontroller has, based on a special mathematical function: `floor(log2(RAM/16))`. In this case, ‘5’ means the chip has *520 kilobytes* (*kB*) of RAM.
- 0 is how much *non-volatile* (*NV*) storage the chip has, and is worked out in the same way as the RAM: `floor(log2(NV/16))`. In this case, 0 simply means there is no non-volatile storage on-board.

The RP2350 is the second microcontroller from Raspberry Pi and was preceded by the RP2040 in the original Raspberry Pi Pico. The same numbering convention has been used for both, so you can quickly see how their features compare.

On the Pico 2-series boards, the two Cortex-M33 or Hazard3 RISC-V processors on the RP2350 run at 150MHz (150 million cycles per second). The original Pico’s RP2040 two Cortex-M0+ processor cores are set to 125MHz by default.

The microcontroller’s RAM is built into the same chip as the processor’s cores, and on the RP2350, takes the form of ten individual memory banks totalling 520 kB (520,000 bytes) of static RAM (SRAM). The RAM is used to store your programs and the data they need. The RP2040 has six banks totalling 264 kB.

Both microcontrollers include 30 multifunction general-purpose input/output (GPIO) pins, 26 of which are brought out to physical pin connectors and one of which is connected to an on-board LED (on the Pico, that is; on the Pico W and 2W, the on-board LED is connected to a GPIO on the wireless module). Three of these GPIO pins are connected to an analogue-to-digital converter (ADC), while another ADC channel is connected to an on-chip temperature sensor.

Both include two *universal asynchronous receiver-transmitter* (*UART*), two *serial peripheral interface* (*SPI*), and two *inter-integrated circuit* (*I2C*) buses for connections to external hardware devices like sensors, displays, *digital-to-analogue converters* (*DACs*), and more. The microcontroller also includes *programmable input/output* (*PIO*), which lets the programmer define new hardware functions and buses in software.

The micro USB connector provides a UART-over-USB serial link to the microcontroller for programming and interaction, and also powers the chip. Hold down the BOOTSEL button when plugging the cable to switch the microcontroller into *USB Mass Storage Device mode*, allowing you to load new *firmware*.

The microcontrollers also include an accurate *on-chip clock and timer*, which allows it to keep track of the time and date. The clock can store the year, month, day, day of the week, hour, minute, and second, and automatically keeps track of elapsed time as long as power is provided.

Finally, both include *single-wire debug* (*SWD*) for hardware debugging purposes, brought out to three pins at the bottom of your Pico. [Figure A-1](#fig-13-1) shows the major on-board components of the Raspberry Pi Pico.

<figure id="fig-13-1">
  <img src="{{ '/assets/img/pico/fig-13-1.png' | relative_url }}" alt="Figure A-1: The major components of the Raspberry Pi Pico 2 board">
  <figcaption>Figure A-1: The major components of the Raspberry Pi Pico 2 board</figcaption>
</figure>

Here are the original Raspberry Pi Pico specifications:

- CPU: 32-bit dual-core ARM Cortex-M0+ up to 133MHz (125MHz default)
- RAM: 264kB of SRAM in six independently configurable banks
- Storage: 2MB external flash RAM
- GPIO: 26 pins
- ADC: 3 × 12-bit ADC pins
- PWM: Eight slices, two outputs per slice for 16 total
- Clock: Accurate on-chip clock and timer with year, month, day, day-of-week, hour, second, and automatic leap-year calculation
- Sensors: On-chip temperature sensor connected to 12-bit ADC channel
- LEDs: On-board user-addressable LED
- Bus Connectivity: 2 × UART, 2 × SPI, 2 × I2C, 2 × programmable I/O (PIO) blocks (8 state machines in total)
- Hardware Debug: Single-Wire Debug (SWD)
- Mount Options: Through-hole and castellated pins (unpopulated) with 4 × mounting holes
- Power: 5V via micro USB, 3.3V via 3V3 pin, or 2–5V via VSYS pin

Here are the specifications for the Pico 2:

- CPU: Dual Cortex-M33 or Hazard3 processors at up to 150MHz (the default)
- RAM: 520kB of SRAM in ten independently configurable banks
- Storage: 4MB external flash RAM
- GPIO: 26 pins
- ADC: 3 × 12-bit ADC pins
- PWM: Eight slices, two outputs per slice for 16 total
- Clock: Accurate on-chip clock and timer with year, month, day, day-of-week, hour, second, and automatic leap-year calculation
- Sensors: On-chip temperature sensor connected to 12-bit ADC channel
- LEDs: On-board user-addressable LED
- Bus Connectivity: 2 × UART, 2 × SPI, 2 × I2C, 3 × programmable I/O (PIO) blocks (12 state machines in total)
- Hardware Debug: Single-Wire Debug (SWD)
- Mount Options: Through-hole and castellated pins (unpopulated) with 4 × mounting holes
- Power: 5V via micro USB connector, 3.3V via 3V3 pin, or 2–5V via VSYS pin
- Security: Arm TrustZone for Cortex-M, signed boot, 8 kB of antifuse OTP for key storage, SHA-256 acceleration, a hardware TRNG, and fast glitch detectors.

The Pico W and Pico 2 W add the following, powered by an Infineon CYW43439:

- Wi-Fi: Single-band 802.11n on a 2.4GHz wireless interface
- Personal Area Network: Bluetooth 5.2, supporting Bluetooth LE Central and Peripheral roles, as well as Bluetooth Classic.
- Antenna: onboard antenna licensed from ABRACON (formerly ProAnt)
