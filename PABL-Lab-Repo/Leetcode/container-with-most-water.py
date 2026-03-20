# ============================================================================
# LeetCode #11 — Container With Most Water
# Difficulty: Medium
# Link: https://leetcode.com/problems/container-with-most-water/
# ============================================================================
#
# You are given an integer array height of length n. Find two lines that
# together with the x-axis form a container, such that the container
# contains the most water. Return the maximum amount of water a container
# can store.
#
# Result: Accepted — Runtime: 62ms (Beats 30.04%), Memory: 29.67 MB (Beats 57.66%)
# ============================================================================

class Solution:
    def maxArea(self, height: List[int]) -> int:
        left, right = 0, len(height) - 1
        max_area = 0
        while left < right:
            area = min(height[left], height[right]) * (right - left)
            max_area = max(max_area, area)
            if height[left] < height[right]:
                left += 1
            else:
                right -= 1
        return max_area
