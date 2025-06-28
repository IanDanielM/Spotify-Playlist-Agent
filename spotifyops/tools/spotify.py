import httpx
from dotenv import load_dotenv

from spotifyops.config.config import Config

load_dotenv()


class SpotifyPlaylistOps:
    """
    A class to handle Spotify playlist operations.
    """
    def __init__(self):
        self.base_url = Config.BASE_URL
    
    async def get_access_token(self):
        credentials = Config.spotify_credentials()
        payload = {
            "grant_type": 'refresh_token',
            "refresh_token": credentials[1],
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                Config.TOKEN_URL,
                data=payload,
                headers=Config.get_headers())

        res = response.json()
        access_token = res.get('access_token')
        return access_token
    
    async def get_headers(self):
        access_token = await self.get_access_token()
        return {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
    
    async def get_user_playlists(self, playlist_name):
        headers = await self.get_headers()
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/v1/me/playlists",
                headers=headers
            )
        for item in response.json().get('items', []):
            name = item['name']
            if playlist_name.lower() == name.lower():
                return item['id']
        print(f"Playlist '{playlist_name}' not found.")
        return None
                    
    
    async def get_playlist_tracks(self, playlist_id):
        headers = await self.get_headers()
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/v1/playlists/{playlist_id}/tracks",
                headers=headers
            )
        index = 0
        playlist_tracks = []
        for res in response.json().get('items', []):
            index += 1
            track_id = res['track']['id']
            name = res['track']['name']
            artist = [names for names in res['track']['artists']]
            artist = ', '.join([a['name'] for a in artist])
            album = res['track']['album']['name'] if 'album' in res['track'] else 'Unknown Album'
            popularity = res['track'].get('popularity', 'Unknown Popularity')
            

            playlist_tracks.append({
                'track_id': track_id,
                'name': name,
                'artist': artist,
                'album_name': album,
                'popularity': popularity    
            })
        return playlist_tracks

    async def update_playlist_track_order(self, playlist_id: str, track_ids: list):
        """
        Updates the order of tracks in a Spotify playlist.
        :param playlist_id: The ID of the playlist to update.
        :param track_ids: A list of track IDs in the desired order.
        """
        headers = await self.get_headers()
        if not track_ids:
            print("No track IDs provided to update the playlist.")
            return

        chunk_size = 100
        success = True
        
        for i in range(0, len(track_ids), chunk_size):
            chunk = track_ids[i:i + chunk_size]
            uris_to_set = [f"spotify:track:{track_id}" for track_id in chunk]
            payload = {
                "uris": uris_to_set,
            }
            print(f"Updating playlist {playlist_id} with tracks {i+1}-{min(i+chunk_size, len(track_ids))} of {len(track_ids)}...")

            async with httpx.AsyncClient() as client:
                if i == 0:
                    response = await client.put(
                        f"{self.base_url}/v1/playlists/{playlist_id}/tracks",
                        headers=headers,
                        json=payload
                    )
                else:
                    response = await client.post(
                        f"{self.base_url}/v1/playlists/{playlist_id}/tracks",
                        headers=headers,
                        json=payload
                    )
            
            if response.status_code not in [200, 201]:
                print(f"Failed to update playlist {playlist_id} chunk {i//chunk_size + 1}. Status code: {response.status_code}")
                print(f"Response: {response.text}")
                success = False
                break

        if success:
            print(f"Successfully updated playlist {playlist_id} with {len(track_ids)} tracks.")
            return True
        else:
            return False

    async def add_tracks_to_playlist(self, playlist_id: str, track_ids: list):
        """
        Adds a multiple tracks to a Spotify playlist.
        :param playlist_id: The ID of the playlist to update.
        :param track_id: The ID of the track to add.
        """
        headers = await self.get_headers()
        if not track_ids:
            print("No track IDs provided to add to the playlist.")
            return False

        uris_to_add = [f"spotify:track:{track_id}" for track_id in track_ids]
        payload = {
            "uris": uris_to_add,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/v1/playlists/{playlist_id}/tracks",
                headers=headers,
                json=payload
            )

        if response.status_code in [200, 201]:
            print(f"Successfully added {len(track_ids)} tracks to playlist {playlist_id}.")
            return True
        else:
            print(f"Failed to add tracks to playlist {playlist_id}. Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False

        