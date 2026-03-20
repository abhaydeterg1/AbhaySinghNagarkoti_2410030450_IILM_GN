# ============================================================================
# LeetCode #35 — Search Insert Position
# Difficulty: Easy
# Link: https://leetcode.com/problems/search-insert-position/
# ============================================================================
#
# Given a sorted array of distinct integers and a target value, return the
# index if the target is found. If not, return the index where it would be
# if it were inserted in order.
#
# Result: Accepted — Runtime: 0ms (Beats 100%), Memory: 12.35 MB
# ============================================================================

class Solution(object):
    def searchInsert(self, nums, target):
        left, right = 0, len(nums) - 1

        while left <= right:
            mid = left + (right - left) // 2

            if nums[mid] == target:
                return mid
            elif nums[mid] < target:
                left = mid + 1
            else:
                right = mid - 1

        return left
