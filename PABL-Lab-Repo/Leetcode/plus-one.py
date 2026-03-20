# ============================================================================
# LeetCode #66 — Plus One
# Difficulty: Easy
# Link: https://leetcode.com/problems/plus-one/
# ============================================================================
#
# You are given a large integer represented as an integer array digits,
# where each digits[i] is the ith digit of the integer. Increment the
# large integer by one and return the resulting array of digits.
#
# Result: Accepted — Runtime: 0ms (Beats 100%), Memory: 11.80 MB
# ============================================================================

class Solution(object):
    def plusOne(self, digits):
        n = len(digits)
        for i in range(n - 1, -1, -1):
            if digits[i] < 9:
                digits[i] += 1
                return digits
            digits[i] = 0

        return [1] + digits
