from langchain.tools import tool
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

CHROMA_PERSIST_DIRECTORY = "spotifyops/data/chroma_db"

class VectorMemory:
    def __init__(self):
        self.embedding_function = OpenAIEmbeddings(model="text-embedding-3-small")
        self.vector_store = Chroma(
            collection_name="spotifyops_vector_memory",
            persist_directory=CHROMA_PERSIST_DIRECTORY,
            embedding_function=self.embedding_function
        )

    def get_existing_analysis(self, track_id: str) -> dict | None:
        """
        Checks if an analysis for a given track_id already exists in the vector store.
        Returns the complete analysis object if found, otherwise None.
        """
        result = self.vector_store.get(ids=[track_id], include=["metadatas"])
        if result and result.get('metadatas') and len(result['metadatas']) > 0:
            metadata = result['metadatas'][0]
            reconstructed_analysis = {
                "track_info": {
                    "track_id": metadata["track_id"],
                    "artist": metadata["artist"],
                    "name": metadata["name"],
                    "album_name": metadata["album_name"],
                    "popularity": metadata["popularity"],
                },
                "analysis": {
                    "narrative_category": metadata["narrative_category"],
                    "emotional_tone": metadata["emotional_tone"],
                    "analysis_summary": metadata["analysis_summary"],
                }
            }
            return reconstructed_analysis
        return None
    
    def get_all_analyses(self) -> list[dict]:
        """
        Retrieves all song analyses stored in the vector memory.
        Returns a list of dictionaries containing track info and analysis.
        """
        results = self.vector_store.get(include=["metadatas"])
        
        analyses = []
        
        if not results or 'metadatas' not in results:
            return analyses
        
        for metadata in results['metadatas']:
            if not metadata:
                continue
                
            reconstructed_analysis = {
                "track_info": {
                    "track_id": metadata.get("track_id"),
                    "artist": metadata.get("artist"),
                    "name": metadata.get("name"),
                    "album_name": metadata.get("album_name"),
                    "popularity": metadata.get("popularity"),
                },
                "analysis": {
                    "narrative_category": metadata.get("narrative_category"),
                    "emotional_tone": metadata.get("emotional_tone"),
                    "analysis_summary": metadata.get("analysis_summary"),
                }
            }
            analyses.append(reconstructed_analysis)
        
        return analyses

    def add_song_analysis(self, track_info: dict, analysis: dict):
        text_to_embed = f"Song: {track_info['name']}\nAlbum: {track_info['album_name']}\nAnalysis: {analysis['analysis_summary']}"
        metadata = {
            "track_id": track_info['track_id'],
            "artist": track_info['artist'],
            "name": track_info['name'],
            "album_name": track_info['album_name'],
            "popularity": track_info['popularity'],
            "narrative_category": analysis['narrative_category'],
            "emotional_tone": analysis['emotional_tone'],
            "analysis_summary": analysis['analysis_summary']
        }
        self.vector_store.add_texts(
            texts=[text_to_embed], metadatas=[metadata], ids=[track_info['track_id']]
        )
        print(f"--- Brain activity: Added/Updated '{track_info['name']}' in Vector Memory ---")


    def find_similar_songs(self, query_text: str, k: int = 3) -> list:
        """Finds the 'k' most similar songs to a given text query."""
        print(f"Searching for songs similar to '{query_text}'... ---")
        results = self.vector_store.similarity_search(query=query_text, k=k)
        return results
    

@tool
def search_song_memory(query: str) -> str:
    """
    Searches the agent's long-term memory (vector store) for context about
    conceptually similar songs that have already been analyzed. Use this tool
    first to gather context before analyzing a new song. The query should be a
    concise description of the song's suspected theme.
    Example Query: "A song about heartbreak and drunk dialing late at night"
    """
    memory = VectorMemory()
    results = memory.find_similar_songs(query_text=query, k=2)

    if not results:
        return "No similar songs found in memory."

    context = "Found relevant context in memory from similar songs:\n"
    for doc in results:
        context += f"- {doc.page_content}\n  Metadata: {doc.metadata}\n"
    return context