# ============================================================================
# LeetCode #8 — String to Integer (atoi)
# Difficulty: Medium
# Link: https://leetcode.com/problems/string-to-integer-atoi/
# ============================================================================
#
# Implement the myAtoi(string s) function, which converts a string to a
# 32-bit signed integer. The algorithm strips leading whitespace, reads an
# optional sign, then converts digits until a non-digit is found or end of
# string. Clamp to 32-bit range.
#
# Result: Accepted — Runtime: 3ms (Beats 36.16%), Memory: 19.15 MB (Beats 98.80%)
# ============================================================================

class Solution:
    def myAtoi(self, s: str) -> int:
        s = s.strip()
        if not s:
            return 0
        sign = 1
        i = 0
        if s[0] == '-':
            sign = -1
            i = 1
        elif s[0] == '+':
            i = 1
        result = 0
        while i < len(s) and s[i].isdigit():
            result = result * 10 + int(s[i])
            i += 1
        result *= sign
        INT_MAX = 2**31 - 1
        INT_MIN = -2**31
        if result > INT_MAX:
            return INT_MAX
        if result < INT_MIN:
            return INT_MIN
        return result
