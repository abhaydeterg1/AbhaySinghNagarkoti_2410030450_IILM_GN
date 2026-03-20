# ============================================================================
# LeetCode #4 — Median of Two Sorted Arrays
# Difficulty: Hard
# Link: https://leetcode.com/problems/median-of-two-sorted-arrays/
# ============================================================================
#
# Given two sorted arrays nums1 and nums2 of size m and n respectively,
# return the median of the two sorted arrays. The overall run time
# complexity should be O(log (m+n)).
#
# Result: Accepted — Runtime: 2ms (Beats 51.80%), Memory: 19.46 MB (Beats 90.73%)
# ============================================================================

class Solution:
    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
        if len(nums1) > len(nums2):
            nums1, nums2 = nums2, nums1
        m, n = len(nums1), len(nums2)
        left, right = 0, m
        while left <= right:
            i = (left + right) // 2
            j = (m + n + 1) // 2 - i
            left1 = nums1[i - 1] if i > 0 else float('-inf')
            right1 = nums1[i] if i < m else float('inf')
            left2 = nums2[j - 1] if j > 0 else float('-inf')
            right2 = nums2[j] if j < n else float('inf')
            if left1 <= right2 and left2 <= right1:
                if (m + n) % 2 == 0:
                    return (max(left1, left2) + min(right1, right2)) / 2
                return max(left1, left2)
            elif left1 > right2:
                right = i - 1
            else:
                left = i + 1
