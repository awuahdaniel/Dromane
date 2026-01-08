import pkgutil
import langchain
import langchain.chains

print(f"Langchain version: {langchain.__version__}")
try:
    from langchain.chains import ConversationalRetrievalChain
    print("Direct import: OK")
except ImportError:
    print("Direct import: FAILED")

# List all submodules in langchain.chains
print("Submodules in langchain.chains:")
for loader, module_name, is_pkg in pkgutil.walk_packages(langchain.chains.__path__):
    print(module_name)
