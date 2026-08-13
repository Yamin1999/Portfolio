---
title: Embedded C & Low-Level Development
summary: Three years of C and Embedded C on ARM-based carrier Ethernet switches running embedded Linux - memory, pointers, packed structures, byte order, and the debugging discipline a no-IDE workflow demands.
category: Embedded Systems
context: professional
organization: Shanghai BDCOM
role: Software Engineer (R&D)
started: 2023-04-01
ended: 2026-07-31
ongoing: false
tech:
  - C
  - Embedded C
  - Embedded Linux
  - VxWorks
  - ARM
  - GCC
  - GDB
  - trace-cmd
  - KernelShark
  - ftrace
confidentiality: Describes engineering practice and general technique. Product internals and source remain confidential to the employer.
featured: true
order: 3
published: true
publishedAt: 2026-07-31
---

## Overview

The substrate under every feature I shipped: C and Embedded C on ARM-based
carrier Ethernet switches running embedded Linux and VxWorks, developed and
debugged entirely from the command line with GCC and GDB.

## The working environment

No IDE. Editor, `make`, GCC, GDB, and a serial console into the target. This is
worth stating plainly because it shapes the skills it builds. Without an IDE
resolving symbols and stepping through code for you, you develop a mental model
of the program that has to be accurate, and you learn to read a stack trace,
a disassembly listing and a memory dump as primary sources rather than as a last
resort.

Cross-compiling for ARM adds the constraint that the machine you build on is not
the machine you run on. Word size, alignment and endianness assumptions that hold
on an x86 development host do not necessarily hold on the target, and the failures
they cause appear only after deployment.

## The recurring problem classes

Almost all the low-level bugs I debugged fell into a handful of categories:

**Pointers and memory management.** Use-after-free and buffer overruns in a
long-running switch process rarely fail immediately. They corrupt something
adjacent and surface later, somewhere unrelated, which is why the symptom is
almost never near the cause.

**Packed structures.** Protocol frames map to structures whose layout is fixed by
a standard rather than by the compiler. Padding the compiler inserts for
alignment silently changes the wire format. The structure must be packed, and
each field's offset must be verified against the specification rather than
assumed.

**Byte-order conversion.** Network byte order is big-endian; the host may not be.
Every multi-byte field crossing the boundary needs explicit conversion. Miss one
and you get a field that reads as a plausible but wrong number - the worst kind
of bug, because nothing crashes.

**64-bit counters on 32-bit-oriented paths.** Statistics counters must be
monotonic and wrap correctly. Non-atomic 64-bit reads on a 32-bit path can be
torn by a concurrent update, producing a counter that occasionally jumps
backwards.

**Type casting.** C will let you reinterpret almost any pointer as almost any
type. Casts that discard `const`, narrow a wider integer, or reinterpret a buffer
as a structure with different alignment requirements are all accepted by the
compiler and all capable of producing corruption on the target.

## Debugging technique

- **GDB** as the primary instrument - breakpoints, watchpoints on corrupted
  variables to catch the write rather than the read, and inspection of raw memory
  when a structure does not look the way it should.
- **ftrace and trace-cmd** for questions about time and ordering rather than
  state: where the latency went, in what order two events actually occurred,
  how long a path took between a hardware notification and its handler.
- **KernelShark** to read those traces visually, which makes ordering problems
  across concurrent paths obvious in a way that a text log does not.
- **Wireshark** whenever the question involved anything on the wire.

## Adjacent work

- **HAL and driver integration** - the boundary between protocol logic and the
  switching hardware underneath it.
- **Event-driven hardware notification handling**, so link events propagate
  immediately rather than at the next poll.
- **TCP/UDP communication** for management-plane services on the device.
- **Performance analysis** on hot paths, using traces rather than intuition to
  decide what was actually slow.

## Lessons learned

On embedded targets, reproducing a bug reliably is most of the work; fixing it is
usually the short part. Effort spent making a failure deterministic - narrowing
the trigger, capturing the exact frame, pinning the timing - pays for itself
immediately, because a bug you can reproduce on demand is a bug you can fix in an
afternoon, and one you cannot is a bug you argue about for a week.
