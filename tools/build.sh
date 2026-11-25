#!/bin/sh
# Rebuild docs/bank.json: distractor review, then Chinese.
cd "$(dirname "$0")" && python3 apply_review.py && python3 add_zh.py && python3 add_why.py && python3 build_dual.py && python3 build_extra.py && python3 build_jitian.py && python3 build_textbook.py && python3 build_qtext.py
