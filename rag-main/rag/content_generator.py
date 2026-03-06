"""
Pre-generate and store all topic content from Mistral AI
Run this script once to generate all content, then API serves from files
"""

import os
import sys
import json
import time
from datetime import datetime

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Directory to store pre-generated content
CONTENT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated_content")
os.makedirs(CONTENT_DIR, exist_ok=True)

# Metadata file to track generation status
METADATA_FILE = os.path.join(CONTENT_DIR, "_metadata.json")


def get_content_filepath(topic_id):
    """Get the filepath for a topic's content file"""
    return os.path.join(CONTENT_DIR, f"topic_{topic_id}.json")


def load_metadata():
    """Load generation metadata"""
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        "generated_at": None,
        "topics_generated": [],
        "total_topics": 0,
        "version": "1.0"
    }


def save_metadata(metadata):
    """Save generation metadata"""
    with open(METADATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)


def is_content_generated(topic_id):
    """Check if content already exists for a topic"""
    filepath = get_content_filepath(topic_id)
    return os.path.exists(filepath)


def load_generated_content(topic_id):
    """Load pre-generated content for a topic"""
    filepath = get_content_filepath(topic_id)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None


def save_generated_content(topic_id, content_data):
    """Save generated content for a topic"""
    filepath = get_content_filepath(topic_id)
    content_data['_generated_at'] = datetime.now().isoformat()
    content_data['_topic_id'] = topic_id
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(content_data, f, ensure_ascii=False, indent=2)
    
    print(f"   💾 Saved content to {filepath}")


def generate_topic_content(topic_info, chapter_data, format_content_with_ai, generate_fallback_content, get_relevant_context):
    """Generate content for a single topic"""
    topic_id = topic_info['id']
    
    print(f"\n{'='*50}")
    print(f"📖 Generating: {topic_info['title']}")
    print(f"   Topic ID: {topic_id}")
    
    # Check if already generated
    if is_content_generated(topic_id):
        print(f"   ⚡ Already exists - skipping")
        return load_generated_content(topic_id)
    
    # Get RAG context
    query = topic_info.get('query', topic_info['title'])
    print(f"   🔍 Searching RAG: {query[:50]}...")
    
    raw_docs = get_relevant_context(query, k=10)
    raw_context = '\n\n'.join(raw_docs) if raw_docs else ''
    
    print(f"   📚 Retrieved {len(raw_context)} chars of context")
    
    # Generate with Mistral AI
    sections = None
    if raw_context and len(raw_context) > 100:
        print(f"   🤖 Calling Mistral AI...")
        sections = format_content_with_ai(raw_context, topic_info)
    
    if not sections:
        print(f"   ⚠️ Using fallback content")
        sections = generate_fallback_content(topic_info)
    
    # Create content data structure
    content_data = {
        'topic': {
            'id': topic_id,
            'title': topic_info['title'],
            'description': topic_info['description'],
            'chapter_id': int(topic_id.split('-')[0]),
            'chapter_title': chapter_data['title']
        },
        'sections': sections,
        'total_pages': len(sections)
    }
    
    # Save to file
    save_generated_content(topic_id, content_data)
    
    print(f"   ✅ Generated {len(sections)} sections")
    
    # Rate limiting - wait between API calls
    time.sleep(1.5)
    
    return content_data


def generate_all_content(force_regenerate=False):
    """Generate content for ALL topics"""
    # Import here to avoid circular imports
    from api import (
        CHAPTER_TOPICS, 
        format_content_with_ai, 
        generate_fallback_content
    )
    from vector import get_relevant_context, load_existing_vector_store
    
    print("\n" + "="*60)
    print("🚀 CONTENT GENERATION STARTED")
    print("="*60)
    
    # Load vector store
    print("\n📚 Loading vector store...")
    load_existing_vector_store()
    
    # Load metadata
    metadata = load_metadata()
    
    # Count total topics
    total_topics = sum(len(c['topics']) for c in CHAPTER_TOPICS.values())
    print(f"\n📋 Total topics to process: {total_topics}")
    
    if force_regenerate:
        print("⚠️ Force regenerate enabled - will overwrite existing content")
        # Clear existing files
        for file in os.listdir(CONTENT_DIR):
            if file.startswith('topic_') and file.endswith('.json'):
                os.remove(os.path.join(CONTENT_DIR, file))
        metadata['topics_generated'] = []
    
    # Track progress
    generated_count = 0
    skipped_count = 0
    failed_topics = []
    
    # Generate content for each topic
    for chapter_id, chapter_data in CHAPTER_TOPICS.items():
        print(f"\n{'='*50}")
        print(f"📚 CHAPTER {chapter_id}: {chapter_data['title']}")
        print(f"{'='*50}")
        
        for topic_info in chapter_data['topics']:
            topic_id = topic_info['id']
            
            try:
                if is_content_generated(topic_id) and not force_regenerate:
                    print(f"   ⚡ {topic_id}: Already exists - skipping")
                    skipped_count += 1
                    continue
                
                generate_topic_content(
                    topic_info, 
                    chapter_data,
                    format_content_with_ai,
                    generate_fallback_content,
                    get_relevant_context
                )
                generated_count += 1
                
                # Update metadata
                if topic_id not in metadata['topics_generated']:
                    metadata['topics_generated'].append(topic_id)
                
            except Exception as e:
                print(f"   ❌ {topic_id}: Failed - {e}")
                import traceback
                traceback.print_exc()
                failed_topics.append({'id': topic_id, 'error': str(e)})
    
    # Update and save metadata
    metadata['generated_at'] = datetime.now().isoformat()
    metadata['total_topics'] = total_topics
    metadata['failed_topics'] = failed_topics
    save_metadata(metadata)
    
    # Print summary
    print("\n" + "="*60)
    print("📊 GENERATION COMPLETE")
    print("="*60)
    print(f"   ✅ Generated: {generated_count}")
    print(f"   ⚡ Skipped (existed): {skipped_count}")
    print(f"   ❌ Failed: {len(failed_topics)}")
    print(f"   📁 Content saved to: {CONTENT_DIR}")
    
    if failed_topics:
        print(f"\n⚠️ Failed topics:")
        for ft in failed_topics:
            print(f"   - {ft['id']}: {ft['error']}")
    
    return {
        'generated': generated_count,
        'skipped': skipped_count,
        'failed': len(failed_topics),
        'total': total_topics
    }


def regenerate_topic(topic_id):
    """Regenerate content for a specific topic"""
    from api import (
        CHAPTER_TOPICS, 
        format_content_with_ai, 
        generate_fallback_content
    )
    from vector import get_relevant_context, load_existing_vector_store
    
    # Load vector store
    load_existing_vector_store()
    
    # Find the topic
    for chapter_id, chapter_data in CHAPTER_TOPICS.items():
        for topic_info in chapter_data['topics']:
            if topic_info['id'] == topic_id:
                # Delete existing file
                filepath = get_content_filepath(topic_id)
                if os.path.exists(filepath):
                    os.remove(filepath)
                
                # Regenerate
                return generate_topic_content(
                    topic_info, 
                    chapter_data,
                    format_content_with_ai,
                    generate_fallback_content,
                    get_relevant_context
                )
    
    return None


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate learning content from Mistral AI')
    parser.add_argument('--force', action='store_true', help='Force regenerate all content')
    parser.add_argument('--topic', type=str, help='Regenerate specific topic (e.g., "1-7")')
    
    args = parser.parse_args()
    
    if args.topic:
        print(f"🔄 Regenerating topic: {args.topic}")
        result = regenerate_topic(args.topic)
        if result:
            print(f"✅ Topic {args.topic} regenerated successfully")
        else:
            print(f"❌ Topic {args.topic} not found")
    else:
        generate_all_content(force_regenerate=args.force)
