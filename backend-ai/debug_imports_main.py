try:
    print("Testing imports...")
    import main
    print("Main imported successfully")
except Exception as e:
    import traceback
    traceback.print_exc()
