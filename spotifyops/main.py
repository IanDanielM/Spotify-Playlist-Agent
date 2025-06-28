import asyncio

import langchain_core
from langchain_community.cache import SQLiteCache
from logic.embedding_store import VectorMemory
from logic.reorder_logic import sequence_playlist

from spotifyops.agent.playlist_agent import DrakePlaylistAgent
from spotifyops.tools.spotify import SpotifyPlaylistOps

langchain_core.globals.set_llm_cache(SQLiteCache(database_path=".langchain.db"))

ANALYSIS_FILE = "song_analyses.json"

async def main():
    spotify_ops = SpotifyPlaylistOps()
    memory = VectorMemory()
    agent = DrakePlaylistAgent()

    playlist_id = await spotify_ops.get_user_playlists("Best Drake Songs")
    tracks = await spotify_ops.get_playlist_tracks(playlist_id)
    print(f"Found {len(tracks)} tracks in the playlist.")

    all_song_analyses = {}

    for track in tracks:
        track_id = track['track_id']
        existing_analysis = memory.get_existing_analysis(track_id)
        if existing_analysis:
            print(f"Skipping '{track['name']}', '{track['track_id']}' analysis found in Vector Memory.")
            all_song_analyses[track_id] = existing_analysis
            continue
        
        print(f"Analyzing: '{track['name']}' by {track['artist']}")
        analysis = agent.analyze_song(song_name=track['name'], artist_name=track['artist'])
        if 'error' not in analysis:
            all_song_analyses[track_id] = {
                "track_info": track,
                "analysis": analysis
            }
            memory.add_song_analysis(track_info=track, analysis=analysis)
            print(f"Successfully Analyzed and Memorized: '{track['name']}'")
        else:
            print(f"Agent returned an error for '{track['name']}': {analysis.get('raw_output')}")

    final_analyses_list = list(all_song_analyses.values())
    ordered_track_ids = sequence_playlist(final_analyses_list)

    if ordered_track_ids:
        print("Proceeding to update the Spotify playlist...")
        success = await spotify_ops.update_playlist_track_order(playlist_id, ordered_track_ids)
        if success:
            print("Playlist reordering complete!")
        else:
            print("Playlist reordering failed.")
    else:
        print("Could not determine the final playlist order.")


if __name__ == "__main__":
    asyncio.run(main())