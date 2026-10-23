---
author: Raven
lang: en
pubDatetime: 2026-10-10T00:00:00.000+08:00
title: Understanding Two's Complement, Endianness, and Floating Point with a Small C Program
draft: false
featured: false
tags:
  - csapp
  - c
  - memory
  - floating-point
hideEditPost: true
timezone: Asia/Shanghai
description: Use BitView's integer, byte, and IEEE 754 field output to understand two's complement, little-endian storage, the representation error in 0.1, and safe ways to inspect C object memory.
---

<!-- Source: the original CSAPP BitView README, checked against main.c, Makefile, and tests.sh. Actual builds, tests, and Sanitizer results remain unverified. The complete C project is not included here. -->

`-42`, `0xffffffd6`, and `d6 ff ff ff` look quite different, yet they can describe the same C object. The difference is whether we are reading its value, its bit pattern, or its bytes in address order.

BitView is a command-line data inspector written in C17. It displays these representations together and can also decode floating-point fields, detect machine endianness, and inspect file bytes. The goal is to connect the bytes we see with the rules used to interpret them.

## Start with a Negative Integer

The original BitView project supports these inputs:

```text
./bitview int8|int16|int32|int64 VALUE
./bitview uint8|uint16|uint32|uint64 VALUE
./bitview float|double VALUE
./bitview endian
./bitview file PATH [MAX_BYTES]
```

Consider `int32 -42`. The following excerpt comes from the original README and illustrates a little-endian machine. It has not been rerun for this article:

```text
type:      int32_t
signed:    -42
hex:       0xffffffd6
binary:    11111111 11111111 11111111 11010110
bytes:     d6 ff ff ff
endian:    little-endian
unsigned:  4294967254
```

`signed` is the value under a signed interpretation; `hex` and `binary` show the bit pattern; `bytes` lists bytes from the lowest memory address to the highest. The last line interprets the same 32 bits as an unsigned integer, producing a large positive value.

### Why Does a Negative Integer Become a Large Unsigned Value?

For 32-bit two's complement, the unsigned bit pattern corresponding to `-42` can be calculated as:

```text
2^32 - 42 = 4294967254 = 0xffffffd6
```

Alternatively, start with positive `42`, invert the bits within a fixed width of 32 bits, and add one:

```text
42          00000000 00000000 00000000 00101010
Invert      11111111 11111111 11111111 11010101
Add one     11111111 11111111 11111111 11010110
```

A bit pattern does not label itself as negative. Its type determines the interpretation. For this pattern, `int32_t` gives `-42`, while `uint32_t` gives `4294967254`. This conclusion concerns fixed-width two's-complement types; an implementation providing `int32_t` must satisfy its width and representation requirements. See [C committee draft N1570, section 7.20.1.1](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf).

Changing the input from `-42` to `-1` exposes another useful boundary: 32-bit two's-complement `-1` consists of 32 consecutive ones.

## Why Can Byte Order Reverse Without Changing the Value?

One hexadecimal digit represents four bits; two hexadecimal digits represent an eight-bit byte. Split `0xffffffd6` into four bytes:

```text
Most significant to least significant: ff ff ff d6
```

On a little-endian machine, the least significant byte is stored at the lowest address. Reading in memory order therefore gives:

```text
Lowest address to highest address: d6 ff ff ff
```

A big-endian machine stores the most significant byte at the lowest address. Both orders can represent the same value when read with the corresponding rules. Interpreting little-endian bytes using big-endian rules produces the wrong result.

BitView detects endianness using `0x0102`: it copies the object into a byte array and examines the first two bytes. `02 01` indicates little-endian storage; `01 02` indicates big-endian storage.

## Inspect Objects with memcpy Instead of Incompatible Pointer Access

A tempting way to inspect memory is to cast a `float *` to `uint32_t *` and dereference it. Even when the types have the same size, that access can violate C's type-access rules.

BitView uses `memcpy` instead. This minimal example can be saved as a standalone C file and focuses only on reading an object's bytes:

```c
#include <assert.h>
#include <inttypes.h>
#include <limits.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

int main(void)
{
    _Static_assert(CHAR_BIT == 8, "This example requires 8-bit bytes");

    int32_t value = -42;
    uint32_t raw = 0;
    unsigned char bytes[sizeof(value)];

    memcpy(&raw, &value, sizeof(raw));
    memcpy(bytes, &value, sizeof(bytes));
    assert(raw == UINT32_C(0xffffffd6));

    printf("signed: %" PRId32 "\n", value);
    printf("hex:    0x%08" PRIx32 "\n", raw);
    printf("bytes: ");
    for (size_t i = 0; i < sizeof(bytes); ++i) {
        printf(" %02x", (unsigned int)bytes[i]);
    }
    putchar('\n');
    return 0;
}
```

This copies the object representation into destination objects instead of accessing `value` through an incompatible pointer type. The byte array preserves memory order, while `raw` interprets the same bit pattern using the corresponding unsigned integer rules. See [N1570, sections 6.2.6.1, 6.5, and 7.24.2.1](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf) for object representation and character-type access.

BitView also favors unsigned integers for bit operations. That makes manipulation of bit patterns clearer, but it does not make every shift valid: the shift count must still be smaller than the width of the promoted left operand.

## Why Does 0.1 Print as 0.100000001?

The original project includes these usage examples:

```bash
./bitview uint16 0xbeef
./bitview float 0.1
./bitview double -0.0
./bitview endian
```

`0.1` is an infinitely repeating fraction in binary:

```text
0.1₁₀ = 0.000110011001100110011…₂
```

A reduced rational number has a finite binary fraction only when its denominator is a power of two. For example, `0.5 = 1/2` and `0.75 = 3/4` have finite representations; `0.1 = 1/10` does not. Even a finite representation must fit the precision and exponent range of the target floating-point format.

In the common IEEE 754 binary32 format, rounding to nearest stores `0.1` as a nearby representable number. BitView prints `float` using `%.9g`, so the original README displays this difference as `0.100000001`. Printing fewer digits may show `0.1` again, but a shorter display does not increase storage precision.

### Separate the Sign, Exponent, and Fraction

The binary32 fields are arranged as follows:

```text
31            30 … 23              22 … 0
Sign s        8-bit exponent e     23-bit fraction f
```

For an ordinary normalized number, the value is:

```text
(-1)^s × (1 + f / 2^23) × 2^(e - 127)
```

BitView extracts these fields using shifts and masks. Zero, subnormal numbers, infinity, and NaN follow different exponent interpretation rules, so the formula cannot be applied universally. Compare the fields and special values with [Oracle's IEEE floating-point format documentation](https://docs.oracle.com/cd/E77782_01/html/E77791/z4000ac019878.html).

The original program checks conditions including `sizeof(float)`, `FLT_RADIX`, `FLT_MANT_DIG`, and `FLT_MAX_EXP`, skipping field decoding when they are unsuitable. These checks limit its scope; the platform must also use the expected IEEE bit layout. Not every C implementation stores `float` as binary32.

### Why Is -0.0 Still Zero, with an Extra Sign Bit?

In IEEE binary64, both `+0.0` and `-0.0` have zero exponent and fraction fields. Their sign bits differ. Negative zero has this bit pattern:

```text
0x8000000000000000
```

This is also the expected value in the original test script for `double -0.0`. Numerical comparisons consider positive and negative zero equal, but their object representations differ; the sign bit or `signbit` distinguishes them. Binary64 has a one-bit sign, an 11-bit exponent, and a 52-bit fraction. Its special zero values are described in the same [Oracle documentation](https://docs.oracle.com/cd/E77782_01/html/E77791/z4000ac019878.html).

## Input Errors Are Part of the Inspector

BitView parses integers with `strtoimax` and `strtoumax`, passing a base of `0`. This accepts `0xbeef` as hexadecimal and ordinary numbers as decimal; a leading `0` can also select octal. Consequently, `010` must not casually be treated as decimal `10`.

The program needs to distinguish three failures: no number was parsed, invalid characters remain at the end, or the value is outside the permitted range. After parsing succeeds, it must also check whether the value fits the selected mode: `int8`, for example, accepts only `-128` through `127`. See [N1570, sections 7.8.2.3 and 7.22.1.4](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf) for base selection and conversion rules.

The original test script includes these valid and invalid cases:

| Input                                  | Behavior to Check                                          |
| -------------------------------------- | ---------------------------------------------------------- |
| `int32 -42`                            | Two's-complement pattern is `0xffffffd6`                   |
| `int32 -1`                             | All 32 bits are one                                        |
| `int8 -128`, `uint8 255`               | Boundary values are accepted                               |
| `uint16 0xbeef`                        | Hexadecimal input is accepted                              |
| `float 1.5`                            | Pattern is `0x3fc00000` on an applicable IEEE platform     |
| `double -0.0`                          | Negative zero's sign bit is preserved                      |
| `int8 128`, `uint32 -1`, `int32 hello` | Overflow, unsuitable signs, and invalid input are rejected |

These are assertion targets in the script. The existence of the script does not establish that they pass on every platform.

## Extend the View from Memory Bytes to File Bytes

File inspection does not require interpreting the file as an integer or a string first:

```bash
./bitview file ./bitview 128
```

In the original project, this command inspects the executable's first 128 bytes. The hex viewer prints offsets, bytes, and printable characters line by line. It must continue past `0x00`: file contents do not follow C string termination rules.

The original script constructs an eight-byte test file containing `ABC\0xyz\n`, expecting:

```text
41 42 43 00 78 79 7a 0a
```

Here, `00` is a byte in the file, not the end of the file. When inspecting text or executables, observe the bytes first, then interpret them according to the file format.

## Build and Check the Original Project

If you already have the original BitView project, its Makefile provides these targets. The complete project is not included here, and these commands have not been rerun:

```bash
make
make release
make test
make ubsan
./bitview-ubsan int32 -42
make asan
./bitview-asan int32 -42
```

The ordinary build uses C17, compiler warnings, and debug information; `release` uses `-O2`. The `ubsan` and `asan` targets produce programs with UndefinedBehaviorSanitizer and AddressSanitizer enabled, respectively.

The original notes mention ASan startup hangs with some Apple Clang/macOS combinations. That observation has not been verified here. If it occurs, retain the system and compiler versions, startup diagnostics, and a minimal reproduction before deciding whether the problem lies in the program or the runtime.

When reading the original project, start with command dispatch in `main`, then inspect integer input validation, `print_representation`, floating-point field decoding, and file reading. At every step, ask the same question: am I looking at a value, or bytes interpreted using a particular rule?
