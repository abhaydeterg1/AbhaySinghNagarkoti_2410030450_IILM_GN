# ============================================================================
# LeetCode #287 — Find the Duplicate Number
# Difficulty: Medium
# Link: https://leetcode.com/problems/find-the-duplicate-number/
# ============================================================================
#
# Given an array of integers nums containing n + 1 integers where each
# integer is in the range [1, n] inclusive, there is only one repeated
# number in nums. Return this repeated number.
#
# Result: Accepted — Runtime: 68ms, Memory: 20.19 MB
# ============================================================================

class Solution(object):
    def findDuplicate(self, nums):
        for i in range(len(nums)):
            if nums[abs(nums[i]) - 1] < 0:
                return abs(nums[i])
            else:
                nums[abs(nums[i]) - 1] *= -1
