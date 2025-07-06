#!/usr/bin/env python3

import sys
sys.path.append('/home/ian/myspotifyagent')

from dotenv import load_dotenv
load_dotenv()

from langchain_deepseek import ChatDeepSeek

def test_llm():
    print("Testing ChatDeepSeek directly...")
    
    try:
        llm = ChatDeepSeek(model="deepseek-chat")
        print("✓ LLM created successfully")
        
        simple_prompt = "Return only the JSON: {\"test\": \"value\"}"
        response = llm.invoke(simple_prompt)
        
        print(f"Response type: {type(response)}")
        print(f"Response content type: {type(response.content)}")
        print(f"Response content: '{response.content}'")
        
        return True
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_llm()
    sys.exit(0 if success else 1)
