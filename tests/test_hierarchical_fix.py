#!/usr/bin/env python3

import sys
sys.path.append('/home/ian/myspotifyagent')

from dotenv import load_dotenv
load_dotenv()

from spotifyops.logic.hierarchical_reorder import HierarchicalPlaylistAgent

# Test data
test_analyses = [
    {
        "track_info": {"track_id": "track1", "name": "Song 1", "artist": "Artist 1"},
        "analysis": {"narrative_category": "opening", "energy_level": 3}
    },
    {
        "track_info": {"track_id": "track2", "name": "Song 2", "artist": "Artist 2"},
        "analysis": {"narrative_category": "buildup", "energy_level": 5}
    },
    {
        "track_info": {"track_id": "track3", "name": "Song 3", "artist": "Artist 3"},
        "analysis": {"narrative_category": "climax", "energy_level": 8}
    }
]

def test_hierarchical_agent():
    print("Testing HierarchicalPlaylistAgent...")
    
    try:
        agent = HierarchicalPlaylistAgent()
        print("✓ Agent created successfully")
        
        result = agent.sequence_playlist(
            test_analyses, 
            reorder_style="emotional_journey",
            user_intent="Create an emotional arc",
            personal_tone="dramatic and intense"
        )
        
        print(f"✓ Result: {result}")
        print("✓ Test passed!")
        return True
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_hierarchical_agent()
    sys.exit(0 if success else 1)
