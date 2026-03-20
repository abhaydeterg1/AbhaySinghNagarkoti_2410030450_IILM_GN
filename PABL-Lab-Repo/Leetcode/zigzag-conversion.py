# ============================================================================
# LeetCode #6 — Zigzag Conversion
# Difficulty: Medium
# Link: https://leetcode.com/problems/zigzag-conversion/
# ============================================================================
#
# The string "PAYPALISHIRING" is written in a zigzag pattern on a given
# number of rows. Write the code that will take a string and make this
# conversion given a number of rows.
#
# Result: Accepted — Runtime: 11ms (Beats 57.74%), Memory: 19.36 MB (Beats 73.60%)
# ============================================================================

class Solution:
    def convert(self, s: str, numRows: int) -> str:
        if numRows == 1 or numRows >= len(s):
            return s
        rows = [''] * numRows
        idx, step = 0, 1
        for ch in s:
            rows[idx] += ch
            if idx == 0:
                step = 1
            elif idx == numRows - 1:
                step = -1
            idx += step
        return ''.join(rows)
