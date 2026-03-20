# ============================================================================
# LeetCode #2 — Add Two Numbers
# Difficulty: Medium
# Link: https://leetcode.com/problems/add-two-numbers/
# ============================================================================
#
# You are given two non-empty linked lists representing two non-negative
# integers. The digits are stored in reverse order, and each of their nodes
# contains a single digit. Add the two numbers and return the sum as a
# linked list.
#
# Result: Accepted — Runtime: 0ms (Beats 100%), Memory: 19.48 MB (Beats 35.52%)
# ============================================================================

class Solution:
    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode(0)
        curr = dummy
        carry = 0
        while l1 or l2 or carry:
            val1 = l1.val if l1 else 0
            val2 = l2.val if l2 else 0
            total = val1 + val2 + carry
            carry = total // 10
            curr.next = ListNode(total % 10)
            curr = curr.next
            l1 = l1.next if l1 else None
            l2 = l2.next if l2 else None
        return dummy.next
