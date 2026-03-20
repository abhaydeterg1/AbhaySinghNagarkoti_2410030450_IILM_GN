# ============================================================================
# LeetCode #10 — Regular Expression Matching
# Difficulty: Hard
# Link: https://leetcode.com/problems/regular-expression-matching/
# ============================================================================
#
# Given an input string s and a pattern p, implement regular expression
# matching with support for '.' (matches any single character) and '*'
# (matches zero or more of the preceding element).
#
# Result: Accepted — Runtime: 7ms (Beats 61.16%), Memory: 19.18 MB (Beats 98.96%)
# ============================================================================

class Solution:
    def isMatch(self, s: str, p: str) -> bool:
        m, n = len(s), len(p)
        dp = [[False] * (n + 1) for _ in range(m + 1)]
        dp[0][0] = True
        for j in range(1, n + 1):
            if p[j - 1] == '*':
                dp[0][j] = dp[0][j - 2]
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if p[j - 1] == '*':
                    dp[i][j] = dp[i][j - 2]
                    if p[j - 2] == '.' or p[j - 2] == s[i - 1]:
                        dp[i][j] = dp[i][j] or dp[i - 1][j]
                elif p[j - 1] == '.' or p[j - 1] == s[i - 1]:
                    dp[i][j] = dp[i - 1][j - 1]
        return dp[m][n]
