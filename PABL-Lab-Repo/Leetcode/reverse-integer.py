# ============================================================================
# LeetCode #7 — Reverse Integer
# Difficulty: Medium
# Link: https://leetcode.com/problems/reverse-integer/
# ============================================================================
#
# Given a signed 32-bit integer x, return x with its digits reversed. If
# reversing x causes the value to go outside the signed 32-bit integer
# range [-2^31, 2^31 - 1], then return 0.
#
# Result: Accepted — Runtime: 43ms (Beats 74.99%), Memory: 19.41 MB (Beats 6.74%)
# ============================================================================

class Solution:
    def reverse(self, x: int) -> int:
        INT_MAX = 2**31 - 1
        INT_MIN = -2**31
        sign = 1 if x >= 0 else -1
        x = abs(x)
        rev = 0
        while x:
            rev = rev * 10 + x % 10
            x //= 10
        rev *= sign
        if rev < INT_MIN or rev > INT_MAX:
            return 0
        return rev
