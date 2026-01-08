try:
    import langchain
    print(f"langchain: OK ({langchain.__version__})")
except ImportError as e:
    print(f"langchain: FAILED - {e}")

try:
    import langchain_core
    print(f"langchain_core: OK ({langchain_core.__version__})")
except ImportError as e:
    print(f"langchain_core: FAILED - {e}")

try:
    import langchain_community
    print(f"langchain_community: OK ({langchain_community.__version__})")
except ImportError as e:
    print(f"langchain_community: FAILED - {e}")

try:
    import langchain_openai
    print(f"langchain_openai: OK ({langchain_openai.__version__})")
except ImportError as e:
    print(f"langchain_openai: FAILED - {e}")

try:
    import pypdf
    print(f"pypdf: OK")
except ImportError as e:
    print(f"pypdf: FAILED - {e}")

try:
    import faiss
    print(f"faiss: OK")
except ImportError as e:
    print(f"faiss: FAILED - {e}")

try:
    import numpy
    print(f"numpy: OK ({numpy.__version__})")
except ImportError as e:
    print(f"numpy: FAILED - {e}")
