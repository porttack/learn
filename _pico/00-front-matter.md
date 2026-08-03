---
layout: lesson
title: "Front matter"
pathway: pico
order: 0
source: rpi-pico-2e
---

## Get started with MicroPython on Raspberry Pi Pico, 2<sup>nd</sup> Edition

## Copyright Page

Get started with MicroPython on Raspberry Pi Pico

by Gareth Halfacree and Ben Everard

ISBN: 978-1-912047-29-1

Copyright © 2024 Gareth Halfacree and Ben Everard

Printed in the United Kingdom

Published by Raspberry Pi Ltd., 194 Science Park, Cambridge, CB4 0AB

Editors: Brian Jepson, Liz Upton

Technical Editors: Brian Jepson, Jo Hinchliffe

Interior Designer: Sara Parodi

Production: Nellie McKesson

Photographer: Brian O’Halloran

Illustrator: Sam Alder

Graphics Editor: Natalie Turner

Publishing Director: Brian Jepson

Head of Design: Jack Willis

CEO: Eben Upton

January 2025: Second Edition, Second Printing

June 2024: Second Edition

January 2021: First Edition

The publisher, and contributors accept no responsibility in respect of any omissions or errors relating to goods, products or services referred to or advertised in this book. Except where otherwise noted, the content of this book is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0)

## Welcome

You might think of computers as things you stick on your desk and type on. That is certainly one type of computer, but it’s not the only type. In this book, we’re looking at microcontrollers — small processing units with a bit of memory that are good at controlling other hardware. You probably have lots of microcontrollers in your house already.

There’s a good chance your washing machine is controlled by a microcontroller; maybe your watch is; you might find one in your coffee machine or microwave. All these microcontrollers already have software running on them and the manufacturers make it hard to make any kind of change to that software.

A Raspberry Pi Pico, on the other hand, is a microcontroller that you can easily program (and reprogram!) over a USB connection. In this book, we’ll look at how to get started with Pico and how to make it work with other electronic components. By the end of the book, you’ll know how to create your own programmable electronic contraptions. What you do with them is up to you.

You can find this book’s example code, errata, and other resources in its GitHub repository at [rptl.io/pico-resources-2e](http://rptl.io/pico-resources-2e). If you’ve found what you believe is a mistake or error in the book, please let us know by using our errata submission form at [rptl.io/pico-errata-2e](http://rptl.io/pico-errata-2e).

## About the authors

Gareth Halfacree is a freelance technology journalist, writer, and former system administrator in the education sector. With a passion for open-source software and hardware, he was an early adopter of the Raspberry Pi platform and has written several publications on its capabilities and flexibility. He can be found on Mastodon as [@ghalfacree@mastodon.social](https://mastodon.social/@ghalfacree) or via his website at [freelance.halfacree.co.uk](http://freelance.halfacree.co.uk).

Ben Everard is a geek who has stumbled into a career that lets him play with new hardware. As the editor of *HackSpace* magazine ([hsmag.cc](http://hsmag.cc)), he spends more time than he really should experimenting with the latest (and not-so latest) DIY tech. He lives in Bristol with his wife and two daughters in a house that’s slowly filling up with electronics equipment and 3D printers.

## Colophon

Raspberry Pi is an affordable way to do something useful, or to do something fun.

Democratising technology — providing access to tools — has been our motivation since the Raspberry Pi project began. By driving down the cost of general-purpose computing to below $5, we’ve opened up the ability for anybody to use computers in projects that used to require prohibitive amounts of capital. Today, with barriers to entry being removed, we see Raspberry Pi computers being used everywhere from interactive museum exhibits and schools to national postal sorting offices and government call centres. Kitchen table businesses all over the world have been able to scale and find success in a way that just wasn’t possible in a world where integrating technology meant spending large sums on laptops and PCs.

Raspberry Pi removes the high entry cost to computing for people across all demographics: while children can benefit from a computing education that previously wasn’t open to them, many adults have also historically been priced out of using computers for enterprise, entertainment, and creativity.

Raspberry Pi eliminates those barriers.

### Raspberry Pi Press

[store.rpipress.cc](http://store.rpipress.cc)

Raspberry Pi Press is your essential bookshelf for computing, gaming, and hands-on making. We are the publishing imprint of Raspberry Pi Ltd. From building a PC to building a cabinet, discover your passion, learn new skills, and make awesome stuff with our extensive range of books and magazines.

### The MagPi

[magpi.raspberrypi.com](http://magpi.raspberrypi.com)

*The MagPi* is the official Raspberry Pi magazine. Written for the Raspberry Pi community, it is packed with Pi-themed projects, computing and electronics tutorials, how-to guides, and the latest community news and events.
