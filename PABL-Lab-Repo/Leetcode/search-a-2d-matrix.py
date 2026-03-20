# ================================================================
# Problem : Search a 2D Matrix
# LeetCode : #74  |  Difficulty: Medium
# Link     : https://leetcode.com/problems/search-a-2d-matrix/
# ================================================================
#
# PROBLEM STATEMENT:
#   You are given an m x n integer matrix with two properties:
#     - Each row is sorted in non-decreasing order.
#     - The first integer of each row is greater than the last
#       integer of the previous row.
#   Given an integer target, return true if target is in the
#   matrix or false otherwise.
#   You must write a solution in O(log(m * n)) time complexity.
#
# Examples:
#   Input : matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3
#   Output: true
#
#   Input : matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 13
#   Output: false
#
# Constraints:
#   - m == matrix.length
#   - n == matrix[i].length
#   - 1 <= m, n <= 100
#   - -10^4 <= matrix[i][j], target <= 10^4
# ================================================================

class Solution(object):
    def searchMatrix(self, matrix, target):
        """
        :type matrix: List[List[int]]
        :type target: int
        :rtype: bool
        """
        if not matrix or not matrix[0]:
            return False

        rows = len(matrix)
        cols = len(matrix[0])

        left, right = 0, rows * cols - 1

        while left <= right:
            mid = (left + right) // 2
            mid_value = matrix[mid // cols][mid % cols]

            if mid_value == target:
                return True
            elif mid_value < target:
                left = mid + 1
            else:
                right = mid - 1

        return False
