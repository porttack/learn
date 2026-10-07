---
title: "Caesar Cipher: lesson plan"
source: original
level: both
companion: true
name_line: false
standards_locator: caesar-cipher
standards_open: true
---

A short teacher-led plan for [Caesar Cipher]({{ '/unplugged/caesar-cipher/' | relative_url }}):
hide a message by shifting every letter, then crack one with no key.
About **50 minutes**. Leaving it for a sub? Use the box below.

{% include unplugged/sub-box.html
   sheet="/unplugged/caesar-cipher/"
   slides="/unplugged/caesar-cipher-slides/"
   go="caesar"
   slides_stop="Decode, Then Encode"
   generator="/unplugged/caesar-cipher-generator/"
   keep_going="new set of coded messages"
   note="**Stuck on Crack it?** Tell students to try key 1, then key 2, and so on until real words appear. That really is the method."
   say="Today you're spies. Fill in your shift table, then decode the secret messages. Every letter moves the same number of places." %}

## Students will be able to

- Encrypt and decrypt a message with a shift (Caesar) cipher and a key.
- Crack a Caesar cipher by trying every key.
- Explain why a cipher with only 25 keys isn't safe.

## Before class

- Print one [worksheet]({{ '/unplugged/caesar-cipher/' | relative_url }}) per student.
- Print keep-going sheets from the [New set page]({{ '/unplugged/caesar-cipher-generator/' | relative_url }}):
  Copies = class size, Sets per student = 2 (front and back).
- Optional: the [slides]({{ '/unplugged/caesar-cipher-slides/' | relative_url }})
  and the [cipher wheel]({{ '/unplugged/caesar-cipher-wheel/' | relative_url }})
  (needs scissors and a brad).

## The lesson

### 1. Hook (5 minutes)

Show the slides through **HELLO becomes KHOOR**. Ask a student to decode
KHOOR out loud with key 3.

### 2. The sheet (20 minutes)

Students fill in their shift table, decode the messages, then encode one of
their own. The most common mistake is shifting the wrong direction when
decoding: decoding moves letters **back**.

### 3. Crack it (10 minutes)

Show the **No Key at All?** slide and let students guess how to crack a
message before they start the last part of the sheet.

### 4. Keep going (as students finish)

Partners trade encoded messages, then keep-going sheets.

### 5. Wrap-up (5 minutes)

Ask: *"How long would cracking a Caesar cipher take a computer?"* (Less
than a blink: only 25 keys.) *"So how do real ciphers stay safe?"* (So many
keys that trying them all would take longer than the age of the universe.)

## Going further

- **Programming students:** the CS50 [Caesar problem set]({{ '/cs50-psets/caesar/' | relative_url }})
  has them write this cipher in Python, with the key typed on the command
  line. It works best right after the paper version, because students
  already know exactly what the program should do. It's online, not
  printed, and checks itself with `check50`.
- **Cracking it a smarter way:** [Caesar Cipher: cracking it with letter frequency]({{ '/unplugged/caesar-cipher-frequency/' | relative_url }})
  finds the key without trying all 25.
- **A cipher that's much harder to crack:** [Vigenère Cipher]({{ '/unplugged/vigenere-cipher/' | relative_url }})
  uses a keyword, so each letter shifts by a different amount.

{% include standards-alignment.html %}
