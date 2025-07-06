#!/usr/bin/env python3

import sys
sys.path.append('/home/ian/myspotifyagent')

from dotenv import load_dotenv
load_dotenv()

from spotifyops.logic.hierarchical_reorder import HierarchicalPlaylistAgent

def test_track_preservation():
    """Test that no tracks are lost during hierarchical reordering"""
    print("Testing track preservation...")
    
    # Create test data with more tracks to simulate the real scenario
    test_analyses = []
    for i in range(1, 11):  # 10 tracks
        test_analyses.append({
            "track_info": {
                "track_id": f"track{i}", 
                "name": f"Song {i}", 
                "artist": f"Artist {i}"
            },
            "analysis": {
                "narrative_category": "Introspection/Personal Struggle" if i % 2 == 0 else "Longing/Heartbreak",
                "emotional_tone": "Melancholic" if i % 3 == 0 else "Reflective"
            }
        })
    
    try:
        agent = HierarchicalPlaylistAgent()
        print("✓ Agent created successfully")
        
        # Test hierarchical reordering
        result = agent.sequence_playlist(
            test_analyses,
            reorder_style="emotional_journey",
            user_intent="Create a cohesive emotional experience",
            personal_tone="Introspective and thoughtful"
        )
        
        # Validate results
        original_ids = {item["track_info"]["track_id"] for item in test_analyses}
        result_ids = set(result)
        
        print(f"\nValidation Results:")
        print(f"  Original tracks: {len(original_ids)}")
        print(f"  Result tracks: {len(result_ids)}")
        print(f"  Missing: {original_ids - result_ids}")
        print(f"  Extra: {result_ids - original_ids}")
        
        if original_ids == result_ids:
            print("✓ Track preservation test PASSED")
            return True
        else:
            print("❌ Track preservation test FAILED")
            return False
            
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_track_preservation()
    sys.exit(0 if success else 1)
