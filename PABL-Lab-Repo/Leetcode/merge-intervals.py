# ============================================================================
# LeetCode #56 — Merge Intervals
# Difficulty: Medium
# Link: https://leetcode.com/problems/merge-intervals/
# ============================================================================
#
# Given an array of intervals where intervals[i] = [starti, endi], merge
# all overlapping intervals, and return an array of the non-overlapping
# intervals that cover all the intervals in the input.
#
# Result: Accepted — Runtime: 10ms, Memory: 15.17 MB
# ============================================================================

class Solution(object):
    def merge(self, intervals):
        if not intervals:
            return []

        # Step 1: Sort intervals by starting time
        intervals.sort(key=lambda x: x[0])

        merged = []

        # Step 2: Traverse intervals
        for interval in intervals:
            # If merged list is empty OR no overlap
            if not merged or merged[-1][1] < interval[0]:
                merged.append(interval)
            else:
                # Overlapping intervals — merge them
                merged[-1][1] = max(merged[-1][1], interval[1])

        return merged
