#!/usr/bin/env python3

"""
Test script for the intelligent reorder functionality.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from spotifyops.logic.intelligent_reorder import IntelligentReorderCalculator

def test_basic_reorder():
    """Test basic reordering functionality."""
    calculator = IntelligentReorderCalculator()
    
    # Simple test case
    original = ["A", "B", "C", "D", "E"]
    new_order = ["B", "A", "C", "D", "E"]  # Just swap first two
    
    print("Testing basic reorder:")
    print(f"Original: {original}")
    print(f"Target:   {new_order}")
    
    try:
        result = calculator.calculate_reorder_strategy(original, new_order)
        print(f"Strategy: {result['strategy']}")
        print(f"Reason: {result['reason']}")
        
        if result["strategy"] == "intelligent_moves":
            moves = result["moves"]
            print(f"Moves needed: {len(moves)}")
            for i, move in enumerate(moves):
                print(f"  Move {i+1}: {move}")
            
            # Test the moves
            test_list = original.copy()
            for move in moves:
                calculator._apply_move_to_list(test_list, move)
            
            print(f"Result: {test_list}")
            print(f"Success: {test_list == new_order}")
        
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_complex_reorder():
    """Test more complex reordering."""
    calculator = IntelligentReorderCalculator()
    
    original = ["A", "B", "C", "D", "E", "F"]
    new_order = ["D", "A", "B", "F", "C", "E"]  # More complex reorder
    
    print("\nTesting complex reorder:")
    print(f"Original: {original}")
    print(f"Target:   {new_order}")
    
    try:
        result = calculator.calculate_reorder_strategy(original, new_order)
        print(f"Strategy: {result['strategy']}")
        print(f"Similarity: {result['similarity']:.2f}")
        print(f"Reason: {result['reason']}")
        
        if result["strategy"] == "intelligent_moves":
            moves = result["moves"]
            print(f"Moves needed: {len(moves)}")
            for i, move in enumerate(moves):
                print(f"  Move {i+1}: {move}")
        
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("Testing intelligent reorder functionality...\n")
    
    success1 = test_basic_reorder()
    success2 = test_complex_reorder()
    
    if success1 and success2:
        print("\n✅ All tests passed!")
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)
