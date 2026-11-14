#!/bin/sh
# Print the next N sentences still lacking Chinese into zh/<name>.en
cd "$(dirname "$0")" && python3 apply_review.py >/dev/null && python3 add_zh.py --todo "$1" | tail -n +2 > "zh/$2.en" && python3 add_zh.py >/dev/null && cat "zh/$2.en"
