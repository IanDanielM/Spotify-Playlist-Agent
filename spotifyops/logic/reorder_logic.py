import json
from typing import Optional
from langchain_openai import ChatOpenAI
from langchain_deepseek import ChatDeepSeek
from .hierarchical_reorder import HierarchicalPlaylistAgent


def sequence_playlist(song_analyses: list, reorder_style: Optional[str] = None, user_intent: Optional[str] = None, personal_tone: Optional[str] = None) -> list[str]:
    """
    Main playlist sequencing function with hierarchical approach as default.
    Falls back to single-LLM approach for small playlists or if hierarchical fails.
    """
    if not song_analyses:
        return []

    print(f"Sequencing playlist with {len(song_analyses)} tracks...")
    
    # Use hierarchical approach for larger playlists or if user intent/tone provided
    if len(song_analyses) > 15 or user_intent or personal_tone:
        print("Using hierarchical agent approach...")
        try:
            agent = HierarchicalPlaylistAgent()
            result = agent.sequence_playlist(song_analyses, reorder_style, user_intent, personal_tone)
            if result and len(result) == len(song_analyses):
                return result
            else:
                print("Hierarchical approach failed, falling back to single-LLM...")
        except Exception as e:
            print(f"Hierarchical approach error: {e}, falling back to single-LLM...")
    
    # Fallback to original single-LLM approach for smaller playlists
    print("Using single-LLM approach...")
    return _sequence_playlist_single_llm(song_analyses, reorder_style, user_intent, personal_tone)



def _sequence_playlist_single_llm(song_analyses: list, reorder_style: Optional[str] = None, user_intent: Optional[str] = None, personal_tone: Optional[str] = None) -> list[str]:
    """
    Original single-LLM approach for smaller playlists or fallback.
    Takes a list of song analyses and uses an LLM to determine the best
    narrative order based on user preferences.
    """
    if not song_analyses:
        return []

    llm = ChatDeepSeek(model="deepseek-chat", temperature=0.0)

    formatted_songs = []
    for item in song_analyses:
        analysis = item["analysis"]
        
        # Handle different analysis structures
        narrative_category = (
            analysis.get("narrative_category") or 
            analysis.get("narrative_category_basic") or
            analysis.get("emotional_tone", "Unknown")
        )
        
        essential_info = {
            "track_id": item["track_info"]["track_id"],
            "name": item["track_info"]["name"],
            "narrative_category": narrative_category,
        }
        formatted_songs.append(essential_info)

    formatted_data = json.dumps(formatted_songs, indent=2)

    # Build dynamic prompt based on user preferences
    base_prompt = """
    You are an expert music curator and storyteller, tasked with arranging a playlist to create the perfect listening experience.
    You will be given a list of songs, each with a `track_id`, name, and narrative_category.
    """
    
    # Add user intent if provided
    if user_intent:
        base_prompt += f"\n\nUSER'S GOAL: {user_intent}"
    
    # Add personal tone if provided
    if personal_tone:
        base_prompt += f"\n\nUSER'S PERSONAL STYLE: {personal_tone}"
    
    # Add reorder style guidance
    style_guidance = ""
    if reorder_style == "emotional_journey":
        style_guidance = "\nCreate an emotional progression that takes the listener on a journey from one feeling to another."
    elif reorder_style == "energy_flow":
        style_guidance = "\nArrange the songs to create a dynamic energy flow - building up, maintaining momentum, and providing satisfying transitions."
    elif reorder_style == "narrative_arc":
        style_guidance = "\nTell a complete story through the music, following a narrative structure with beginning, development, and resolution."
    elif reorder_style == "vibe_matching":
        style_guidance = "\nGroup songs with similar vibes and moods together while creating smooth transitions between different mood sections."
    
    base_prompt += style_guidance
    
    # Default narrative structure if no specific intent provided
    if not user_intent:
        base_prompt += """
        
        Your goal is to reorder these songs to create a cohesive story. A good narrative flows through these general phases:
        1. Early Ambition & The Come-Up
        2. First Taste of Fame & Newfound Wealth
        3. Peak Celebrity & Its Pressures
        4. Relationships & Heartbreak
        5. Rivalry & Conflict
        6. Introspection & Legacy
        """
    
    final_instructions = """
    
    **CRITICAL OUTPUT INSTRUCTIONS:**
    Your final output MUST be only a single line of comma-separated string values of the `track_id`s. DO NOT use JSON. DO NOT use spaces.
    - DO NOT use indices.
    - DO NOT add any commentary or explanation.
    - DO NOT wrap the output in markdown code blocks.
    - Return ALL track ids provided with no omissions or duplicates.

    ** BEFORE GIVING THE OUTPUT, CHECK THE NUMBER OF THE TRACK IDs ENTERED AND MAKE SURE THEY MATCH THE NUMBER OF TRACK IDs IN YOUR OUTPUT. **
    SO IF YOU ARE GIVEN 3 TRACK IDs, YOUR OUTPUT MUST CONTAIN 3 TRACK IDs.

    Example of a PERFECT output:
    4oI22y9hsy5iAC2c34SsoW,7k6IzwMGpxnRghE7YosnXT,3GgP22y9hsy5iAC2c34SsoZ

    Here are the songs to sequence:
    [{song_data}]
    """
    
    master_prompt_template = base_prompt + final_instructions
    final_prompt = master_prompt_template.format(song_data=formatted_data)

    content = ""
    try:
        response = llm.invoke(final_prompt)
        # Handle different response types from LangChain
        content = response.content if isinstance(response.content, str) else str(response.content)
        content = content.strip()
    
        if content.startswith('```'):
            content = content.split('\n', 1)[1]
        if content.endswith('```'):
            content = content.rsplit('\n', 1)[0]
        
        print(f"LLM Response: {content}")
        
        track_ids = content.strip().split(',')
        track_ids = [tid.strip() for tid in track_ids if tid.strip()]  # Remove empty strings
        track_ids = list(dict.fromkeys(track_ids))  # Remove duplicates while preserving order
        
        # Validation: Check if we have all original tracks
        original_ids = {item["track_info"]["track_id"] for item in song_analyses}
        returned_ids = set(track_ids)
        
        if len(track_ids) != len(song_analyses):
            print(f"❌ Track count mismatch! Expected: {len(song_analyses)}, Got: {len(track_ids)}")
        
        if original_ids != returned_ids:
            missing = original_ids - returned_ids
            extra = returned_ids - original_ids
            if missing:
                print(f"❌ Missing tracks: {missing}")
            if extra:
                print(f"❌ Extra tracks: {extra}")
            
            # Try to fix by adding missing tracks at the end
            for missing_id in missing:
                if missing_id not in track_ids:
                    track_ids.append(missing_id)
                    print(f"✅ Added missing track: {missing_id}")
        
        print(f"--- Returning {len(track_ids)} track IDs (original: {len(song_analyses)}) ---")
        return track_ids
        
    except json.JSONDecodeError as e:
        print(f"Error parsing sequencer response: {e} ---")
        print(f"Raw response was: {content}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred during sequencing: {e}")
        return []