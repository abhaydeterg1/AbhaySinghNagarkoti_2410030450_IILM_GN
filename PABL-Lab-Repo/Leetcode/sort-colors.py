# ================================================================
# Problem : Sort Colors
# LeetCode : #75  |  Difficulty: Medium
# Link     : https://leetcode.com/problems/sort-colors/
# ================================================================
#
# PROBLEM STATEMENT:
#   Given an array nums with n objects colored red, white, or blue,
#   sort them in-place so that objects of the same color are adjacent,
#   with the colors in the order red, white, and blue.
#   We use 0, 1, 2 to represent red, white, and blue respectively.
#   You must solve this without using the library's sort function.
#
# Examples:
#   Input : nums = [2,0,2,1,1,0]
#   Output: [0,0,1,1,2,2]
#
#   Input : nums = [2,0,1]
#   Output: [0,1,2]
#
# Constraints:
#   - n == nums.length
#   - 1 <= n <= 300
#   - nums[i] is either 0, 1, or 2.
#
# Follow up:
#   Could you come up with a one-pass algorithm using only
#   constant extra space? (Dutch National Flag algorithm)
# ================================================================

class Solution(object):
    def sortColors(self, nums):
        """
        :type nums: List[int]
        :rtype: None Do not return anything, modify nums in-place instead.
        """
        low, mid, high = 0, 0, len(nums) - 1

        while mid <= high:
            if nums[mid] == 0:
                nums[low], nums[mid] = nums[mid], nums[low]
                low += 1
                mid += 1
            elif nums[mid] == 1:
                mid += 1
            else:
                nums[mid], nums[high] = nums[high], nums[mid]
                high -= 1
