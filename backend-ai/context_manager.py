from database import get_db_connection
import json
from typing import List, Dict, Optional
import datetime

class ResearchContextManager:
    def __init__(self):
        # No heavy ML models init here
        pass
    
    def get_or_create_session(self, user_id: int, inferred_topic: str = None) -> int:
        """Get active session or create new one"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Check for active session
            cursor.execute("""
                SELECT id FROM research_sessions 
                WHERE user_id = %s AND is_active = TRUE 
                ORDER BY updated_at DESC LIMIT 1
            """, (user_id,))
            
            result = cursor.fetchone()
            
            if result:
                return result['id']
            
            # Create new session if none active
            print(f"Creating new research session for user {user_id}, topic: {inferred_topic}")
            topic = inferred_topic if inferred_topic else "General Research"
            
            cursor.execute("""
                INSERT INTO research_sessions (user_id, primary_topic, is_active)
                VALUES (%s, %s, TRUE)
            """, (user_id, topic))
            
            conn.commit()
            return cursor.lastrowid
            
        except Exception as e:
            print(f"Error in get_or_create_session: {e}")
            raise
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def store_entry(self, session_id: int, query: str, response: str, extracted_facts: str = None, sources: int = 0):
        """Store research entry without embedding"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            # We explicitly store NULL for query_embedding as we removed local vector support
            cursor.execute("""
                INSERT INTO research_entries 
                (session_id, query, response, extracted_facts, query_embedding, sources_used)
                VALUES (%s, %s, %s, %s, NULL, %s)
            """, (session_id, query, response, extracted_facts, sources))
            
            # Update session timestamp
            cursor.execute("""
                UPDATE research_sessions 
                SET updated_at = NOW() 
                WHERE id = %s
            """, (session_id,))
            
            conn.commit()
            
        except Exception as e:
            print(f"Error storing research entry: {e}")
            # Don't fail the request if storage fails
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def retrieve_context(self, session_id: int, current_query: str, limit: int = 10) -> Dict:
        """Retrieve relevant context using only DB history (No Embeddings)"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        context = {
            'session_summary': None,
            'recent_entries': [],
            'similar_entries': [], # Removed - Can't do semantic search without vectors
            'primary_topic': None
        }
        
        try:
            # Get session info
            cursor.execute("""
                SELECT primary_topic, session_summary 
                FROM research_sessions WHERE id = %s
            """, (session_id,))
            session = cursor.fetchone()
            if session:
                context['primary_topic'] = session['primary_topic']
                context['session_summary'] = session['session_summary']
            
            # Get recent entries (increased limit since we rely on this more now)
            cursor.execute("""
                SELECT query, response, extracted_facts, created_at 
                FROM research_entries 
                WHERE session_id = %s 
                ORDER BY created_at DESC LIMIT %s
            """, (session_id, limit))
            context['recent_entries'] = cursor.fetchall()
            
            return context
            
        except Exception as e:
            print(f"Error retrieving context: {e}")
            return context
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def update_session_topic_if_needed(self, session_id: int, query: str):
        """Update generic topic name if specific query provided"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT primary_topic FROM research_sessions WHERE id = %s", (session_id,))
            result = cursor.fetchone()
            if result and result['primary_topic'] == "General Research":
                # Basic heuristic: Use first 5-6 words of query as topic
                new_topic = " ".join(query.split()[:6])
                cursor.execute("UPDATE research_sessions SET primary_topic = %s WHERE id = %s", (new_topic, session_id))
                conn.commit()
        except Exception:
            pass
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def get_user_sessions(self, user_id: int) -> List[Dict]:
        """Get all sessions for a user"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT id, primary_topic, session_summary, updated_at 
                FROM research_sessions 
                WHERE user_id = %s 
                ORDER BY updated_at DESC
            """, (user_id,))
            return cursor.fetchall()
        except Exception as e:
            print(f"Error getting user sessions: {e}")
            return []
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
