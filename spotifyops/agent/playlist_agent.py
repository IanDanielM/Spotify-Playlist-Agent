import json

from langchain import hub
from langchain.agents import AgentExecutor, create_react_agent
from langchain_openai import ChatOpenAI
from logic.embedding_store import search_song_memory
from tools.browser_tool import get_song_info
from tools.genius import get_song_lyrics


class DrakePlaylistAgent:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o", temperature=0.2)

        self.tools = [get_song_lyrics, get_song_info, search_song_memory]

        prompt = hub.pull("hwchase17/react")

        prompt.template = """
        You are The 6 God Chronologer, a music analyst with a perfect, persistent memory. Your mission is to analyze a given song by synthesizing your existing knowledge with new information.

        You have access to the following tools:
        {tools}

        To use a tool, please use the following format:

        Thought: Do I need to use a tool? Yes
        Action: The action to take, should be one of [{tool_names}]
        Action Input: The input to the action

        For every new song, your FIRST action MUST be to use the `search_song_memory` tool. Formulate a query based on the song's title and your general knowledge about its themes.
        For get_song_lyrics tool, provide the input as a JSON object (not a string) like this: {{"artist_name": "Drake", "song_name": "Song Title"}}
        If public events or specific people might be relevant, you can use get_song_info tool to gather more context.
        Once you have the context from your memory and the new lyrics, perform your analysis. In your Thought process, explain how the memory context informs your analysis of the new song. Your Final Answer must be a single JSON object.

        When you have a response to say to the Human, or if you do not need to use a tool, you MUST use the format:

        Thought: Do I need to use a tool? No
        Final Answer: [Your Final Answer must be a single JSON object with the keys "analysis_summary", "narrative_category", and "emotional_tone". Do not include any other text or markdown formatting.]

        Begin!

        USER'S INPUT:
        --------------------
        {input}

        AGENT'S SCRATCHPAD (Thoughts, Actions, and Observations):
        --------------------
        {agent_scratchpad}
        """

        agent = create_react_agent(self.llm, self.tools, prompt)

        self.agent_executor = AgentExecutor(
            agent=agent,
            tools=self.tools,
            verbose=True,
            max_iterations=5, 
            handle_parsing_errors=True,
        )

    def analyze_song(self, song_name: str, artist_name: str = "Drake") -> dict:
        """Runs the ReAct agent for a single song and returns the structured analysis."""
        input_prompt = f"Analyze the song: '{song_name}' by '{artist_name}'"
        try:
            response = self.agent_executor.invoke({"input": input_prompt})
            return json.loads(response['output'])
        except json.JSONDecodeError:
            raw_output = response.get('output', '')
            print(f"output from LLM was: {raw_output}")
            return {"error": "Failed to parse agent output", "raw_output": raw_output}
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return {"error": "An unexpected error occurred during agent execution."}