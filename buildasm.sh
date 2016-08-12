#!/usr/bin/bash

git clone https://github.com/owenson/tiny-linux-bootloader

cd tiny-linux-bootloader
nasm -o ../bsect -D initRdSizeDef=$((16#aabbccdd)) bsect.asm
