"""
Test script for the hierarchical playlist reordering system.
"""

from spotifyops.logic.hierarchical_reorder import HierarchicalPlaylistAgent


def create_mock_song_analysis(track_id: str, name: str, artist: str = "Test Artist", category: str = "test") -> dict:
    """Creates a mock song analysis for testing."""
    return {
        "track_info": {
            "track_id": track_id,
            "name": name,
            "artist": artist
        },
        "analysis": {
            "narrative_category": category
        }
    }


def test_hierarchical_reordering():
    """Test the hierarchical reordering with a mock playlist."""
    
    # Create a test playlist with various categories
    test_songs = [
        create_mock_song_analysis("track_1", "Humble Beginnings", category="ambition"),
        create_mock_song_analysis("track_2", "First Success", category="wealth"),
        create_mock_song_analysis("track_3", "Fame Game", category="celebrity"),
        create_mock_song_analysis("track_4", "Heartbreak Hotel", category="relationships"),
        create_mock_song_analysis("track_5", "Enemies", category="rivalry"),
        create_mock_song_analysis("track_6", "Looking Back", category="introspection"),
        create_mock_song_analysis("track_7", "Money Dreams", category="wealth"),
        create_mock_song_analysis("track_8", "Pressure", category="celebrity"),
        create_mock_song_analysis("track_9", "Lost Love", category="relationships"),
        create_mock_song_analysis("track_10", "Final Thoughts", category="introspection"),
        create_mock_song_analysis("track_11", "Start Small", category="ambition"),
        create_mock_song_analysis("track_12", "War", category="rivalry"),
        create_mock_song_analysis("track_13", "Golden", category="wealth"),
        create_mock_song_analysis("track_14", "Spotlight", category="celebrity"),
        create_mock_song_analysis("track_15", "Broken", category="relationships"),
        create_mock_song_analysis("track_16", "Legacy", category="introspection"),
        create_mock_song_analysis("track_17", "Grinding", category="ambition"),
        create_mock_song_analysis("track_18", "Rich Life", category="wealth"),
        create_mock_song_analysis("track_19", "Famous", category="celebrity"),
        create_mock_song_analysis("track_20", "Heart Empty", category="relationships"),
    ]
    
    print(f"Testing hierarchical reordering with {len(test_songs)} tracks...")
    
    agent = HierarchicalPlaylistAgent()
    
    # Test with user intent and personal tone
    result = agent.sequence_playlist(
        song_analyses=test_songs,
        reorder_style="narrative_arc",
        user_intent="Create an emotional journey from struggle to success to reflection",
        personal_tone="I prefer stories that build up slowly and have meaningful endings"
    )
    
    print(f"\nResult: {len(result)} tracks returned")
    print("Track order:", result)
    
    # Validate no tracks were lost
    original_ids = {song["track_info"]["track_id"] for song in test_songs}
    result_ids = set(result)
    
    if original_ids == result_ids:
        print("✅ All tracks preserved!")
    else:
        print("❌ Track validation failed!")
        print(f"Missing: {original_ids - result_ids}")
        print(f"Extra: {result_ids - original_ids}")
    
    return result


if __name__ == "__main__":
    test_hierarchical_reordering()
