import json
import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from langchain_deepseek import ChatDeepSeek

# Load environment variables
load_dotenv()


class HierarchicalPlaylistAgent:
    """
    Agentic playlist reordering system that uses hierarchical chunking
    to handle playlists of any size without losing tracks.
    """
    
    def __init__(self):
        self.llm = ChatDeepSeek(model="deepseek-chat")

    def sequence_playlist(self, song_analyses: List[Dict], reorder_style: Optional[str] = None,
                         user_intent: Optional[str] = None, personal_tone: Optional[str] = None) -> List[str]:
        """
        Main entry point for hierarchical playlist reordering.
        """
        if not song_analyses:
            return []
        
        print(f"Starting hierarchical reordering for {len(song_analyses)} tracks")
        
        # Step 1: Categorize songs into narrative phases
        categories = self._categorize_songs(song_analyses, reorder_style, user_intent, personal_tone)
        
        # Step 2: Order songs within each category
        ordered_categories = self._order_within_categories(categories, reorder_style, user_intent, personal_tone)
        
        # Step 3: Determine category order and transitions
        final_sequence = self._assemble_final_sequence(ordered_categories, reorder_style, user_intent, personal_tone)
        
        # Step 4: Validate we have all tracks
        original_ids = {item["track_info"]["track_id"] for item in song_analyses}
        final_ids = set(final_sequence)
        
        if original_ids != final_ids or len(final_sequence) != len(song_analyses):
            print(f"WARNING: Track validation failed!")
            print(f"  Original: {len(original_ids)} unique tracks, {len(song_analyses)} total")
            print(f"  Final: {len(final_ids)} unique tracks, {len(final_sequence)} total")
            print(f"  Missing: {original_ids - final_ids}")
            print(f"  Extra: {final_ids - original_ids}")
            
            # Clean up the sequence to match exactly
            # 1. Remove any tracks not in original
            cleaned_sequence = [tid for tid in final_sequence if tid in original_ids]
            
            # 2. Add any missing tracks
            seen = set(cleaned_sequence)
            missing = original_ids - seen
            if missing:
                print(f"  Adding {len(missing)} missing tracks")
                cleaned_sequence.extend(list(missing))
            
            # 3. Remove duplicates while preserving order
            final_sequence = []
            seen = set()
            for track_id in cleaned_sequence:
                if track_id not in seen:
                    final_sequence.append(track_id)
                    seen.add(track_id)
            
            # Final validation
            final_ids = set(final_sequence)
            if original_ids == final_ids and len(final_sequence) == len(song_analyses):
                print(f"  ✓ Successfully cleaned sequence: {len(final_sequence)} tracks")
            else:
                print(f"  ❌ Could not fix sequence! Falling back to original order")
                return [item["track_info"]["track_id"] for item in song_analyses]
        
        print(f"✅ Successfully reordered {len(final_sequence)} tracks")
        return final_sequence
    
    def _categorize_songs(self, song_analyses: List[Dict], reorder_style: Optional[str], 
                         user_intent: Optional[str], personal_tone: Optional[str]) -> Dict[str, List[Dict]]:
        """
        Agent 1: Categorizes songs into narrative phases/buckets.
        """
        print("🏷️  Categorizing songs into narrative phases...")
        
        # Prepare song data for categorization
        songs_for_categorization = []
        for item in song_analyses:
            song_info = {
                "track_id": item["track_info"]["track_id"],
                "name": item["track_info"]["name"],
                "artist": item["track_info"]["artist"],
                "narrative_category": item["analysis"]["narrative_category"]
            }
            songs_for_categorization.append(song_info)
        
        # Build categorization prompt
        prompt = self._build_categorization_prompt(songs_for_categorization, reorder_style, user_intent, personal_tone)
        
        try:
            response = self.llm.invoke(prompt)
            # Handle different response types from LangChain
            content = response.content if isinstance(response.content, str) else str(response.content)
            categorization = self._parse_categorization_response(content, song_analyses)
            
            # Log categorization results
            for category, songs in categorization.items():
                print(f"  {category}: {len(songs)} tracks")
            
            return categorization
            
        except Exception as e:
            print(f"Error in categorization: {e}")
            # Fallback: simple equal distribution
            return self._fallback_categorization(song_analyses)
    
    def _build_categorization_prompt(self, songs: List[Dict], reorder_style: Optional[str], 
                                   user_intent: Optional[str], personal_tone: Optional[str]) -> str:
        """
        Builds the prompt for the categorization agent.
        """
        songs_json = json.dumps(songs, indent=2)
        
        base_prompt = f"""You are a music categorization expert. Your job is to group songs into 4-5 narrative phases that will create the perfect listening experience.

SONGS TO CATEGORIZE:
{songs_json}

CATEGORIZATION RULES:
1. Create 4-5 categories that make sense for the listening experience
2. Each song MUST be assigned to exactly one category
3. Categories should follow a logical progression (beginning → middle → end)
4. Consider energy levels, emotions, and narrative flow
"""
        
        if user_intent:
            base_prompt += f"\nUSER'S GOAL: {user_intent}"
        
        if personal_tone:
            base_prompt += f"\nUSER'S STYLE: {personal_tone}"
        
        # Add style-specific guidance
        if reorder_style == "energy_flow":
            base_prompt += "\nFOCUS: Create categories based on energy levels (low → high → peak → cooldown)"
        elif reorder_style == "emotional_journey":
            base_prompt += "\nFOCUS: Create categories based on emotional progression (intro → buildup → climax → resolution)"
        elif reorder_style == "narrative_arc":
            base_prompt += "\nFOCUS: Create categories that tell a complete story with clear chapters"
        else:
            base_prompt += "\nFOCUS: Create categories that group similar vibes while maintaining flow"
        
        base_prompt += """

OUTPUT FORMAT:
You MUST respond with ONLY a valid JSON object. No other text, no explanations, no markdown formatting.
The JSON should have category names as keys and arrays of track_ids as values.

Example response (using different track IDs):
{"Opening": ["abc123", "def456"], "Building_Energy": ["ghi789"], "Peak_Moments": ["jkl012"], "Resolution": ["mno345"]}

CRITICAL: 
1. Every track_id from the input MUST appear exactly once in the output
2. Respond with ONLY the JSON object
3. Do not use markdown code blocks
4. Ensure the JSON is valid"""
        
        return base_prompt
    
    def _parse_categorization_response(self, response: str, song_analyses: List[Dict]) -> Dict[str, List[Dict]]:
        """
        Parses the categorization response and maps back to full song data.
        """
        print(f"LLM Response: '{response[:100]}...'")  # Debug: show first 100 chars
        
        # Clean up response
        response = response.strip()
        if not response:
            print("Empty response from LLM")
            raise ValueError("Empty response from LLM")
            
        if response.startswith('```json'):
            response = response[7:]
        if response.endswith('```'):
            response = response[:-3]
        if response.startswith('```'):
            response = response[3:]
        
        response = response.strip()
        
        try:
            categorization_data = json.loads(response)
        except json.JSONDecodeError as e:
            print(f"Failed to parse categorization JSON: {e}")
            print(f"Raw response: '{response}'")
            raise
        
        # Validate that we have a dictionary
        if not isinstance(categorization_data, dict):
            print(f"Expected dict, got {type(categorization_data)}")
            raise ValueError(f"Expected dict, got {type(categorization_data)}")
        
        # Create lookup for song analyses by track_id
        song_lookup = {item["track_info"]["track_id"]: item for item in song_analyses}
        
        # Map track_ids back to full song data
        categorized_songs = {}
        for category, track_ids in categorization_data.items():
            categorized_songs[category] = []
            if not isinstance(track_ids, list):
                print(f"Warning: Expected list for category {category}, got {type(track_ids)}")
                continue
                
            for track_id in track_ids:
                # Clean and validate track ID
                if isinstance(track_id, str):
                    cleaned_id = track_id.strip().strip('"\'')
                    # Validate Spotify track ID format
                    if len(cleaned_id) == 22 and cleaned_id.replace('_', '').replace('-', '').isalnum():
                        if cleaned_id in song_lookup:
                            categorized_songs[category].append(song_lookup[cleaned_id])
                        else:
                            print(f"Warning: track_id {cleaned_id} not found in original data")
                    else:
                        print(f"Warning: Invalid track_id format: '{cleaned_id}' in category {category}")
                else:
                    print(f"Warning: Expected string track_id, got {type(track_id)} in category {category}")
        
        # Validate that all tracks are categorized and none are duplicated
        all_categorized_ids = set()
        for category, songs in categorized_songs.items():
            category_ids = {song["track_info"]["track_id"] for song in songs}
            all_categorized_ids.update(category_ids)
        
        original_ids = {song["track_info"]["track_id"] for song in song_analyses}
        
        if all_categorized_ids != original_ids:
            print(f"⚠ Categorization validation failed!")
            print(f"  Original: {len(original_ids)} tracks")
            print(f"  Categorized: {len(all_categorized_ids)} tracks")
            print(f"  Missing: {original_ids - all_categorized_ids}")
            print(f"  Extra: {all_categorized_ids - original_ids}")
            
            # Add missing tracks to a default category
            missing_tracks = original_ids - all_categorized_ids
            if missing_tracks:
                print(f"  Adding {len(missing_tracks)} missing tracks to 'Uncategorized'")
                if "Uncategorized" not in categorized_songs:
                    categorized_songs["Uncategorized"] = []
                
                song_lookup = {song["track_info"]["track_id"]: song for song in song_analyses}
                for track_id in missing_tracks:
                    if track_id in song_lookup:
                        categorized_songs["Uncategorized"].append(song_lookup[track_id])
        
        return categorized_songs
    
    def _order_within_categories(self, categories: Dict[str, List[Dict]], reorder_style: Optional[str],
                                user_intent: Optional[str], personal_tone: Optional[str]) -> Dict[str, List[str]]:
        """
        Agent 2: Orders songs within each category.
        """
        print("🔄 Ordering songs within each category...")
        
        ordered_categories = {}
        
        for category_name, songs in categories.items():
            if len(songs) <= 1:
                # Single song or empty category - no reordering needed
                ordered_categories[category_name] = [song["track_info"]["track_id"] for song in songs]
                continue
            
            print(f"  Ordering {len(songs)} songs in '{category_name}'...")
            
            # For small groups (2-8 songs), order directly
            if len(songs) <= 8:
                ordered_ids = self._order_small_group(songs, category_name, reorder_style, user_intent, personal_tone)
            else:
                # For larger groups, use recursive chunking
                ordered_ids = self._order_large_group(songs, category_name, reorder_style, user_intent, personal_tone)
            
            ordered_categories[category_name] = ordered_ids
        
        return ordered_categories
    
    def _order_small_group(self, songs: List[Dict], category_name: str, reorder_style: Optional[str],
                          user_intent: Optional[str], personal_tone: Optional[str]) -> List[str]:
        """
        Orders a small group of songs (2-8 tracks) using direct LLM ordering.
        """
        # Always return original order as fallback if anything goes wrong
        original_order = [song["track_info"]["track_id"] for song in songs]
        
        songs_data = []
        for song in songs:
            songs_data.append({
                "track_id": song["track_info"]["track_id"],
                "name": song["track_info"]["name"],
                "artist": song["track_info"]["artist"],
                "narrative_category": song["analysis"].get("narrative_category", "Unknown")
            })
        
        prompt = f"""You are ordering songs within the "{category_name}" section of a playlist.

SONGS TO ORDER:
{json.dumps(songs_data, indent=2)}

CONTEXT:
- This is the "{category_name}" section
- User Intent: {user_intent or 'Create the best listening experience'}
- User Style: {personal_tone or 'No specific style preferences'}
- Reorder Style: {reorder_style}

ORDER THESE SONGS to flow perfectly within this section. Consider energy progression, emotional flow, musical transitions, and narrative coherence.

CRITICAL INSTRUCTIONS:
1. Return ONLY a JSON array of track_ids
2. No explanations, no markdown, no additional text
3. Include ALL {len(songs)} track_ids exactly as provided
4. Example format: ["track_id_1", "track_id_2", "track_id_3"]

OUTPUT:"""
        
        try:
            response = self.llm.invoke(prompt)
            # Handle different response types from LangChain
            content = response.content if isinstance(response.content, str) else str(response.content)
            content = content.strip()
            
            # Clean up response - remove markdown code blocks
            if content.startswith('```json'):
                content = content[7:]
            elif content.startswith('```'):
                content = content[3:]
            
            if content.endswith('```'):
                content = content[:-3]
            
            content = content.strip()
            
            # Try to parse as JSON
            try:
                track_ids = json.loads(content)
                if not isinstance(track_ids, list):
                    print(f"  Warning: Expected list, got {type(track_ids)} for {category_name}")
                    return original_order
                    
            except json.JSONDecodeError:
                # Fallback: try comma-separated parsing
                if ',' in content:
                    # Split by comma and clean each ID
                    track_ids = []
                    for tid in content.split(','):
                        cleaned_tid = tid.strip().strip('"\'').strip()
                        # Only accept valid Spotify track ID format (22 alphanumeric characters)
                        if len(cleaned_tid) == 22 and cleaned_tid.isalnum():
                            track_ids.append(cleaned_tid)
                else:
                    print(f"  Warning: Could not parse response for {category_name}: {content[:100]}")
                    return original_order
            
            # Clean track IDs to ensure they're valid Spotify IDs
            clean_track_ids = []
            for tid in track_ids:
                if isinstance(tid, str):
                    cleaned = tid.strip().strip('"\'')
                    # Validate Spotify track ID format (22 characters, alphanumeric)
                    if len(cleaned) == 22 and cleaned.replace('_', '').replace('-', '').isalnum():
                        clean_track_ids.append(cleaned)
                    else:
                        print(f"  Warning: Invalid track ID format: '{cleaned}' in {category_name}")
            
            track_ids = clean_track_ids
            
            # Validate we got all tracks
            original_ids = set(original_order)
            returned_ids = set(track_ids)
            
            # Check for exact match
            if original_ids == returned_ids and len(track_ids) == len(songs):
                print(f"  ✓ Successfully ordered {len(track_ids)} tracks in {category_name}")
                return track_ids
            else:
                print(f"  Warning: Ordering validation failed for {category_name}")
                print(f"    Original: {len(original_ids)} tracks")
                print(f"    Returned: {len(returned_ids)} tracks")
                if len(original_ids - returned_ids) > 0:
                    print(f"    Missing: {original_ids - returned_ids}")
                if len(returned_ids - original_ids) > 0:
                    print(f"    Extra: {returned_ids - original_ids}")
                
                # Try to clean up the response - maybe it contains explanatory text
                clean_ids = []
                for tid in track_ids:
                    if isinstance(tid, str) and len(tid) == 22 and tid.isalnum():
                        # Valid Spotify track ID format
                        clean_ids.append(tid)
                
                # Check if cleaning helped
                if set(clean_ids) == original_ids and len(clean_ids) == len(songs):
                    print(f"  ✓ Successfully cleaned and ordered {len(clean_ids)} tracks in {category_name}")
                    return clean_ids
                
                print(f"  Using original order for {category_name}")
                return original_order
                
        except Exception as e:
            print(f"  Error ordering {category_name}: {e}")
            return original_order
    
    def _order_large_group(self, songs: List[Dict], category_name: str, reorder_style: Optional[str],
                          user_intent: Optional[str], personal_tone: Optional[str]) -> List[str]:
        """
        Orders a large group by splitting into sub-chunks and ordering each.
        """
        print(f"    Large group detected ({len(songs)} songs), using sub-chunking...")
        
        # Split into chunks of 6 songs each
        chunk_size = 6
        chunks = [songs[i:i + chunk_size] for i in range(0, len(songs), chunk_size)]
        
        ordered_chunks = []
        all_processed_ids = set()
        
        for i, chunk in enumerate(chunks):
            chunk_name = f"{category_name}_Part_{i+1}"
            ordered_chunk = self._order_small_group(chunk, chunk_name, reorder_style, user_intent, personal_tone)
            
            # Track which IDs we've processed to ensure no duplicates or losses
            chunk_ids = set(ordered_chunk)
            expected_ids = {song["track_info"]["track_id"] for song in chunk}
            
            # Validate this chunk
            if chunk_ids == expected_ids:
                ordered_chunks.extend(ordered_chunk)
                all_processed_ids.update(chunk_ids)
                print(f"    ✓ Successfully processed chunk {i+1} with {len(ordered_chunk)} tracks")
            else:
                print(f"    ⚠ Chunk {i+1} validation failed, using original order")
                original_chunk_order = [song["track_info"]["track_id"] for song in chunk]
                ordered_chunks.extend(original_chunk_order)
                all_processed_ids.update(original_chunk_order)
        
        # Final validation
        original_ids = {song["track_info"]["track_id"] for song in songs}
        if all_processed_ids == original_ids:
            print(f"    ✓ Large group validation passed: {len(ordered_chunks)} tracks")
        else:
            print(f"    ⚠ Large group validation failed!")
            print(f"      Expected: {len(original_ids)} tracks")
            print(f"      Got: {len(all_processed_ids)} tracks")
            print(f"      Missing: {original_ids - all_processed_ids}")
            print(f"      Extra: {all_processed_ids - original_ids}")
            # Return original order if validation fails
            return [song["track_info"]["track_id"] for song in songs]
        
        return ordered_chunks
    
    def _assemble_final_sequence(self, ordered_categories: Dict[str, List[str]], reorder_style: Optional[str],
                                user_intent: Optional[str], personal_tone: Optional[str]) -> List[str]:
        """
        Agent 3: Determines the order of categories and assembles final sequence.
        """
        print("🏗️  Assembling final sequence...")
        
        # For now, use a simple logical order based on category names
        # Could be enhanced with another LLM call to determine optimal category order
        
        category_priority = self._determine_category_order(list(ordered_categories.keys()), reorder_style)
        
        final_sequence = []
        for category in category_priority:
            if category in ordered_categories:
                final_sequence.extend(ordered_categories[category])
                print(f"  Added {len(ordered_categories[category])} tracks from '{category}'")
        
        return final_sequence
    
    def _determine_category_order(self, categories: List[str], reorder_style: Optional[str]) -> List[str]:
        """
        Determines the logical order of categories.
        """
        # Simple heuristic-based ordering
        priority_keywords = {
            'opening': 0, 'intro': 0, 'beginning': 0, 'start': 0,
            'building': 1, 'rise': 1, 'growing': 1, 'development': 1,
            'peak': 2, 'climax': 2, 'high': 2, 'intense': 2,
            'emotional': 3, 'heart': 3, 'core': 3, 'deep': 3,
            'resolution': 4, 'ending': 4, 'outro': 4, 'conclusion': 4
        }
        
        def category_score(category: str) -> int:
            category_lower = category.lower()
            for keyword, score in priority_keywords.items():
                if keyword in category_lower:
                    return score
            return 3  # Default to middle (changed from 2.5 to 3 for int return)
        
        return sorted(categories, key=category_score)
    
    def _fallback_categorization(self, song_analyses: List[Dict]) -> Dict[str, List[Dict]]:
        """
        Fallback categorization if LLM fails.
        """
        print("Using fallback categorization...")
        
        total_songs = len(song_analyses)
        chunk_size = max(1, total_songs // 4)
        
        categories = {
            "Opening": song_analyses[:chunk_size],
            "Development": song_analyses[chunk_size:chunk_size*2],
            "Peak": song_analyses[chunk_size*2:chunk_size*3],
            "Resolution": song_analyses[chunk_size*3:]
        }
        
        return categories


# New main function that uses the hierarchical agent
def sequence_playlist(song_analyses: list, reorder_style: Optional[str] = None, user_intent: Optional[str] = None, personal_tone: Optional[str] = None) -> list[str]:
    """
    Main entry point for hierarchical playlist sequencing.
    """
    agent = HierarchicalPlaylistAgent()
    return agent.sequence_playlist(song_analyses, reorder_style, user_intent, personal_tone)
