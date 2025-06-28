import requests
from bs4 import BeautifulSoup
from langchain.tools import tool
from langchain_tavily import TavilySearch


@tool
def get_song_info(search_string: str):
    """
    Use Tavily Search to info about particlar song if GPT doesnt have
    """
    tavily_tool = TavilySearch(max_results=3, name="tavily_search_results_json")
    search_results = tavily_tool.run(search_string)

    if not search_results:
        return "No search results found."
    
    # Parse the search results
    results = []
    for result in search_results['results']:
        title = result.get('title', 'No title')
        url = result.get('url', 'No URL')
        snippet = result.get('snippet', 'No snippet')
        
        # Fetch the page content for more details
        try:
            response = requests.get(url)
            soup = BeautifulSoup(response.content, 'html.parser')
            content = soup.get_text()
        except Exception as e:
            content = f"Error fetching content: {e}"
        
        results.append({
            'title': title,
            'url': url,
            'snippet': snippet,
            'content': content
        })
        
    return results




