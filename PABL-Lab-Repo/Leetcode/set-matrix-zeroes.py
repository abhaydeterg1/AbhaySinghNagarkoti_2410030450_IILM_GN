# ================================================================
# Problem : Set Matrix Zeroes
# LeetCode : #73  |  Difficulty: Medium
# Link     : https://leetcode.com/problems/set-matrix-zeroes/
# ================================================================
#
# PROBLEM STATEMENT:
#   Given an m x n integer matrix, if an element is 0, set its
#   entire row and column to 0's. You must do it in-place.
#
# Examples:
#   Input : matrix = [[1,1,1],[1,0,1],[1,1,1]]
#   Output: [[1,0,1],[0,0,0],[1,0,1]]
#
#   Input : matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]
#   Output: [[0,0,0,0],[0,4,5,0],[0,3,1,0]]
#
# Constraints:
#   - m == matrix.length
#   - n == matrix[0].length
#   - 1 <= m, n <= 200
#   - -2^31 <= matrix[i][j] <= 2^31 - 1
#
# Follow up:
#   - O(mn) space solution is straightforward but not optimal.
#   - Can you solve it with O(m + n) or even O(1) extra space?
# ================================================================

class Solution(object):
    def setZeroes(self, matrix):
        """
        :type matrix: List[List[int]]
        :rtype: None Do not return anything, modify matrix in-place instead.
        """
        if not matrix:
            return

        m, n = len(matrix), len(matrix[0])
        first_row_zero = any(matrix[0][j] == 0 for j in range(n))
        first_col_zero = any(matrix[i][0] == 0 for i in range(m))

        for i in range(1, m):
            for j in range(1, n):
                if matrix[i][j] == 0:
                    matrix[i][0] = 0
                    matrix[0][j] = 0

        for i in range(1, m):
            for j in range(1, n):
                if matrix[i][0] == 0 or matrix[0][j] == 0:
                    matrix[i][j] = 0

        if first_row_zero:
            for j in range(n):
                matrix[0][j] = 0

        if first_col_zero:
            for i in range(m):
                matrix[i][0] = 0
