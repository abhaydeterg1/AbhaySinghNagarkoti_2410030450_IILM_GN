# ============================================================================
# LeetCode #45 — Jump Game II
# Difficulty: Medium
# Link: https://leetcode.com/problems/jump-game-ii/
# ============================================================================
#
# You are given a 0-indexed array of integers nums of length n. You are
# initially positioned at nums[0]. Each element represents your maximum
# jump length at that position. Return the minimum number of jumps to
# reach nums[n - 1].
#
# Result: Accepted — Runtime: 7ms, Memory: 12.44 MB
# ============================================================================

class Solution(object):
    def jump(self, nums):
        if not nums:
            return 0

        jumps = 0
        current_end = 0
        farthest = 0

        for i in range(len(nums) - 1):
            farthest = max(farthest, i + nums[i])

            if i == current_end:
                jumps += 1
                current_end = farthest

            if current_end >= len(nums) - 1:
                break

        return jumps
