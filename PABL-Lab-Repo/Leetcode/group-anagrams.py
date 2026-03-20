# ============================================================================
# LeetCode #49 — Group Anagrams
# Difficulty: Medium
# Link: https://leetcode.com/problems/group-anagrams/
# ============================================================================
#
# Given an array of strings strs, group the anagrams together. You can
# return the answer in any order.
#
# Result: Accepted — Runtime: 23ms, Memory: 15.61 MB
# ============================================================================

class Solution(object):
    def groupAnagrams(self, strs):
        anagrams = {}

        for s in strs:
            sorted_s = ''.join(sorted(s))
            if sorted_s not in anagrams:
                anagrams[sorted_s] = []
            anagrams[sorted_s].append(s)

        return list(anagrams.values())
