# ============================================================================
# LeetCode #9 — Palindrome Number
# Difficulty: Easy
# Link: https://leetcode.com/problems/palindrome-number/
# ============================================================================
#
# Given an integer x, return true if x is a palindrome, and false otherwise.
#
# Result: Accepted — Runtime: 0ms (Beats 100%), Memory: 19.22 MB (Beats 78.59%)
# ============================================================================

class Solution:
    def isPalindrome(self, x: int) -> bool:
        if x < 0:
            return False
        s = str(x)
        return s == s[::-1]
