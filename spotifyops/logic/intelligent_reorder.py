"""
Intelligent playlist reordering that calculates minimal moves needed
to transform one track order into another.
"""

from typing import List, Tuple, Dict, Any
from dataclasses import dataclass


@dataclass
class PlaylistMove:
    """Represents a single move operation for Spotify API."""
    range_start: int
    insert_before: int
    range_length: int = 1
    
    def __str__(self):
        return f"Move {self.range_length} track(s) from position {self.range_start} to before position {self.insert_before}"


class IntelligentReorderCalculator:
    """
    Calculates the minimal set of moves needed to reorder a playlist
    using Spotify's range-based reordering API.
    """
    
    def calculate_reorder_strategy(self, original_order: List[str], new_order: List[str]) -> Dict[str, Any]:
        """
        Determines the best reordering strategy and returns the plan.
        
        Returns:
            {
                "strategy": "intelligent_moves" | "full_rewrite",
                "moves": List[PlaylistMove] | None,
                "similarity": float,
                "efficiency_gain": float,
                "reason": str
            }
        """
        if not original_order or not new_order:
            return {"strategy": "full_rewrite", "reason": "Empty playlist"}
        
        if len(original_order) != len(new_order):
            return {"strategy": "full_rewrite", "reason": "Different track counts"}
        
        if set(original_order) != set(new_order):
            return {"strategy": "full_rewrite", "reason": "Different tracks"}
        
        # Calculate similarity metrics
        similarity = self._calculate_similarity(original_order, new_order)
        moves = self._calculate_minimal_moves(original_order, new_order)
        move_ratio = len(moves) / len(original_order) if original_order else 1
        
        # Decision logic
        if similarity > 0.7 and move_ratio < 0.4:
            strategy = "intelligent_moves"
            efficiency_gain = 1 - (len(moves) / len(original_order))
            reason = f"High similarity ({similarity:.2f}) with few moves needed ({len(moves)})"
        elif len(moves) < len(original_order) * 0.5:
            strategy = "intelligent_moves" 
            efficiency_gain = 1 - (len(moves) / len(original_order))
            reason = f"Fewer moves ({len(moves)}) than full rewrite ({len(original_order)})"
        else:
            strategy = "full_rewrite"
            efficiency_gain = 0
            reason = f"Too many moves needed ({len(moves)}) - full rewrite more efficient"
        
        return {
            "strategy": strategy,
            "moves": moves if strategy == "intelligent_moves" else None,
            "similarity": similarity,
            "efficiency_gain": efficiency_gain,
            "move_count": len(moves),
            "reason": reason
        }
    
    def _calculate_similarity(self, original: List[str], new: List[str]) -> float:
        """
        Calculates how similar two orderings are (0.0 = completely different, 1.0 = identical).
        Uses positional similarity - tracks that stay in similar positions score higher.
        """
        if len(original) != len(new):
            return 0.0
        
        if not original:
            return 1.0
        
        total_score = 0
        for i, track in enumerate(original):
            try:
                new_position = new.index(track)
                # Score based on how close the positions are
                position_diff = abs(i - new_position)
                max_diff = len(original) - 1
                similarity_score = 1 - (position_diff / max_diff) if max_diff > 0 else 1
                total_score += similarity_score
            except ValueError:
                # Track not found in new order
                continue
        
        return total_score / len(original)
    
    def _calculate_minimal_moves(self, original: List[str], target: List[str]) -> List[PlaylistMove]:
        """
        Calculates the minimal set of moves to transform original order to target order.
        Uses a more robust approach that handles the transformation correctly.
        """
        moves = []
        current = original.copy()
        
        # Work through each position in the target order
        for target_pos in range(len(target)):
            target_track = target[target_pos]
            
            # Find where this track currently is
            try:
                current_pos = current.index(target_track)
            except ValueError:
                # Track not found, skip
                continue
            
            # If track is already in correct position, continue
            if current_pos == target_pos:
                continue
            
            # Calculate how many consecutive tracks we can move together
            sequence_length = 1
            while (target_pos + sequence_length < len(target) and
                   current_pos + sequence_length < len(current) and
                   target[target_pos + sequence_length] == current[current_pos + sequence_length]):
                sequence_length += 1
            
            # Create the move
            if current_pos > target_pos:
                # Moving backwards
                move = PlaylistMove(
                    range_start=current_pos,
                    insert_before=target_pos,
                    range_length=sequence_length
                )
            else:
                # Moving forwards - need to account for the gap created by removing items
                move = PlaylistMove(
                    range_start=current_pos,
                    insert_before=target_pos + 1,
                    range_length=sequence_length
                )
            
            moves.append(move)
            
            # Apply the move to our current state to keep track
            self._apply_move_to_list(current, move)
        
        return moves
    
    def _apply_move_to_list(self, playlist: List[str], move: PlaylistMove) -> None:
        """
        Applies a move operation to a list (simulates Spotify API behavior).
        """
        # Validate indices
        if (move.range_start < 0 or 
            move.range_start >= len(playlist) or
            move.range_start + move.range_length > len(playlist)):
            print(f"Warning: Invalid move range {move.range_start}:{move.range_start + move.range_length} for playlist of size {len(playlist)}")
            return
        
        # Extract the items to move
        items_to_move = playlist[move.range_start:move.range_start + move.range_length]
        
        # Remove the items from their current position
        del playlist[move.range_start:move.range_start + move.range_length]
        
        # Adjust insert position if we removed items before it
        insert_pos = move.insert_before
        if move.insert_before > move.range_start:
            insert_pos -= move.range_length
        
        # Ensure insert position is valid
        insert_pos = max(0, min(insert_pos, len(playlist)))
        
        # Insert the items at the new position
        for i, item in enumerate(items_to_move):
            playlist.insert(insert_pos + i, item)
    
    def validate_moves(self, original: List[str], moves: List[PlaylistMove]) -> bool:
        """
        Validates that a sequence of moves produces the expected result.
        """
        test_list = original.copy()
        
        try:
            for move in moves:
                self._apply_move_to_list(test_list, move)
            return True
        except Exception as e:
            print(f"Move validation failed: {e}")
            return False
    
    def optimize_moves(self, moves: List[PlaylistMove]) -> List[PlaylistMove]:
        """
        Optimizes a list of moves by combining adjacent operations where possible.
        """
        if len(moves) <= 1:
            return moves
        
        optimized = []
        i = 0
        
        while i < len(moves):
            current_move = moves[i]
            
            # Try to combine with next move if they're adjacent
            if i + 1 < len(moves):
                next_move = moves[i + 1]
                combined = self._try_combine_moves(current_move, next_move)
                if combined:
                    optimized.append(combined)
                    i += 2  # Skip both moves
                    continue
            
            optimized.append(current_move)
            i += 1
        
        return optimized
    
    def _try_combine_moves(self, move1: PlaylistMove, move2: PlaylistMove) -> PlaylistMove | None:
        """
        Attempts to combine two moves into a single operation.
        Returns None if moves cannot be combined.
        """
        # For now, only combine moves that are moving adjacent ranges
        if (move1.range_start + move1.range_length == move2.range_start and
            move1.insert_before == move2.insert_before):
            return PlaylistMove(
                range_start=move1.range_start,
                insert_before=move1.insert_before,
                range_length=move1.range_length + move2.range_length
            )
        
        return None


# Convenience function for easy usage
def calculate_playlist_reorder_strategy(original_order: List[str], new_order: List[str]) -> Dict[str, Any]:
    """
    Convenience function to calculate the best reordering strategy.
    """
    calculator = IntelligentReorderCalculator()
    return calculator.calculate_reorder_strategy(original_order, new_order)
