import pandas as pd
import chromadb
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
import os
import uuid

def load_csv_data(file_path):
    """Load and process the CSV file containing the book content"""
    try:
        # Read the CSV file
        df = pd.read_csv(file_path, header=None, names=['content'])
        
        # Remove empty rows and clean the text
        df['content'] = df['content'].astype(str)
        df = df[df['content'].str.strip() != '']
        df = df[df['content'] != 'nan']
        
        # Combine all text into a single string
        full_text = ' '.join(df['content'].tolist())
        
        print(f"Loaded {len(df)} rows from CSV file")
        print(f"Total text length: {len(full_text)} characters")
        
        return full_text
    
    except Exception as e:
        print(f"Error loading CSV file: {e}")
        return None

def chunk_text(text, chunk_size=1000, chunk_overlap=200):
    """Split the text into smaller chunks for better embedding"""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    
    chunks = text_splitter.split_text(text)
    
    # Create Document objects
    documents = []
    for i, chunk in enumerate(chunks):
        if chunk.strip():  # Only add non-empty chunks
            doc = Document(
                page_content=chunk,
                metadata={
                    "chunk_id": i,
                    "source": "Introduction-to-Java-Programming-Liang.csv",
                    "chunk_size": len(chunk)
                }
            )
            documents.append(doc)
    
    print(f"Created {len(documents)} text chunks")
    return documents

def create_vector_store(documents, persist_directory="./chroma_db"):
    """Create a vector store using ChromaDB and Hugging Face embeddings (free)"""
    try:
        print("Initializing Hugging Face embeddings (this may take a moment for first use)...")
        # Initialize Hugging Face embeddings (completely free)
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        
        print(f"Creating vector store with {len(documents)} documents...")
        
        # Create the vector store
        vector_store = Chroma.from_documents(
            documents=documents,
            embedding=embeddings,
            persist_directory=persist_directory,
            collection_name="java_programming_book"
        )
        
        print(f"✅ Created vector store with {len(documents)} documents")
        print(f"📁 Vector store persisted to: {persist_directory}")
        
        return vector_store
    
    except Exception as e:
        print(f"❌ Error creating vector store: {e}")
        return None

def load_existing_vector_store(persist_directory=None):
    """Load an existing vector store"""
    try:
        # Use absolute path based on this file's location
        if persist_directory is None:
            persist_directory = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_db")
        
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        
        vector_store = Chroma(
            persist_directory=persist_directory,
            embedding_function=embeddings,
            collection_name="java_programming_book"
        )
        
        print("📖 Loaded existing vector store")
        return vector_store
    
    except Exception as e:
        print(f"❌ Error loading vector store: {e}")
        return None

def search_similar_documents(vector_store, query, k=3):
    """Search for similar documents based on the query"""
    try:
        # Perform similarity search
        docs = vector_store.similarity_search(query, k=k)
        
        print(f"Found {len(docs)} similar documents for query: '{query}'")
        
        relevant_content = []
        for i, doc in enumerate(docs):
            print(f"\n--- Document {i+1} ---")
            print(f"Content: {doc.page_content[:200]}...")
            print(f"Metadata: {doc.metadata}")
            relevant_content.append(doc.page_content)
        
        return relevant_content
    
    except Exception as e:
        print(f"Error searching documents: {e}")
        return []

def main():
    """Main function to vectorize the CSV file"""
    csv_file_path = "Introduction-to-Java-Programming-Liang.csv"
    persist_directory = "./chroma_db"
    
    # Check if vector store already exists
    if os.path.exists(persist_directory):
        print("Vector store already exists. Loading existing store...")
        vector_store = load_existing_vector_store(persist_directory)
        
        if vector_store:
            # Test search
            test_query = "what is a loop?"
            results = search_similar_documents(vector_store, test_query)
            return vector_store
    else:
        print("Creating new vector store...")
        
        # Load the CSV data
        text_content = load_csv_data(csv_file_path)
        if not text_content:
            print("Failed to load CSV data")
            return None
        
        # Chunk the text
        documents = chunk_text(text_content)
        if not documents:
            print("Failed to create text chunks")
            return None
        
        # Create vector store
        vector_store = create_vector_store(documents, persist_directory)
        if vector_store:
            print("Vector store created successfully!")
            
            # Test search
            test_query = "what is a loop?"
            results = search_similar_documents(vector_store, test_query)
            
            return vector_store
        else:
            print("Failed to create vector store")
            return None

def get_relevant_context(query, k=3):
    """Helper function to get relevant context for a query"""
    try:
        # Load the vector store
        vector_store = load_existing_vector_store()
        if not vector_store:
            print("No vector store found. Please run vectorization first.")
            return []
        
        # Search for relevant documents
        docs = vector_store.similarity_search(query, k=k)
        return [doc.page_content for doc in docs]
    
    except Exception as e:
        print(f"Error getting relevant context: {e}")
        return []

if __name__ == "__main__":
    # Install required packages if needed
    try:
        import pandas as pd
    except ImportError:
        print("Installing pandas...")
        os.system("pip install pandas")
        import pandas as pd
    
    main()
