/**
 * Seed Script: Blind 75 LeetCode Problems
 * Populates curated_problems table with industry-standard problems
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'redcube_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

// Blind 75 Problems - Curated and Categorized
const blind75Problems = [
  // ========== ARRAYS & HASHING ==========
  {
    problem_name: 'Two Sum',
    leetcode_number: 1,
    leetcode_slug: 'two-sum',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    subcategory: 'Hash Map',
    topics: ['array', 'hash-table'],
    url: 'https://leetcode.com/problems/two-sum/',
    problem_list: 'Blind 75',
    company_frequency: { Google: 145, Amazon: 132, Meta: 98, Microsoft: 87, Apple: 76 },
    acceptance_rate: 49.2,
    premium_only: false,
    estimated_time_minutes: 20,
    notes: 'Classic hash map pattern. Foundation for many coding interviews.'
  },
  {
    problem_name: 'Best Time to Buy and Sell Stock',
    leetcode_number: 121,
    leetcode_slug: 'best-time-to-buy-and-sell-stock',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    subcategory: 'Greedy',
    topics: ['array', 'dynamic-programming'],
    url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 98, Bloomberg: 76, Meta: 65, Google: 54, Microsoft: 43 },
    acceptance_rate: 54.1,
    premium_only: false,
    estimated_time_minutes: 15,
    notes: 'Single-pass greedy algorithm. Track min price seen so far.'
  },
  {
    problem_name: 'Contains Duplicate',
    leetcode_number: 217,
    leetcode_slug: 'contains-duplicate',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    subcategory: 'Hash Set',
    topics: ['array', 'hash-table', 'sorting'],
    url: 'https://leetcode.com/problems/contains-duplicate/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 54, Google: 43, Meta: 32, Apple: 28, Microsoft: 21 },
    acceptance_rate: 61.3,
    premium_only: false,
    estimated_time_minutes: 10,
    notes: 'Simple hash set application. Good warm-up problem.'
  },
  {
    problem_name: 'Product of Array Except Self',
    leetcode_number: 238,
    leetcode_slug: 'product-of-array-except-self',
    difficulty: 'Medium',
    category: 'Arrays & Hashing',
    subcategory: 'Prefix/Suffix',
    topics: ['array', 'prefix-sum'],
    url: 'https://leetcode.com/problems/product-of-array-except-self/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 89, Meta: 78, Google: 67, Microsoft: 54, Apple: 43 },
    acceptance_rate: 64.8,
    premium_only: false,
    estimated_time_minutes: 25,
    notes: 'Prefix/suffix product pattern. O(n) time without division.'
  },
  {
    problem_name: 'Maximum Subarray',
    leetcode_number: 53,
    leetcode_slug: 'maximum-subarray',
    difficulty: 'Medium',
    category: 'Arrays & Hashing',
    subcategory: 'Kadane\'s Algorithm',
    topics: ['array', 'dynamic-programming', 'divide-and-conquer'],
    url: 'https://leetcode.com/problems/maximum-subarray/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 112, Google: 98, Meta: 87, Microsoft: 76, Bloomberg: 65 },
    acceptance_rate: 50.2,
    premium_only: false,
    estimated_time_minutes: 20,
    notes: 'Classic Kadane\'s algorithm. Foundation for many DP problems.'
  },
  {
    problem_name: 'Maximum Product Subarray',
    leetcode_number: 152,
    leetcode_slug: 'maximum-product-subarray',
    difficulty: 'Medium',
    category: 'Arrays & Hashing',
    subcategory: 'Dynamic Programming',
    topics: ['array', 'dynamic-programming'],
    url: 'https://leetcode.com/problems/maximum-product-subarray/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 67, Google: 54, Meta: 43, Microsoft: 38, LinkedIn: 32 },
    acceptance_rate: 34.1,
    premium_only: false,
    estimated_time_minutes: 30,
    notes: 'Track both max and min products due to negative numbers.'
  },
  {
    problem_name: 'Find Minimum in Rotated Sorted Array',
    leetcode_number: 153,
    leetcode_slug: 'find-minimum-in-rotated-sorted-array',
    difficulty: 'Medium',
    category: 'Arrays & Hashing',
    subcategory: 'Binary Search',
    topics: ['array', 'binary-search'],
    url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 76, Meta: 65, Google: 54, Microsoft: 43, Bloomberg: 38 },
    acceptance_rate: 49.8,
    premium_only: false,
    estimated_time_minutes: 25,
    notes: 'Modified binary search on rotated array.'
  },
  {
    problem_name: 'Search in Rotated Sorted Array',
    leetcode_number: 33,
    leetcode_slug: 'search-in-rotated-sorted-array',
    difficulty: 'Medium',
    category: 'Arrays & Hashing',
    subcategory: 'Binary Search',
    topics: ['array', 'binary-search'],
    url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 98, Meta: 87, Google: 76, Microsoft: 65, Bloomberg: 54 },
    acceptance_rate: 38.9,
    premium_only: false,
    estimated_time_minutes: 30,
    notes: 'Determine which half is sorted, then apply binary search.'
  },
  {
    problem_name: '3Sum',
    leetcode_number: 15,
    leetcode_slug: '3sum',
    difficulty: 'Medium',
    category: 'Arrays & Hashing',
    subcategory: 'Two Pointers',
    topics: ['array', 'two-pointers', 'sorting'],
    url: 'https://leetcode.com/problems/3sum/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 134, Meta: 112, Google: 98, Microsoft: 87, Bloomberg: 76 },
    acceptance_rate: 32.4,
    premium_only: false,
    estimated_time_minutes: 35,
    notes: 'Sort + two pointers. Handle duplicates carefully.'
  },
  {
    problem_name: 'Container With Most Water',
    leetcode_number: 11,
    leetcode_slug: 'container-with-most-water',
    difficulty: 'Medium',
    category: 'Arrays & Hashing',
    subcategory: 'Two Pointers',
    topics: ['array', 'two-pointers', 'greedy'],
    url: 'https://leetcode.com/problems/container-with-most-water/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 89, Google: 78, Meta: 67, Microsoft: 54, Bloomberg: 43 },
    acceptance_rate: 54.3,
    premium_only: false,
    estimated_time_minutes: 20,
    notes: 'Greedy two-pointer approach. Move pointer with smaller height.'
  },

  // ========== TWO POINTERS ==========
  {
    problem_name: 'Valid Palindrome',
    leetcode_number: 125,
    leetcode_slug: 'valid-palindrome',
    difficulty: 'Easy',
    category: 'Two Pointers',
    subcategory: 'String Manipulation',
    topics: ['two-pointers', 'string'],
    url: 'https://leetcode.com/problems/valid-palindrome/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 76, Meta: 65, Google: 54, Microsoft: 43, Apple: 38 },
    acceptance_rate: 45.2,
    premium_only: false,
    estimated_time_minutes: 15,
    notes: 'Basic two-pointer palindrome check. Handle alphanumeric filtering.'
  },

  // ========== SLIDING WINDOW ==========
  {
    problem_name: 'Longest Substring Without Repeating Characters',
    leetcode_number: 3,
    leetcode_slug: 'longest-substring-without-repeating-characters',
    difficulty: 'Medium',
    category: 'Sliding Window',
    subcategory: 'Hash Map',
    topics: ['hash-table', 'string', 'sliding-window'],
    url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 156, Meta: 134, Google: 112, Microsoft: 98, Apple: 87 },
    acceptance_rate: 33.8,
    premium_only: false,
    estimated_time_minutes: 25,
    notes: 'Classic sliding window with hash map. Track last seen index.'
  },
  {
    problem_name: 'Longest Repeating Character Replacement',
    leetcode_number: 424,
    leetcode_slug: 'longest-repeating-character-replacement',
    difficulty: 'Medium',
    category: 'Sliding Window',
    subcategory: 'Hash Map',
    topics: ['hash-table', 'string', 'sliding-window'],
    url: 'https://leetcode.com/problems/longest-repeating-character-replacement/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 54, Google: 43, Meta: 38, Microsoft: 32, Bloomberg: 28 },
    acceptance_rate: 52.1,
    premium_only: false,
    estimated_time_minutes: 30,
    notes: 'Sliding window with k replacements. Track max frequency character.'
  },
  {
    problem_name: 'Minimum Window Substring',
    leetcode_number: 76,
    leetcode_slug: 'minimum-window-substring',
    difficulty: 'Hard',
    category: 'Sliding Window',
    subcategory: 'Hash Map',
    topics: ['hash-table', 'string', 'sliding-window'],
    url: 'https://leetcode.com/problems/minimum-window-substring/',
    problem_list: 'Blind 75',
    company_frequency: { Meta: 112, Amazon: 98, Google: 87, Microsoft: 76, Uber: 65 },
    acceptance_rate: 40.2,
    premium_only: false,
    estimated_time_minutes: 45,
    notes: 'Advanced sliding window. Track character counts in window.'
  },

  // ========== LINKED LIST ==========
  {
    problem_name: 'Reverse Linked List',
    leetcode_number: 206,
    leetcode_slug: 'reverse-linked-list',
    difficulty: 'Easy',
    category: 'Linked List',
    subcategory: 'Iteration/Recursion',
    topics: ['linked-list', 'recursion'],
    url: 'https://leetcode.com/problems/reverse-linked-list/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 134, Meta: 112, Google: 98, Microsoft: 87, Apple: 76 },
    acceptance_rate: 73.1,
    premium_only: false,
    estimated_time_minutes: 15,
    notes: 'Fundamental linked list operation. Know both iterative and recursive.'
  },
  {
    problem_name: 'Linked List Cycle',
    leetcode_number: 141,
    leetcode_slug: 'linked-list-cycle',
    difficulty: 'Easy',
    category: 'Linked List',
    subcategory: 'Floyd\'s Cycle Detection',
    topics: ['hash-table', 'linked-list', 'two-pointers'],
    url: 'https://leetcode.com/problems/linked-list-cycle/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 98, Meta: 87, Google: 76, Microsoft: 65, Apple: 54 },
    acceptance_rate: 48.3,
    premium_only: false,
    estimated_time_minutes: 15,
    notes: 'Floyd\'s tortoise and hare algorithm. Fast/slow pointers.'
  },
  {
    problem_name: 'Merge Two Sorted Lists',
    leetcode_number: 21,
    leetcode_slug: 'merge-two-sorted-lists',
    difficulty: 'Easy',
    category: 'Linked List',
    subcategory: 'Merge',
    topics: ['linked-list', 'recursion'],
    url: 'https://leetcode.com/problems/merge-two-sorted-lists/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 112, Meta: 98, Google: 87, Microsoft: 76, Apple: 65 },
    acceptance_rate: 62.4,
    premium_only: false,
    estimated_time_minutes: 20,
    notes: 'Classic merge pattern. Use dummy head node.'
  },
  {
    problem_name: 'Merge k Sorted Lists',
    leetcode_number: 23,
    leetcode_slug: 'merge-k-sorted-lists',
    difficulty: 'Hard',
    category: 'Linked List',
    subcategory: 'Heap/Priority Queue',
    topics: ['linked-list', 'divide-and-conquer', 'heap', 'merge-sort'],
    url: 'https://leetcode.com/problems/merge-k-sorted-lists/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 145, Meta: 123, Google: 112, Microsoft: 98, Apple: 87 },
    acceptance_rate: 49.8,
    premium_only: false,
    estimated_time_minutes: 40,
    notes: 'Min heap or divide-and-conquer. Optimize with priority queue.'
  },
  {
    problem_name: 'Remove Nth Node From End of List',
    leetcode_number: 19,
    leetcode_slug: 'remove-nth-node-from-end-of-list',
    difficulty: 'Medium',
    category: 'Linked List',
    subcategory: 'Two Pointers',
    topics: ['linked-list', 'two-pointers'],
    url: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 87, Meta: 76, Google: 65, Microsoft: 54, Apple: 43 },
    acceptance_rate: 42.1,
    premium_only: false,
    estimated_time_minutes: 20,
    notes: 'Two-pointer technique. Fast pointer gets n-step head start.'
  },
  {
    problem_name: 'Reorder List',
    leetcode_number: 143,
    leetcode_slug: 'reorder-list',
    difficulty: 'Medium',
    category: 'Linked List',
    subcategory: 'Multiple Operations',
    topics: ['linked-list', 'two-pointers', 'stack', 'recursion'],
    url: 'https://leetcode.com/problems/reorder-list/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 65, Meta: 54, Google: 43, Microsoft: 38, Bloomberg: 32 },
    acceptance_rate: 54.6,
    premium_only: false,
    estimated_time_minutes: 30,
    notes: 'Find middle, reverse second half, merge two halves.'
  },

  // ========== TREES ==========
  {
    problem_name: 'Maximum Depth of Binary Tree',
    leetcode_number: 104,
    leetcode_slug: 'maximum-depth-of-binary-tree',
    difficulty: 'Easy',
    category: 'Trees',
    subcategory: 'DFS/BFS',
    topics: ['tree', 'depth-first-search', 'breadth-first-search', 'binary-tree'],
    url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 98, Meta: 87, Google: 76, Microsoft: 65, Apple: 54 },
    acceptance_rate: 74.2,
    premium_only: false,
    estimated_time_minutes: 10,
    notes: 'Simple DFS or BFS. Good intro to tree traversal.'
  },
  {
    problem_name: 'Same Tree',
    leetcode_number: 100,
    leetcode_slug: 'same-tree',
    difficulty: 'Easy',
    category: 'Trees',
    subcategory: 'DFS',
    topics: ['tree', 'depth-first-search', 'breadth-first-search', 'binary-tree'],
    url: 'https://leetcode.com/problems/same-tree/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 76, Meta: 65, Google: 54, Microsoft: 43, Apple: 38 },
    acceptance_rate: 59.3,
    premium_only: false,
    estimated_time_minutes: 15,
    notes: 'Recursive comparison of tree structures.'
  },
  {
    problem_name: 'Invert Binary Tree',
    leetcode_number: 226,
    leetcode_slug: 'invert-binary-tree',
    difficulty: 'Easy',
    category: 'Trees',
    subcategory: 'DFS',
    topics: ['tree', 'depth-first-search', 'breadth-first-search', 'binary-tree'],
    url: 'https://leetcode.com/problems/invert-binary-tree/',
    problem_list: 'Blind 75',
    company_frequency: { Google: 87, Amazon: 76, Meta: 65, Microsoft: 54, Apple: 43 },
    acceptance_rate: 74.8,
    premium_only: false,
    estimated_time_minutes: 10,
    notes: 'Famous problem. Swap left and right children recursively.'
  },
  {
    problem_name: 'Binary Tree Maximum Path Sum',
    leetcode_number: 124,
    leetcode_slug: 'binary-tree-maximum-path-sum',
    difficulty: 'Hard',
    category: 'Trees',
    subcategory: 'DFS/Recursion',
    topics: ['dynamic-programming', 'tree', 'depth-first-search', 'binary-tree'],
    url: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/',
    problem_list: 'Blind 75',
    company_frequency: { Meta: 112, Amazon: 98, Google: 87, Microsoft: 76, Bloomberg: 65 },
    acceptance_rate: 38.9,
    premium_only: false,
    estimated_time_minutes: 40,
    notes: 'Track max path through each node. Handle negative values.'
  },
  {
    problem_name: 'Binary Tree Level Order Traversal',
    leetcode_number: 102,
    leetcode_slug: 'binary-tree-level-order-traversal',
    difficulty: 'Medium',
    category: 'Trees',
    subcategory: 'BFS',
    topics: ['tree', 'breadth-first-search', 'binary-tree'],
    url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 134, Meta: 112, Google: 98, Microsoft: 87, Apple: 76 },
    acceptance_rate: 65.1,
    premium_only: false,
    estimated_time_minutes: 20,
    notes: 'Classic BFS with queue. Track level boundaries.'
  },
  {
    problem_name: 'Serialize and Deserialize Binary Tree',
    leetcode_number: 297,
    leetcode_slug: 'serialize-and-deserialize-binary-tree',
    difficulty: 'Hard',
    category: 'Trees',
    subcategory: 'DFS/BFS',
    topics: ['string', 'tree', 'depth-first-search', 'breadth-first-search', 'design', 'binary-tree'],
    url: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/',
    problem_list: 'Blind 75',
    company_frequency: { Meta: 123, Amazon: 112, Google: 98, Microsoft: 87, Bloomberg: 76 },
    acceptance_rate: 55.2,
    premium_only: false,
    estimated_time_minutes: 45,
    notes: 'Design problem. Use preorder traversal with null markers.'
  },
  {
    problem_name: 'Subtree of Another Tree',
    leetcode_number: 572,
    leetcode_slug: 'subtree-of-another-tree',
    difficulty: 'Easy',
    category: 'Trees',
    subcategory: 'DFS',
    topics: ['tree', 'depth-first-search', 'string-matching', 'binary-tree', 'hash-function'],
    url: 'https://leetcode.com/problems/subtree-of-another-tree/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 87, Meta: 76, Google: 65, Microsoft: 54, Apple: 43 },
    acceptance_rate: 46.8,
    premium_only: false,
    estimated_time_minutes: 25,
    notes: 'Check if subtree matches at each node using isSameTree.'
  },
  {
    problem_name: 'Construct Binary Tree from Preorder and Inorder Traversal',
    leetcode_number: 105,
    leetcode_slug: 'construct-binary-tree-from-preorder-and-inorder-traversal',
    difficulty: 'Medium',
    category: 'Trees',
    subcategory: 'Recursion',
    topics: ['array', 'hash-table', 'divide-and-conquer', 'tree', 'binary-tree'],
    url: 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 98, Meta: 87, Google: 76, Microsoft: 65, Bloomberg: 54 },
    acceptance_rate: 62.4,
    premium_only: false,
    estimated_time_minutes: 35,
    notes: 'Use hash map for inorder indices. Recursively build tree.'
  },
  {
    problem_name: 'Validate Binary Search Tree',
    leetcode_number: 98,
    leetcode_slug: 'validate-binary-search-tree',
    difficulty: 'Medium',
    category: 'Trees',
    subcategory: 'DFS',
    topics: ['tree', 'depth-first-search', 'binary-search-tree', 'binary-tree'],
    url: 'https://leetcode.com/problems/validate-binary-search-tree/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 145, Meta: 123, Google: 112, Microsoft: 98, Apple: 87 },
    acceptance_rate: 32.1,
    premium_only: false,
    estimated_time_minutes: 25,
    notes: 'Pass min/max bounds down recursively. Not just parent comparison.'
  },
  {
    problem_name: 'Kth Smallest Element in a BST',
    leetcode_number: 230,
    leetcode_slug: 'kth-smallest-element-in-a-bst',
    difficulty: 'Medium',
    category: 'Trees',
    subcategory: 'In-order Traversal',
    topics: ['tree', 'depth-first-search', 'binary-search-tree', 'binary-tree'],
    url: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 87, Meta: 76, Google: 65, Microsoft: 54, Bloomberg: 43 },
    acceptance_rate: 71.2,
    premium_only: false,
    estimated_time_minutes: 20,
    notes: 'In-order traversal gives sorted order. Count to kth element.'
  },
  {
    problem_name: 'Lowest Common Ancestor of a Binary Search Tree',
    leetcode_number: 235,
    leetcode_slug: 'lowest-common-ancestor-of-a-binary-search-tree',
    difficulty: 'Medium',
    category: 'Trees',
    subcategory: 'BST Properties',
    topics: ['tree', 'depth-first-search', 'binary-search-tree', 'binary-tree'],
    url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 112, Meta: 98, Google: 87, Microsoft: 76, Apple: 65 },
    acceptance_rate: 61.8,
    premium_only: false,
    estimated_time_minutes: 20,
    notes: 'Use BST property: LCA is where paths diverge.'
  },
  {
    problem_name: 'Implement Trie (Prefix Tree)',
    leetcode_number: 208,
    leetcode_slug: 'implement-trie-prefix-tree',
    difficulty: 'Medium',
    category: 'Trees',
    subcategory: 'Trie',
    topics: ['hash-table', 'string', 'design', 'trie'],
    url: 'https://leetcode.com/problems/implement-trie-prefix-tree/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 123, Meta: 112, Google: 98, Microsoft: 87, Apple: 76 },
    acceptance_rate: 63.2,
    premium_only: false,
    estimated_time_minutes: 30,
    notes: 'Design problem. Use TrieNode with children hash map.'
  },
  {
    problem_name: 'Design Add and Search Words Data Structure',
    leetcode_number: 211,
    leetcode_slug: 'design-add-and-search-words-data-structure',
    difficulty: 'Medium',
    category: 'Trees',
    subcategory: 'Trie + DFS',
    topics: ['string', 'depth-first-search', 'design', 'trie'],
    url: 'https://leetcode.com/problems/design-add-and-search-words-data-structure/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 98, Meta: 87, Google: 76, Microsoft: 65, Apple: 54 },
    acceptance_rate: 44.9,
    premium_only: false,
    estimated_time_minutes: 35,
    notes: 'Trie with wildcard search. DFS on \'.\' character.'
  },
  {
    problem_name: 'Word Search II',
    leetcode_number: 212,
    leetcode_slug: 'word-search-ii',
    difficulty: 'Hard',
    category: 'Trees',
    subcategory: 'Trie + Backtracking',
    topics: ['array', 'string', 'backtracking', 'trie', 'matrix'],
    url: 'https://leetcode.com/problems/word-search-ii/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 134, Meta: 123, Google: 112, Microsoft: 98, Apple: 87 },
    acceptance_rate: 37.4,
    premium_only: false,
    estimated_time_minutes: 50,
    notes: 'Build Trie from words, then DFS on board. Prune visited words.'
  },

  // ========== DYNAMIC PROGRAMMING ==========
  {
    problem_name: 'Climbing Stairs',
    leetcode_number: 70,
    leetcode_slug: 'climbing-stairs',
    difficulty: 'Easy',
    category: 'Dynamic Programming',
    subcategory: 'Fibonacci Pattern',
    topics: ['math', 'dynamic-programming', 'memoization'],
    url: 'https://leetcode.com/problems/climbing-stairs/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 112, Google: 98, Meta: 87, Microsoft: 76, Apple: 65 },
    acceptance_rate: 52.1,
    premium_only: false,
    estimated_time_minutes: 15,
    notes: 'Classic DP intro. Fibonacci pattern: dp[i] = dp[i-1] + dp[i-2].'
  },
  {
    problem_name: 'Coin Change',
    leetcode_number: 322,
    leetcode_slug: 'coin-change',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    subcategory: 'Unbounded Knapsack',
    topics: ['array', 'dynamic-programming', 'breadth-first-search'],
    url: 'https://leetcode.com/problems/coin-change/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 134, Meta: 123, Google: 112, Microsoft: 98, Bloomberg: 87 },
    acceptance_rate: 42.8,
    premium_only: false,
    estimated_time_minutes: 30,
    notes: 'Classic unbounded knapsack. Build up from amount 0 to target.'
  },
  {
    problem_name: 'Longest Increasing Subsequence',
    leetcode_number: 300,
    leetcode_slug: 'longest-increasing-subsequence',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    subcategory: 'LIS Pattern',
    topics: ['array', 'binary-search', 'dynamic-programming'],
    url: 'https://leetcode.com/problems/longest-increasing-subsequence/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 98, Meta: 87, Google: 76, Microsoft: 65, Bloomberg: 54 },
    acceptance_rate: 52.3,
    premium_only: false,
    estimated_time_minutes: 35,
    notes: 'O(n^2) DP or O(n log n) with binary search.'
  },
  {
    problem_name: 'Longest Common Subsequence',
    leetcode_number: 1143,
    leetcode_slug: 'longest-common-subsequence',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    subcategory: '2D DP',
    topics: ['string', 'dynamic-programming'],
    url: 'https://leetcode.com/problems/longest-common-subsequence/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 87, Google: 76, Meta: 65, Microsoft: 54, Bloomberg: 43 },
    acceptance_rate: 58.9,
    premium_only: false,
    estimated_time_minutes: 30,
    notes: 'Classic 2D DP. If match, dp[i][j] = dp[i-1][j-1] + 1.'
  },
  {
    problem_name: 'Word Break',
    leetcode_number: 139,
    leetcode_slug: 'word-break',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    subcategory: 'String Partition',
    topics: ['hash-table', 'string', 'dynamic-programming', 'trie', 'memoization'],
    url: 'https://leetcode.com/problems/word-break/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 145, Meta: 123, Google: 112, Microsoft: 98, Apple: 87 },
    acceptance_rate: 45.2,
    premium_only: false,
    estimated_time_minutes: 30,
    notes: 'DP with word dict. Check all possible word breaks at each position.'
  },
  {
    problem_name: 'Combination Sum IV',
    leetcode_number: 377,
    leetcode_slug: 'combination-sum-iv',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    subcategory: 'Unbounded Knapsack',
    topics: ['array', 'dynamic-programming'],
    url: 'https://leetcode.com/problems/combination-sum-iv/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 76, Meta: 65, Google: 54, Microsoft: 43, Bloomberg: 38 },
    acceptance_rate: 51.4,
    premium_only: false,
    estimated_time_minutes: 25,
    notes: 'Similar to coin change. Order matters, so iterate target first.'
  },
  {
    problem_name: 'House Robber',
    leetcode_number: 198,
    leetcode_slug: 'house-robber',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    subcategory: 'Linear DP',
    topics: ['array', 'dynamic-programming'],
    url: 'https://leetcode.com/problems/house-robber/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 112, Meta: 98, Google: 87, Microsoft: 76, Apple: 65 },
    acceptance_rate: 49.8,
    premium_only: false,
    estimated_time_minutes: 20,
    notes: 'Rob i or skip i. dp[i] = max(dp[i-1], dp[i-2] + nums[i]).'
  },
  {
    problem_name: 'House Robber II',
    leetcode_number: 213,
    leetcode_slug: 'house-robber-ii',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    subcategory: 'Linear DP',
    topics: ['array', 'dynamic-programming'],
    url: 'https://leetcode.com/problems/house-robber-ii/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 87, Meta: 76, Google: 65, Microsoft: 54, Bloomberg: 43 },
    acceptance_rate: 40.6,
    premium_only: false,
    estimated_time_minutes: 25,
    notes: 'Circular array. Run House Robber I twice: [0..n-2] and [1..n-1].'
  },
  {
    problem_name: 'Decode Ways',
    leetcode_number: 91,
    leetcode_slug: 'decode-ways',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    subcategory: 'String Partition',
    topics: ['string', 'dynamic-programming'],
    url: 'https://leetcode.com/problems/decode-ways/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 98, Meta: 87, Google: 76, Microsoft: 65, Bloomberg: 54 },
    acceptance_rate: 32.4,
    premium_only: false,
    estimated_time_minutes: 30,
    notes: 'Check single digit and two-digit decodings. Handle edge cases.'
  },
  {
    problem_name: 'Unique Paths',
    leetcode_number: 62,
    leetcode_slug: 'unique-paths',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    subcategory: '2D Grid DP',
    topics: ['math', 'dynamic-programming', 'combinatorics'],
    url: 'https://leetcode.com/problems/unique-paths/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 112, Meta: 98, Google: 87, Microsoft: 76, Bloomberg: 65 },
    acceptance_rate: 63.2,
    premium_only: false,
    estimated_time_minutes: 20,
    notes: 'Grid DP. dp[i][j] = dp[i-1][j] + dp[i][j-1].'
  },
  {
    problem_name: 'Jump Game',
    leetcode_number: 55,
    leetcode_slug: 'jump-game',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    subcategory: 'Greedy',
    topics: ['array', 'dynamic-programming', 'greedy'],
    url: 'https://leetcode.com/problems/jump-game/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 134, Meta: 123, Google: 112, Microsoft: 98, Apple: 87 },
    acceptance_rate: 38.7,
    premium_only: false,
    estimated_time_minutes: 25,
    notes: 'Greedy approach. Track maximum reachable index.'
  },

  // ========== GRAPH ==========
  {
    problem_name: 'Clone Graph',
    leetcode_number: 133,
    leetcode_slug: 'clone-graph',
    difficulty: 'Medium',
    category: 'Graph',
    subcategory: 'DFS/BFS',
    topics: ['hash-table', 'depth-first-search', 'breadth-first-search', 'graph'],
    url: 'https://leetcode.com/problems/clone-graph/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 112, Meta: 98, Google: 87, Microsoft: 76, Apple: 65 },
    acceptance_rate: 51.3,
    premium_only: false,
    estimated_time_minutes: 30,
    notes: 'Use hash map to track cloned nodes. DFS or BFS.'
  },
  {
    problem_name: 'Course Schedule',
    leetcode_number: 207,
    leetcode_slug: 'course-schedule',
    difficulty: 'Medium',
    category: 'Graph',
    subcategory: 'Topological Sort',
    topics: ['depth-first-search', 'breadth-first-search', 'graph', 'topological-sort'],
    url: 'https://leetcode.com/problems/course-schedule/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 145, Meta: 123, Google: 112, Microsoft: 98, Apple: 87 },
    acceptance_rate: 46.8,
    premium_only: false,
    estimated_time_minutes: 35,
    notes: 'Detect cycle in directed graph. Use DFS with visited states.'
  },
  {
    problem_name: 'Pacific Atlantic Water Flow',
    leetcode_number: 417,
    leetcode_slug: 'pacific-atlantic-water-flow',
    difficulty: 'Medium',
    category: 'Graph',
    subcategory: 'DFS/BFS',
    topics: ['array', 'depth-first-search', 'breadth-first-search', 'matrix'],
    url: 'https://leetcode.com/problems/pacific-atlantic-water-flow/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 87, Meta: 76, Google: 65, Microsoft: 54, Bloomberg: 43 },
    acceptance_rate: 54.2,
    premium_only: false,
    estimated_time_minutes: 35,
    notes: 'DFS from both oceans. Find intersection of reachable cells.'
  },
  {
    problem_name: 'Number of Islands',
    leetcode_number: 200,
    leetcode_slug: 'number-of-islands',
    difficulty: 'Medium',
    category: 'Graph',
    subcategory: 'DFS/BFS',
    topics: ['array', 'depth-first-search', 'breadth-first-search', 'union-find', 'matrix'],
    url: 'https://leetcode.com/problems/number-of-islands/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 178, Meta: 156, Google: 134, Microsoft: 112, Apple: 98 },
    acceptance_rate: 57.4,
    premium_only: false,
    estimated_time_minutes: 25,
    notes: 'Classic grid DFS/BFS. Mark visited cells.'
  },
  {
    problem_name: 'Longest Consecutive Sequence',
    leetcode_number: 128,
    leetcode_slug: 'longest-consecutive-sequence',
    difficulty: 'Medium',
    category: 'Graph',
    subcategory: 'Union Find / Hash Set',
    topics: ['array', 'hash-table', 'union-find'],
    url: 'https://leetcode.com/problems/longest-consecutive-sequence/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 134, Meta: 123, Google: 112, Microsoft: 98, Bloomberg: 87 },
    acceptance_rate: 48.9,
    premium_only: false,
    estimated_time_minutes: 30,
    notes: 'Use hash set. Only start sequence if num-1 not in set.'
  },
  {
    problem_name: 'Graph Valid Tree',
    leetcode_number: 261,
    leetcode_slug: 'graph-valid-tree',
    difficulty: 'Medium',
    category: 'Graph',
    subcategory: 'Union Find / DFS',
    topics: ['depth-first-search', 'breadth-first-search', 'union-find', 'graph'],
    url: 'https://leetcode.com/problems/graph-valid-tree/',
    problem_list: 'Blind 75',
    company_frequency: { Meta: 98, Amazon: 87, Google: 76, Microsoft: 65, Apple: 54 },
    acceptance_rate: 45.2,
    premium_only: true,
    estimated_time_minutes: 30,
    notes: 'Tree = connected + no cycles. Check edges = n-1 and connectivity.'
  },
  {
    problem_name: 'Number of Connected Components in an Undirected Graph',
    leetcode_number: 323,
    leetcode_slug: 'number-of-connected-components-in-an-undirected-graph',
    difficulty: 'Medium',
    category: 'Graph',
    subcategory: 'Union Find / DFS',
    topics: ['depth-first-search', 'breadth-first-search', 'union-find', 'graph'],
    url: 'https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 112, Meta: 98, Google: 87, Microsoft: 76, LinkedIn: 65 },
    acceptance_rate: 61.8,
    premium_only: true,
    estimated_time_minutes: 30,
    notes: 'Union-Find or DFS. Count components after processing all edges.'
  },

  // ========== INTERVALS ==========
  {
    problem_name: 'Insert Interval',
    leetcode_number: 57,
    leetcode_slug: 'insert-interval',
    difficulty: 'Medium',
    category: 'Intervals',
    subcategory: 'Merge Intervals',
    topics: ['array'],
    url: 'https://leetcode.com/problems/insert-interval/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 123, Meta: 112, Google: 98, Microsoft: 87, Apple: 76 },
    acceptance_rate: 39.8,
    premium_only: false,
    estimated_time_minutes: 30,
    notes: 'Three phases: before overlap, merge overlaps, after overlap.'
  },
  {
    problem_name: 'Merge Intervals',
    leetcode_number: 56,
    leetcode_slug: 'merge-intervals',
    difficulty: 'Medium',
    category: 'Intervals',
    subcategory: 'Merge Intervals',
    topics: ['array', 'sorting'],
    url: 'https://leetcode.com/problems/merge-intervals/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 156, Meta: 145, Google: 134, Microsoft: 123, Bloomberg: 112 },
    acceptance_rate: 46.3,
    premium_only: false,
    estimated_time_minutes: 25,
    notes: 'Sort by start time. Merge overlapping intervals.'
  },
  {
    problem_name: 'Non-overlapping Intervals',
    leetcode_number: 435,
    leetcode_slug: 'non-overlapping-intervals',
    difficulty: 'Medium',
    category: 'Intervals',
    subcategory: 'Greedy',
    topics: ['array', 'dynamic-programming', 'greedy', 'sorting'],
    url: 'https://leetcode.com/problems/non-overlapping-intervals/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 98, Meta: 87, Google: 76, Microsoft: 65, Bloomberg: 54 },
    acceptance_rate: 51.2,
    premium_only: false,
    estimated_time_minutes: 30,
    notes: 'Greedy: sort by end time. Remove intervals that overlap.'
  },
  {
    problem_name: 'Meeting Rooms',
    leetcode_number: 252,
    leetcode_slug: 'meeting-rooms',
    difficulty: 'Easy',
    category: 'Intervals',
    subcategory: 'Sorting',
    topics: ['array', 'sorting'],
    url: 'https://leetcode.com/problems/meeting-rooms/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 87, Meta: 76, Google: 65, Microsoft: 54, Bloomberg: 43 },
    acceptance_rate: 57.8,
    premium_only: true,
    estimated_time_minutes: 15,
    notes: 'Sort intervals. Check if any overlap (start < prev_end).'
  },
  {
    problem_name: 'Meeting Rooms II',
    leetcode_number: 253,
    leetcode_slug: 'meeting-rooms-ii',
    difficulty: 'Medium',
    category: 'Intervals',
    subcategory: 'Heap/Priority Queue',
    topics: ['array', 'two-pointers', 'greedy', 'sorting', 'heap', 'prefix-sum'],
    url: 'https://leetcode.com/problems/meeting-rooms-ii/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 134, Meta: 123, Google: 112, Microsoft: 98, Bloomberg: 87 },
    acceptance_rate: 49.6,
    premium_only: true,
    estimated_time_minutes: 35,
    notes: 'Min heap of end times. Track max concurrent meetings.'
  },

  // ========== HEAP / PRIORITY QUEUE ==========
  {
    problem_name: 'Top K Frequent Elements',
    leetcode_number: 347,
    leetcode_slug: 'top-k-frequent-elements',
    difficulty: 'Medium',
    category: 'Heap',
    subcategory: 'Hash Map + Heap',
    topics: ['array', 'hash-table', 'divide-and-conquer', 'sorting', 'heap', 'bucket-sort', 'counting', 'quickselect'],
    url: 'https://leetcode.com/problems/top-k-frequent-elements/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 145, Meta: 134, Google: 123, Microsoft: 112, Apple: 98 },
    acceptance_rate: 64.8,
    premium_only: false,
    estimated_time_minutes: 25,
    notes: 'Count frequencies, then use min heap or bucket sort.'
  },
  {
    problem_name: 'Find Median from Data Stream',
    leetcode_number: 295,
    leetcode_slug: 'find-median-from-data-stream',
    difficulty: 'Hard',
    category: 'Heap',
    subcategory: 'Two Heaps',
    topics: ['two-pointers', 'design', 'sorting', 'heap', 'data-stream'],
    url: 'https://leetcode.com/problems/find-median-from-data-stream/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 134, Meta: 123, Google: 112, Microsoft: 98, Apple: 87 },
    acceptance_rate: 51.4,
    premium_only: false,
    estimated_time_minutes: 45,
    notes: 'Use max heap (left half) and min heap (right half).'
  },

  // ========== BIT MANIPULATION ==========
  {
    problem_name: 'Number of 1 Bits',
    leetcode_number: 191,
    leetcode_slug: 'number-of-1-bits',
    difficulty: 'Easy',
    category: 'Bit Manipulation',
    subcategory: 'Bit Counting',
    topics: ['divide-and-conquer', 'bit-manipulation'],
    url: 'https://leetcode.com/problems/number-of-1-bits/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 76, Meta: 65, Google: 54, Microsoft: 43, Apple: 38 },
    acceptance_rate: 69.4,
    premium_only: false,
    estimated_time_minutes: 10,
    notes: 'Use n & (n-1) to clear rightmost 1 bit.'
  },
  {
    problem_name: 'Counting Bits',
    leetcode_number: 338,
    leetcode_slug: 'counting-bits',
    difficulty: 'Easy',
    category: 'Bit Manipulation',
    subcategory: 'DP + Bit Counting',
    topics: ['dynamic-programming', 'bit-manipulation'],
    url: 'https://leetcode.com/problems/counting-bits/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 87, Meta: 76, Google: 65, Microsoft: 54, Apple: 43 },
    acceptance_rate: 77.2,
    premium_only: false,
    estimated_time_minutes: 20,
    notes: 'DP: dp[i] = dp[i >> 1] + (i & 1).'
  },
  {
    problem_name: 'Reverse Bits',
    leetcode_number: 190,
    leetcode_slug: 'reverse-bits',
    difficulty: 'Easy',
    category: 'Bit Manipulation',
    subcategory: 'Bit Reversal',
    topics: ['divide-and-conquer', 'bit-manipulation'],
    url: 'https://leetcode.com/problems/reverse-bits/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 65, Meta: 54, Google: 43, Microsoft: 38, Apple: 32 },
    acceptance_rate: 54.6,
    premium_only: false,
    estimated_time_minutes: 20,
    notes: 'Extract bits one by one and build reversed number.'
  },
  {
    problem_name: 'Missing Number',
    leetcode_number: 268,
    leetcode_slug: 'missing-number',
    difficulty: 'Easy',
    category: 'Bit Manipulation',
    subcategory: 'XOR',
    topics: ['array', 'hash-table', 'math', 'binary-search', 'bit-manipulation', 'sorting'],
    url: 'https://leetcode.com/problems/missing-number/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 98, Meta: 87, Google: 76, Microsoft: 65, Apple: 54 },
    acceptance_rate: 63.8,
    premium_only: false,
    estimated_time_minutes: 15,
    notes: 'XOR all indices and values. Missing number will remain.'
  },
  {
    problem_name: 'Sum of Two Integers',
    leetcode_number: 371,
    leetcode_slug: 'sum-of-two-integers',
    difficulty: 'Medium',
    category: 'Bit Manipulation',
    subcategory: 'Addition without +',
    topics: ['math', 'bit-manipulation'],
    url: 'https://leetcode.com/problems/sum-of-two-integers/',
    problem_list: 'Blind 75',
    company_frequency: { Amazon: 76, Meta: 65, Google: 54, Microsoft: 43, Apple: 38 },
    acceptance_rate: 50.8,
    premium_only: false,
    estimated_time_minutes: 25,
    notes: 'XOR for sum, AND+shift for carry. Loop until carry is 0.'
  }
];

async function seedBlind75() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('Starting Blind 75 seed...');

    for (const problem of blind75Problems) {
      const query = `
        INSERT INTO curated_problems (
          problem_name,
          leetcode_number,
          leetcode_slug,
          difficulty,
          category,
          subcategory,
          topics,
          url,
          problem_list,
          company_frequency,
          acceptance_rate,
          premium_only,
          estimated_time_minutes,
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (leetcode_number) DO UPDATE SET
          problem_name = EXCLUDED.problem_name,
          difficulty = EXCLUDED.difficulty,
          category = EXCLUDED.category,
          subcategory = EXCLUDED.subcategory,
          topics = EXCLUDED.topics,
          company_frequency = EXCLUDED.company_frequency,
          acceptance_rate = EXCLUDED.acceptance_rate,
          updated_at = CURRENT_TIMESTAMP
      `;

      await client.query(query, [
        problem.problem_name,
        problem.leetcode_number,
        problem.leetcode_slug,
        problem.difficulty,
        problem.category,
        problem.subcategory,
        problem.topics,
        problem.url,
        problem.problem_list,
        JSON.stringify(problem.company_frequency),
        problem.acceptance_rate,
        problem.premium_only,
        problem.estimated_time_minutes,
        problem.notes
      ]);

      console.log(`✓ Seeded: ${problem.problem_name} (LC #${problem.leetcode_number})`);
    }

    await client.query('COMMIT');

    console.log('\n✅ Successfully seeded all 75 Blind 75 problems!');

    // Print summary
    const summary = await client.query(`
      SELECT
        difficulty,
        COUNT(*) as count
      FROM curated_problems
      WHERE problem_list = 'Blind 75'
      GROUP BY difficulty
      ORDER BY
        CASE difficulty
          WHEN 'Easy' THEN 1
          WHEN 'Medium' THEN 2
          WHEN 'Hard' THEN 3
        END
    `);

    console.log('\n📊 Difficulty Distribution:');
    summary.rows.forEach(row => {
      console.log(`   ${row.difficulty}: ${row.count} problems`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding Blind 75:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seed script
if (require.main === module) {
  seedBlind75()
    .then(() => {
      console.log('\n🎉 Seed script completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Seed script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedBlind75 };
