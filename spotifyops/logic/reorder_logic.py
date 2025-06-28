import json
from langchain_openai import ChatOpenAI
from langchain_deepseek import ChatDeepSeek


def sequence_playlist(song_analyses: list) -> list[str]:
    """
    Takes a list of song analyses and uses an LLM to determine the best
    narrative order.
    """
    if not song_analyses:
        return []

    llm = ChatDeepSeek(model="deepseek-chat", temperature=0.0)

    formatted_songs = []
    for item in song_analyses:
        essential_info = {
            "track_id": item["track_info"]["track_id"],
            "name": item["track_info"]["name"],
            "narrative_category": item["analysis"]["narrative_category"],
        }
        formatted_songs.append(essential_info)

    formatted_data = json.dumps(formatted_songs, indent=2)

    master_prompt_template = """
    You are an expert music curator and storyteller, tasked with arranging a playlist that tells the complete narrative arc
    You will be given a list of songs, each with a `track_id`, name, and narrative_category
    Your goal is to reorder these songs to create a cohesive story. A good narrative flows through these general phases:
    1. Early Ambition & The Come-Up
    2. First Taste of Fame & Newfound Wealth
    3. Peak Celebrity & Its Pressures
    4. Relationships & Heartbreak
    5. Rivalry & Conflict
    6. Introspection & Legacy

    Please arrange the provided songs to follow this narrative arc.

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
    
    final_prompt = master_prompt_template.format(song_data=formatted_data)

    content = ""
    try:
        response = llm.invoke(final_prompt)
        content = response.content.strip()
    
        if content.startswith('```'):
            content = content.split('\n', 1)[1]
        if content.endswith('```'):
            content = content.rsplit('\n', 1)[0]
        
        print(f"LLM Response: {content}")
        
        track_ids = content.strip().split(',')
        track_ids = list(set(track_ids))

        print(f"--- Returning {len(track_ids)} track IDs ---")
        return track_ids
        
    except json.JSONDecodeError as e:
        print(f"Error parsing sequencer response: {e} ---")
        print(f"Raw response was: {content}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred during sequencing: {e}")
        return []