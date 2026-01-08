try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    print("langchain.text_splitter: OK")
except ImportError as e:
    print(f"langchain.text_splitter: FAILED - {e}")

try:
    from langchain_community.vectorstores import FAISS
    print("langchain_community.vectorstores.FAISS: OK")
except ImportError as e:
    print(f"langchain_community.vectorstores.FAISS: FAILED - {e}")

try:
    from langchain.chains import ConversationalRetrievalChain
    print("langchain.chains: OK")
except ImportError as e:
    print(f"langchain.chains: FAILED - {e}")
