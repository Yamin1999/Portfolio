---
title: TFTP Server Module
summary: A standalone TFTP server in C implementing RFC 1350, with the blocksize and windowsize extensions for practical transfer performance on network devices.
category: Systems Programming
context: professional
organization: Shanghai BDCOM
role: Software Engineer (R&D)
started: 2024-03-01
ended: 2024-08-01
ongoing: false
tech:
  - C
  - Embedded Linux
  - UDP
  - Sockets
  - GDB
  - Wireshark
standards:
  - RFC 1350
  - RFC 2348
  - RFC 7440
repo: https://github.com/
featured: true
order: 1
published: true
publishedAt: 2024-08-01
---

## Overview

Network devices need a way to pull firmware images and configuration files from a
management system, and TFTP remains the protocol that switches and routers
actually speak during boot and upgrade. I built a standalone TFTP server in C
implementing RFC 1350, extended with the negotiated options that make it usable
for real firmware-sized transfers.

## Problem

Plain RFC 1350 TFTP is a lockstep protocol: 512-byte data blocks, one
acknowledgement per block, no pipelining. Over a link with any appreciable
round-trip time this is dominated by waiting rather than sending. Transferring a
firmware image this way is slow enough to be an operational problem, not just an
inefficiency.

The server also had to be configurable at runtime by an operator through the
device CLI, rather than through a config file baked in at build time.

## Approach

The implementation is built around a single UDP socket with a per-transfer state
machine. Each transfer holds its own block counter, retransmission timer, file
handle and negotiated option set, so concurrent transfers never share mutable
state.

Two RFC extensions do the heavy lifting:

- **RFC 2348 (blocksize)** raises the data block from 512 bytes toward the path
  MTU, cutting the number of round trips proportionally.
- **RFC 7440 (windowsize)** allows several blocks in flight before an
  acknowledgement is required, which is what actually removes the lockstep
  stall.

Both are negotiated through the option acknowledgement mechanism, so a client
that does not understand them still gets a strictly conformant RFC 1350
transfer.

## Implementation

The pieces worth calling out:

- **Option negotiation.** The initial read or write request carries the client's
  proposed options. The server clamps each to what it can support and replies
  with an OACK naming only the options it accepted — never options the client
  did not offer.
- **Retransmission.** Each transfer keeps a timer and a retry counter. Timeouts,
  retry limits and the UDP port are all operator-configurable through the CLI,
  along with an enable/disable control for the server itself.
- **Sliding window.** With windowsize negotiated, the server tracks the lowest
  unacknowledged block and refills the window on each valid ACK, falling back to
  retransmitting from the last acknowledged block on timeout.
- **Bounds discipline.** Every packet is length-checked before any field is read.
  TFTP's header is small and its filename and mode fields are NUL-terminated
  strings straight off the wire, which is exactly the shape of parser that
  invites overruns if you trust the buffer.

## Debugging

Almost all of the interesting bugs were visible only on the wire. Wireshark
captures of complete transfer sessions showed option negotiation, block
sequencing and the precise point where a window stalled — a class of bug that is
effectively invisible from inside the process, because the server's own view is
simply "no ACK arrived."

GDB covered the rest: watchpoints on the block counter caught an off-by-one in
window refill that only appeared when the file size was an exact multiple of the
block size.

## Results

- Conformant RFC 1350 transfers against unmodified clients.
- Substantially fewer round trips per transfer once blocksize and windowsize are
  negotiated, with the reduction scaling with the negotiated window.
- Runtime configuration of port, timeout, retry count and enable state through
  the device CLI.

## Lessons learned

The final-block edge case is where TFTP implementations go wrong. A transfer ends
when a data block is *shorter* than the negotiated block size, which means a file
whose length is an exact multiple of the block size must end with a zero-length
data block. Getting that wrong produces a server that works perfectly until
someone transfers a file of exactly the wrong size.
