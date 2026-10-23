---
author: Raven
lang: zh
pubDatetime: 2026-10-10T00:00:00.000+08:00
title: 用一个 C 小程序，看懂补码、字节序和浮点数
draft: false
featured: false
tags:
  - csapp
  - c
  - memory
  - floating-point
hideEditPost: true
timezone: Asia/Shanghai
description: 从 BitView 的整数、字节和 IEEE 754 字段输出出发，解释负数的补码、小端存储、0.1 的表示误差，以及安全观察 C 对象内存的方法。
---

<!-- 来源：CSAPP/项目代码/01-bitview/README.md；补充核对 main.c、Makefile、tests.sh。待核验：实际构建、测试与 Sanitizer 运行结果。本文未附完整 C 工程。 -->

`-42`、`0xffffffd6` 和 `d6 ff ff ff` 看起来很不一样，却可能描述同一个 C 对象。区别在于：我们正在读它的数值、位模式，还是按地址顺序排列的字节。

BitView 是一个用 C17 编写的命令行数据观察器。它把这几种表示放在一起，也可以拆解浮点数的字段、判断机器字节序和查看文件字节。学习它的重点是把“看到的字节”与“解释这些字节的规则”对应起来。

## 从一个负数开始

原 BitView 工程支持下面这些输入：

```text
./bitview int8|int16|int32|int64 VALUE
./bitview uint8|uint16|uint32|uint64 VALUE
./bitview float|double VALUE
./bitview endian
./bitview file PATH [MAX_BYTES]
```

先看 `int32 -42`。以下片段整理自原 README，是小端机器上的示例，本文没有重新运行它：

```text
type:      int32_t
signed:    -42
hex:       0xffffffd6
binary:    11111111 11111111 11111111 11010110
bytes:     d6 ff ff ff
endian:    little-endian
unsigned:  4294967254
```

`signed` 是有符号解释下的数值；`hex` 和 `binary` 展示位模式；`bytes` 则按内存地址从低到高展示字节。最后一行把这 32 个比特按无符号数解释，因此得到了一个很大的正数。

### 为什么负数会变成这么大的无符号数

对 32 位补码而言，`-42` 对应的无符号位模式可以这样算：

```text
2^32 - 42 = 4294967254 = 0xffffffd6
```

也可以从正数 `42` 开始，在固定的 32 位宽度内取反再加一：

```text
42          00000000 00000000 00000000 00101010
取反        11111111 11111111 11111111 11010101
加一        11111111 11111111 11111111 11010110
```

位模式没有自带“这是负数”的标签，类型决定如何解释它。对同一个位模式，`int32_t` 给出 `-42`，`uint32_t` 给出 `4294967254`。这个结论针对定宽补码类型；支持 `int32_t` 的实现需要满足它的宽度和表示要求。相关定义见 [C 标准委员会草案 N1570，第 7.20.1.1 节](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)。

把输入从 `-42` 换成 `-1`，还能观察到一个很直观的边界：32 位补码的 `-1` 是 32 个连续的 `1`。

## 为什么字节顺序反了，数值却没变

一个十六进制位表示四个比特，两个十六进制位表示一个八位字节。`0xffffffd6` 可以分成四个字节：

```text
从高位到低位：ff ff ff d6
```

在小端机器上，最低有效字节存放在最低地址，因此按内存顺序读到的是：

```text
地址从低到高：d6 ff ff ff
```

大端机器则把最高有效字节放在最低地址。两种顺序都能表达相同数值，前提是读取时使用相应的规则。将小端字节直接按大端规则解释，才会得到错误结果。

BitView 用 `0x0102` 判断字节序：先把对象复制为字节数组，再查看前两个字节。读到 `02 01` 表示小端，读到 `01 02` 表示大端。

## 用 memcpy 看对象，避免不兼容指针访问

观察内存时，一个容易想到的写法是把 `float *` 强转成 `uint32_t *` 再解引用。即使两个类型的大小相同，这种访问也可能违反 C 的类型访问规则。

BitView 的做法是使用 `memcpy`。下面是可以独立保存为 C 文件的最小示例，只保留“读取对象字节”这一件事：

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

这里没有通过另一种不兼容的指针类型访问 `value`，而是把它的对象表示复制到目标对象中。字节数组保留内存顺序，`raw` 让我们按对应无符号整数的规则解释同一位模式。C 对象表示和字符类型访问的规则见 [N1570，第 6.2.6.1、6.5 和 7.24.2.1 节](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)。

进行位运算时，BitView 也优先使用无符号整数。这让位模式的处理更明确；但无符号类型并不会让任意移位都合法，移位量仍必须小于左操作数提升后的位宽。

## 0.1 为什么会显示成 0.100000001

继续看原工程的使用示例：

```bash
./bitview uint16 0xbeef
./bitview float 0.1
./bitview double -0.0
./bitview endian
```

`0.1` 在二进制中是无限循环小数：

```text
0.1₁₀ = 0.000110011001100110011…₂
```

一个约分后的有理数，只有当分母是 2 的幂时，才有有限的二进制小数表示。例如 `0.5 = 1/2`、`0.75 = 3/4` 可以有限表示，`0.1 = 1/10` 则不行。即使能有限表示，还需要目标浮点格式容得下它的精度和指数范围。

在常见的 IEEE 754 binary32 格式下，采用舍入到最近值时，`0.1` 会被保存为附近的可表示数。BitView 用 `%.9g` 打印 `float`，原 README 因而以 `0.100000001` 展示这个差异。少打印几位可能再次看到 `0.1`，但显示变短没有增加存储精度。

### 拆开符号位、阶码和 fraction

binary32 的字段分布如下：

```text
31            30 … 23              22 … 0
符号位 s      8 位阶码 e           23 位 fraction f
```

对普通规格化数，数值为：

```text
(-1)^s × (1 + f / 2^23) × 2^(e - 127)
```

BitView 通过移位和掩码提取这些字段。对于零、次正规数、无穷和 NaN，阶码解释规则不同，不能一律套用上面的公式。字段划分与特殊值规则可以对照 [Oracle 的 IEEE 浮点格式文档](https://docs.oracle.com/cd/E77782_01/html/E77791/z4000ac019878.html)。

原程序会先检查 `sizeof(float)`、`FLT_RADIX`、`FLT_MANT_DIG` 和 `FLT_MAX_EXP` 等条件，不满足时跳过字段解码。这些检查限制了适用范围；还应确认目标平台确实采用相应的 IEEE 位布局，不能认为所有 C 实现都把 `float` 存成 binary32。

### -0.0 为什么也是零，却多了一个符号位

在 IEEE binary64 中，`+0.0` 和 `-0.0` 的阶码与 fraction 都为零，区别是符号位。负零的位模式是：

```text
0x8000000000000000
```

这也是原测试脚本对 `double -0.0` 设置的预期值。数值比较会认为正零与负零相等，但它们的对象表示不同；可以通过符号位或 `signbit` 区分。binary64 的字段为 1 位符号、11 位阶码和 52 位 fraction，特殊零的定义同样见 [Oracle 浮点格式文档](https://docs.oracle.com/cd/E77782_01/html/E77791/z4000ac019878.html)。

## 输入错误也是观察器的一部分

BitView 使用 `strtoimax` 和 `strtoumax` 解析整数，基数传入 `0`：`0xbeef` 可以按十六进制读取，普通数字按十进制读取，前导 `0` 还可能触发八进制解释。因此，`010` 不应被随意当作十进制的 `10`。

程序需要区分三种失败：根本没有读到数值、字符串尾部仍有非法字符、数值超出允许范围。解析成功以后，还要检查它能否装进当前模式，例如 `int8` 只接受 `-128` 到 `127`。基数和转换规则见 [N1570，第 7.8.2.3 和 7.22.1.4 节](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf)。

原测试脚本包括这些正常和异常用例：

| 输入                                   | 要检查的行为                          |
| -------------------------------------- | ------------------------------------- |
| `int32 -42`                            | 补码为 `0xffffffd6`                   |
| `int32 -1`                             | 32 个比特全为 1                       |
| `int8 -128`、`uint8 255`               | 接受边界值                            |
| `uint16 0xbeef`                        | 接受十六进制输入                      |
| `float 1.5`                            | 在适用的 IEEE 平台上得到 `0x3fc00000` |
| `double -0.0`                          | 保留负零符号位                        |
| `int8 128`、`uint32 -1`、`int32 hello` | 拒绝溢出、不合适的符号和非法输入      |

这些是脚本中的断言目标，不能仅凭脚本存在就认为所有平台上都已通过。

## 从内存字节扩展到文件字节

文件查看模式不需要先把文件解释成整数或字符串：

```bash
./bitview file ./bitview 128
```

原工程的这条命令用于查看可执行文件前 128 个字节。十六进制查看器逐行输出偏移、字节和可打印字符；遇到 `0x00` 也应继续读取，因为文件内容没有 C 字符串的终止规则。

原脚本使用 `ABC\0xyz\n` 构造了八字节测试文件，预期字节序列是：

```text
41 42 43 00 78 79 7a 0a
```

这里的 `00` 是文件中的一个字节，不代表文件结束。查看文本与可执行文件时，应该先观察字节，再依据文件格式解释它们。

## 原工程的构建与检查方式

如果已有原 BitView 工程，它的 Makefile 提供以下目标；本文没有附完整工程，也没有重新执行这些命令：

```bash
make
make release
make test
make ubsan
./bitview-ubsan int32 -42
make asan
./bitview-asan int32 -42
```

普通构建使用 C17、编译器警告和调试信息；`release` 使用 `-O2`。`ubsan` 与 `asan` 分别生成启用 UndefinedBehaviorSanitizer、AddressSanitizer 的程序。

原笔记提到过某些 Apple Clang/macOS 组合在 ASan 启动阶段卡住的情况，本文没有验证这个现象。若遇到类似问题，应保留系统与编译器版本、启动诊断和最小复现，再判断是程序错误还是运行时问题。

阅读原工程时，可以从 `main` 的命令分发开始，再看整数输入检查、`print_representation`、浮点字段解码，最后看文件读取。每一步都问同一个问题：现在看到的是数值，还是用某种规则解释后的字节？
