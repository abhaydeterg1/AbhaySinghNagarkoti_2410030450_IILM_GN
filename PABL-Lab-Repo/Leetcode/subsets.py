# ============================================================================
# LeetCode #78 — Subsets
# Difficulty: Medium
# Link: https://leetcode.com/problems/subsets/
# ============================================================================
#
# Given an integer array nums of unique elements, return all possible
# subsets (the power set). The solution set must not contain duplicate
# subsets. Return the solution in any order.
#
# Result: Accepted — Runtime: 4ms, Memory: 12.19 MB
# ============================================================================

class Solution(object):
    def subsets(self, nums):
        result = []

        def backtrack(start, path):
            result.append(path[:])

            for i in range(start, len(nums)):
                path.append(nums[i])
                backtrack(i + 1, path)
                path.pop()

        backtrack(0, [])
        return result
