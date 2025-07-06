import httpx
from dotenv import load_dotenv

from spotifyops.config.config import Config
from spotifyops.database.models import User

load_dotenv()


class SpotifyPlaylistOps:
    """
    A class to handle Spotify playlist operations.
    """
    def __init__(self, user: User):
        self.base_url = Config.BASE_URL
        self.user = user

    async def get_access_token(self):
        try:
            access_token, refresh_token = self.user.get_tokens()
        except ValueError as e:
            # Tokens are invalid - return None to trigger re-authentication
            print(f"Token retrieval failed: {e}")
            return None
        
        # Check if the token is expired, and refresh if necessary
        async with httpx.AsyncClient() as client:
            headers = {'Authorization': f'Bearer {access_token}'}
            response = await client.get(f"{self.base_url}/v1/me", headers=headers)
            if response.status_code == 401:
                new_access_token = await self.refresh_access_token(refresh_token)
                if new_access_token:
                    self.user.set_tokens(new_access_token, refresh_token)
                    return new_access_token
                else:
                    return None
            return access_token

    async def refresh_access_token(self, refresh_token: str):
        payload = {
            "grant_type": 'refresh_token',
            "refresh_token": refresh_token,
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                Config.TOKEN_URL,
                data=payload,
                headers=Config.get_headers())

        res = response.json()
        return res.get('access_token')

    async def get_headers(self):
        access_token = await self.get_access_token()
        if not access_token:
            return None
        return {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

    async def get_user_playlists(self):
        headers = await self.get_headers()
        if not headers:
            return None
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/v1/me/playlists",
                headers=headers
            )
        return response.json()

    async def get_playlist_tracks(self, playlist_id):
        headers = await self.get_headers()
        if not headers:
            return []
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
        if not headers or not track_ids:
            print("No track IDs provided or authentication failed.")
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
        if not headers or not track_ids:
            print("No track IDs provided or authentication failed.")
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

    async def reorder_playlist_tracks(self, playlist_id: str, range_start: int, insert_before: int, range_length: int = 1):
        """
        Reorders tracks in a playlist using Spotify's range-based API.
        More efficient for small changes.
        
        :param playlist_id: The ID of the playlist to update
        :param range_start: The position of the first item to be reordered
        :param insert_before: The position where the items should be inserted
        :param range_length: The amount of items to be reordered (defaults to 1)
        """
        headers = await self.get_headers()
        if not headers:
            print("Authentication failed.")
            return False

        payload = {
            "range_start": range_start,
            "insert_before": insert_before,
            "range_length": range_length
        }
        
        print(f"Moving {range_length} track(s) from position {range_start} to before position {insert_before}")

        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{self.base_url}/v1/playlists/{playlist_id}/tracks",
                headers=headers,
                json=payload
            )

        if response.status_code == 200:
            print(f"Successfully reordered tracks in playlist {playlist_id}")
            return True
        else:
            print(f"Failed to reorder tracks. Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    async def apply_intelligent_reorder(self, playlist_id: str, moves: list):
        """
        Applies a series of intelligent moves to reorder a playlist.
        
        :param playlist_id: The ID of the playlist to update
        :param moves: List of PlaylistMove objects
        """
        print(f"Applying {len(moves)} intelligent moves to playlist {playlist_id}...")
        
        success_count = 0
        for i, move in enumerate(moves):
            print(f"Move {i+1}/{len(moves)}: {move}")
            
            success = await self.reorder_playlist_tracks(
                playlist_id=playlist_id,
                range_start=move.range_start,
                insert_before=move.insert_before,
                range_length=move.range_length
            )
            
            if success:
                success_count += 1
            else:
                print(f"Failed to apply move {i+1}, stopping reorder process")
                return False
        
        print(f"Successfully applied {success_count}/{len(moves)} moves")
        return success_count == len(moves)

    async def get_current_playlist_order(self, playlist_id: str) -> list:
        """
        Gets the current track order of a playlist.
        
        :param playlist_id: The ID of the playlist
        :return: List of track IDs in current order
        """
        tracks = await self.get_playlist_tracks(playlist_id)
        return [track['track_id'] for track in tracks] if tracks else []

