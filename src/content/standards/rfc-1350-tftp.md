---
title: Trivial File Transfer Protocol
designation: RFC 1350, 2348, 7440
publisher: IETF
area: File transfer over UDP
summary: A deliberately minimal file transfer protocol, still the one network devices speak during firmware upgrade and boot, plus the two extensions that make it fast enough to be practical.
officialUrl: https://www.rfc-editor.org/rfc/rfc1350
implemented: true
relatedProjects:
  - tftp-server-module
order: 6
published: true
publishedAt: 2026-08-13
---

## What it defines

RFC 1350 specifies TFTP in a handful of pages. Five packet types, 512 byte data
blocks, one acknowledgement per block, running over UDP with its own
retransmission. It has no authentication and no directory listing. The
minimalism is the feature: it is small enough to fit in a boot ROM, which is
why switches and routers still use it to pull firmware images.

The cost is that lockstep acknowledgement. Over any link with real round trip
time, a transfer spends most of its time waiting rather than sending.

Two extensions fix that. RFC 2348 negotiates a larger block size, reducing the
number of round trips proportionally. RFC 7440 negotiates a window, allowing
several blocks in flight before an acknowledgement is required, which is what
actually removes the stall.

## The parts that matter in implementation

**The final block rule catches everyone.** A transfer ends when a data block is
shorter than the negotiated block size. A file whose length is an exact multiple
of the block size must therefore end with a zero length data block. Miss it and
you have a server that works perfectly until someone transfers a file of exactly
the wrong size.

**Option negotiation must be conservative.** The server acknowledges only options
the client actually offered, clamped to what it can support, and a client that
understands neither extension still gets a strictly conformant RFC 1350 transfer.

**Every field arrives from the wire.** Filenames and modes are NUL terminated
strings in a UDP datagram, which is exactly the shape of parser that invites
overruns without length checks.

## Where I have used it

Built a standalone TFTP server implementing all three, with configurable port,
timeout and retry count.
