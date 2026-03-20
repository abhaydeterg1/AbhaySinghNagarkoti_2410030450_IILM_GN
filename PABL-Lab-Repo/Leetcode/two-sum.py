# ============================================================================
# LeetCode #1 — Two Sum
# Difficulty: Easy
# Link: https://leetcode.com/problems/two-sum/
# ============================================================================
#
# Given an array of integers nums and an integer target, return indices of
# the two numbers such that they add up to target.
#
# Result: Accepted — Runtime: 1ms (Beats 61.57%), Memory: 12.57 MB (Beats 63.39%)
# ============================================================================

class Solution(object):
    def twoSum(self, nums, target):
        num_to_index = {}
        for index, num in enumerate(nums):
            complement = target - num
            if complement in num_to_index:
                return [num_to_index[complement], index]
            num_to_index[num] = index
        return []
