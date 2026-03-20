# ============================================================================
# LeetCode #3 — Longest Substring Without Repeating Characters
# Difficulty: Medium
# Link: https://leetcode.com/problems/longest-substring-without-repeating-characters/
# ============================================================================
#
# Given a string s, find the length of the longest substring without
# duplicate characters.
#
# Result: Accepted — Runtime: 15ms (Beats 42.93%), Memory: 19.32 MB (Beats 59.37%)
# ============================================================================

class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        char_set = set()
        left = 0
        max_len = 0
        for right in range(len(s)):
            while s[right] in char_set:
                char_set.remove(s[left])
                left += 1
            char_set.add(s[right])
            max_len = max(max_len, right - left + 1)
        return max_len
