# ============================================================================
# LeetCode #5 — Longest Palindromic Substring
# Difficulty: Medium
# Link: https://leetcode.com/problems/longest-palindromic-substring/
# ============================================================================
#
# Given a string s, return the longest palindromic substring in s.
#
# Result: Accepted — Runtime: 338ms (Beats 38.72%), Memory: 19.32 MB (Beats 63.14%)
# ============================================================================

class Solution:
    def longestPalindrome(self, s: str) -> str:
        res = ""
        for i in range(len(s)):
            # Odd length palindromes
            l, r = i, i
            while l >= 0 and r < len(s) and s[l] == s[r]:
                if r - l + 1 > len(res):
                    res = s[l:r+1]
                l -= 1
                r += 1
            # Even length palindromes
            l, r = i, i + 1
            while l >= 0 and r < len(s) and s[l] == s[r]:
                if r - l + 1 > len(res):
                    res = s[l:r+1]
                l -= 1
                r += 1
        return res
