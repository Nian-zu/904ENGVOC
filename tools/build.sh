#!/bin/sh
# Rebuild docs/bank.json: distractor review, then Chinese.
cd "$(dirname "$0")" && python3 apply_review.py && python3 add_zh.py && python3 build_extra.py
