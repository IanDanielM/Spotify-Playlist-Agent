import lyricsgenius
from spotifyops.config.config import Config
from langchain.tools import tool
import json

@tool
def get_song_lyrics(input_data) -> str:
    """
    You MUST use this tool first for every song. It fetches the lyrics for a given song by a specific artist. 
    Input should be a JSON object with 'artist_name' and 'song_name' keys.
    Example: {"artist_name": "Drake", "song_name": "GIMME A HUG"}
    """
    try:
        if isinstance(input_data, str):
            if (input_data.startswith("'") and input_data.endswith("'")) or \
               (input_data.startswith('"') and input_data.endswith('"')):
                input_data = input_data[1:-1]
            data = json.loads(input_data)
        elif isinstance(input_data, dict):
            data = input_data
        else:
            return f"Error: Input must be a JSON string or dictionary, got {type(input_data)}"
        
        artist_name = data['artist_name']
        song_name = data['song_name']
        
        genius = lyricsgenius.Genius(Config.GENIUS_ACCESS_TOKEN, verbose=False, remove_section_headers=True)
        song = genius.search_song(song_name, artist_name)
        
        if song:
            lyrics = song.lyrics.replace("EmbedShare URLCopyEmbedCopy", "").strip()
            return lyrics
        else:
            return f"Error: Lyrics for '{song_name}' by '{artist_name}' not found."
    except json.JSONDecodeError as e:
        return f"Error: Invalid JSON input. Please provide valid JSON. Error: {e}"
    except KeyError as e:
        return f"Error: Missing required key {e}. Please provide both 'artist_name' and 'song_name'."
    except Exception as e:
        return f"Error: An exception occurred while fetching lyrics: {e}"